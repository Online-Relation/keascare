// src/app/db-test/page.tsx

import { getDbClient } from '@/lib/db/DbClient';
import { getSupabaseServerClient } from '@/lib/db/SupabaseClient';

type DbTestResult = {
  ok: boolean;
  label: string;
  detail: string;
  error?: string;
};

async function testDirectConnection(): Promise<DbTestResult> {
  try {
    const db = getDbClient();
    const result = await db.query<{ version: string }>('SELECT version()');
    const version = result.rows[0]?.version ?? 'ukendt';
    return {
      ok: true,
      label: 'PostgreSQL (direkte pg)',
      detail: version,
    };
  } catch (err) {
    return {
      ok: false,
      label: 'PostgreSQL (direkte pg)',
      detail: 'Forbindelsen fejlede',
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

async function testSupabaseConnection(): Promise<DbTestResult> {
  try {
    const supabase = getSupabaseServerClient();
    const { error } = await supabase.from('_test_ping').select('*').limit(1);

    // PGRST200/PGRST205 = tabel ikke i schema cache (PostgREST), 42P01 = undefined_table (Postgres)
    // Disse koder er forventede på en tom database – vi er forbundet men ingen tabeller endnu
    const expectedCodes = ['PGRST200', 'PGRST205', 'PGRST116', '42P01'];
    if (error && !expectedCodes.includes(error.code ?? '')) {
      return {
        ok: false,
        label: 'Supabase JS-klient',
        detail: 'Forbindelsen fejlede',
        error: error.message,
      };
    }

    return {
      ok: true,
      label: 'Supabase JS-klient',
      detail: 'Forbundet til Supabase (databasen er tom – som forventet)',
    };
  } catch (err) {
    return {
      ok: false,
      label: 'Supabase JS-klient',
      detail: 'Forbindelsen fejlede',
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

export default async function DbTestPage() {
  const [pgResult, supabaseResult] = await Promise.all([
    testDirectConnection(),
    testSupabaseConnection(),
  ]);

  const results: DbTestResult[] = [pgResult, supabaseResult];
  const allOk = results.every((r) => r.ok);

  return (
    <main className="min-h-screen bg-gray-50 p-10">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-semibold text-gray-900 mb-1">Databaseforbindelser</h1>
        <p className="text-sm text-gray-500 mb-8">
          KeasCare · Supabase + Railway · Testside
        </p>

        <div
          className={`rounded-lg border px-5 py-4 mb-8 text-sm font-medium ${
            allOk
              ? 'bg-green-50 border-green-200 text-green-800'
              : 'bg-red-50 border-red-200 text-red-800'
          }`}
        >
          {allOk ? '✓ Alle forbindelser OK' : '✗ En eller flere forbindelser fejlede'}
        </div>

        <div className="space-y-4">
          {results.map((result) => (
            <div
              key={result.label}
              className="bg-white border border-gray-200 rounded-lg p-5"
            >
              <div className="flex items-center gap-3 mb-2">
                <span
                  className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${
                    result.ok ? 'bg-green-500' : 'bg-red-500'
                  }`}
                />
                <span className="font-medium text-gray-900 text-sm">{result.label}</span>
                <span
                  className={`ml-auto text-xs font-medium px-2 py-0.5 rounded-full ${
                    result.ok
                      ? 'bg-green-100 text-green-700'
                      : 'bg-red-100 text-red-700'
                  }`}
                >
                  {result.ok ? 'Forbundet' : 'Fejl'}
                </span>
              </div>
              <p className="text-xs text-gray-500 ml-[1.375rem]">{result.detail}</p>
              {result.error && (
                <p className="text-xs text-red-600 mt-1 ml-[1.375rem] font-mono">
                  {result.error}
                </p>
              )}
            </div>
          ))}
        </div>

        <p className="mt-8 text-xs text-gray-400">
          Denne side bruges kun til at verificere databaseforbindelserne og kan slettes, når forbindelserne er bekræftet.
        </p>
      </div>
    </main>
  );
}
