// src/app/dashboard/produkter/page.tsx

import { hentProduktStatistik } from '@/features/monday/services/MondayProdukterService';
import { ProdukterPage } from '@/features/monday/components/ProdukterPage';

// Cache i 1 time — Monday API er langsomt med subitem-paginering
export const revalidate = 3600;

export default async function ProdukterServerPage() {
  const data = await hentProduktStatistik();
  return <ProdukterPage data={data} />;
}
