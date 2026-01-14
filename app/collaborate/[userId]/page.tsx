import { redirect } from "next/navigation";
import { CollaborativeEditor } from '@/components/ide/collaborative-editor';

export default async function CollaboratePage({ params }: { params: Promise<{ userId: string }> }) {
  const { userId } = await params;

  // Create a mock user for the collaborative editor
  const mockUser = {
    id: userId,
    email: `${userId}@example.com`,
    user_metadata: { name: userId }
  } as any;

  return (
    <div style={{ padding: 32, height: '100vh', background: '#f9fafb' }}>
      <h1 className="text-2xl font-bold mb-4">Collaboration Session</h1>
      <p className="mb-2">You are joining as: <span className="font-mono bg-muted px-2 py-1 rounded">{userId}</span></p>
      <div style={{ height: '70vh', border: '1px solid #e5e7eb', borderRadius: 8, overflow: 'hidden', background: 'white' }}>
        <CollaborativeEditor roomId={`user_${userId}`} user={mockUser} language="javascript" theme="vs-dark" />
      </div>
    </div>
  );
}
