// app/(main)/admin/competitions/[code]/dashboard/page.tsx

import React from 'react';
import { notFound } from 'next/navigation';

// Dummy data fetching function (replace with your API call)
async function getCompetitionByCode(code: string) {
  // Replace this with a real API call to your backend
  const mockCompetition = {
    id: '123',
    name: 'Sample Competition',
    code: code,
    createdAt: new Date().toISOString(),
  };

  // Simulate a not-found case
  if (code !== 'sample') {
    return null;
  }

  return mockCompetition;
}

export default async function CompetitionDashboardPage({ params }: { params: { code: string } }) {
  const competition = await getCompetitionByCode(params.code);

  if (!competition) {
    notFound();
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Competition Dashboard</h1>
      <p><strong>ID:</strong> {competition.id}</p>
      <p><strong>Name:</strong> {competition.name}</p>
      <p><strong>Code:</strong> {competition.code}</p>
      <p><strong>Created At:</strong> {competition.createdAt}</p>
    </div>
  );
}
