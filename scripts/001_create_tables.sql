-- Create profiles table that references auth.users
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- RLS policies for profiles
CREATE POLICY "profiles_select_own" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "profiles_insert_own" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "profiles_delete_own" ON public.profiles FOR DELETE USING (auth.uid() = id);

-- Create projects table
CREATE TABLE IF NOT EXISTS public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  language TEXT DEFAULT 'javascript',
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  is_public BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on projects
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

-- RLS policies for projects (owner can do everything, others can view public projects)
CREATE POLICY "projects_select_own" ON public.projects FOR SELECT USING (
  auth.uid() = owner_id OR is_public = TRUE
);
CREATE POLICY "projects_insert_own" ON public.projects FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "projects_update_own" ON public.projects FOR UPDATE USING (auth.uid() = owner_id);
CREATE POLICY "projects_delete_own" ON public.projects FOR DELETE USING (auth.uid() = owner_id);

-- Create project_collaborators table for sharing
CREATE TABLE IF NOT EXISTS public.project_collaborators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'editor' CHECK (role IN ('viewer', 'editor', 'admin')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(project_id, user_id)
);

-- Enable RLS on project_collaborators
ALTER TABLE public.project_collaborators ENABLE ROW LEVEL SECURITY;

-- RLS policies for project_collaborators
CREATE POLICY "collaborators_select" ON public.project_collaborators FOR SELECT USING (
  auth.uid() = user_id OR 
  auth.uid() IN (SELECT owner_id FROM public.projects WHERE id = project_id)
);
CREATE POLICY "collaborators_insert" ON public.project_collaborators FOR INSERT WITH CHECK (
  auth.uid() IN (SELECT owner_id FROM public.projects WHERE id = project_id)
);
CREATE POLICY "collaborators_delete" ON public.project_collaborators FOR DELETE USING (
  auth.uid() IN (SELECT owner_id FROM public.projects WHERE id = project_id)
);

-- Create files table for project files
CREATE TABLE IF NOT EXISTS public.files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  path TEXT NOT NULL,
  content TEXT DEFAULT '',
  language TEXT DEFAULT 'plaintext',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on files
ALTER TABLE public.files ENABLE ROW LEVEL SECURITY;

-- RLS policies for files (based on project access)
CREATE POLICY "files_select" ON public.files FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.projects 
    WHERE id = project_id AND (owner_id = auth.uid() OR is_public = TRUE)
  ) OR
  EXISTS (
    SELECT 1 FROM public.project_collaborators 
    WHERE project_id = files.project_id AND user_id = auth.uid()
  )
);
CREATE POLICY "files_insert" ON public.files FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.projects WHERE id = project_id AND owner_id = auth.uid()
  ) OR
  EXISTS (
    SELECT 1 FROM public.project_collaborators 
    WHERE project_id = files.project_id AND user_id = auth.uid() AND role IN ('editor', 'admin')
  )
);
CREATE POLICY "files_update" ON public.files FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM public.projects WHERE id = project_id AND owner_id = auth.uid()
  ) OR
  EXISTS (
    SELECT 1 FROM public.project_collaborators 
    WHERE project_id = files.project_id AND user_id = auth.uid() AND role IN ('editor', 'admin')
  )
);
CREATE POLICY "files_delete" ON public.files FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM public.projects WHERE id = project_id AND owner_id = auth.uid()
  ) OR
  EXISTS (
    SELECT 1 FROM public.project_collaborators 
    WHERE project_id = files.project_id AND user_id = auth.uid() AND role = 'admin'
  )
);

-- Trigger to auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'display_name', split_part(NEW.email, '@', 1))
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
