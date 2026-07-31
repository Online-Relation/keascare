// src/app/dashboard/produkter/page.tsx

import { hentProduktStatistik } from '@/features/monday/services/MondayProdukterService';
import { ProdukterPage } from '@/features/monday/components/ProdukterPage';

export const dynamic = 'force-dynamic';

export default async function ProdukterServerPage() {
  const data = await hentProduktStatistik();
  return <ProdukterPage data={data} />;
}
