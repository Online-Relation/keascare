// src/lib/api/MondayClient/mondayClient.ts

const MONDAY_API_URL = 'https://api.monday.com/v2';

export async function mondayQuery<T = unknown>(query: string, variables?: Record<string, unknown>): Promise<T> {
  const apiKey = process.env.MONDAY_API_KEY;
  if (!apiKey) throw new Error('MONDAY_API_KEY mangler i miljøvariabler');

  const res = await fetch(MONDAY_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: apiKey,
      'API-Version': '2024-01',
    },
    body: JSON.stringify({ query, variables }),
    cache: 'no-store',
  });

  if (!res.ok) throw new Error(`Monday API HTTP-fejl: ${res.status}`);

  const json = await res.json();
  if (json.errors?.length) throw new Error(json.errors[0].message);

  return json.data as T;
}
