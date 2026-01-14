import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { IDEWorkspace } from "@/components/ide/ide-workspace"

interface EditorPageProps {
  params: Promise<{ projectId: string }>
}

export default async function EditorPage({ params }: EditorPageProps) {
  const { projectId } = await params
  const supabase = await createClient()

  const { data, error } = await supabase.auth.getUser()
  if (error || !data?.user) {
    redirect("/auth/login")
  }

  return <IDEWorkspace projectId={projectId} user={data.user} />
}
