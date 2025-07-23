import { notFound } from 'next/navigation';

// 🔧 Replace this mock with actual backend API logic if needed
async function getCompetitionByCode(code: string) {
  const mockCompetitions = {
    abc123: {
      id: 'abc123',
      name: 'Math Olympiad',
      code: 'abc123',
      createdAt: new Date().toISOString(),
    },
  };

  return mockCompetitions[code] || null;
}

export default async function CompetitionDashboardPage({ params }: { params: { code: string } }) {
  const competition = await getCompetitionByCode(params.code);

  if (!competition) {
    notFound();
  }

  return (
    <main className="p-6">
      <h1 className="text-2xl font-bold mb-4">Competition Dashboard</h1>
      <div className="space-y-2">
        <p><strong>ID:</strong> {competition.id}</p>
        <p><strong>Name:</strong> {competition.name}</p>
        <p><strong>Code:</strong> {competition.code}</p>
        <p><strong>Created At:</strong> {competition.createdAt}</p>
      </div>
    </main>
  );
}
