// src/lib/api/CvrClient/cvrClient.ts

export type CvrOpslag = {
  cvr: string;
  navn: string;
  adresse: string | null;
  postnummer: string | null;
  by: string | null;
  ansatte: number | null;
  branche: string | null;
  virksomhedstype: string | null;
  stiftet: string | null;
};

type CvrApiSvar = {
  vat?: string;
  name?: string;
  address?: string;
  zipcode?: string;
  city?: string;
  employees?: number;
  industrydesc?: string;
  companydesc?: string;
  startdate?: string;
  error?: string;
};

const BASE_URL = 'https://cvrapi.dk/api';
const USER_AGENT = 'KeasCare Markedssignaler - mads@onlinerelation.dk';

async function forespørgCvr(params: Record<string, string>): Promise<CvrOpslag | null> {
  const qs = new URLSearchParams({ country: 'dk', ...params }).toString();
  const url = `${BASE_URL}?${qs}`;

  const res = await fetch(url, {
    headers: { 'User-Agent': USER_AGENT },
    next: { revalidate: 0 },
  });

  if (!res.ok) return null;

  const data: CvrApiSvar = await res.json();
  if (data.error || !data.vat) return null;

  const adresseDele = [data.address, data.zipcode && data.city ? `${data.zipcode} ${data.city}` : null]
    .filter(Boolean)
    .join(', ');

  return {
    cvr: data.vat,
    navn: data.name ?? '',
    adresse: adresseDele || null,
    postnummer: data.zipcode ?? null,
    by: data.city ?? null,
    ansatte: typeof data.employees === 'number' ? data.employees : null,
    branche: data.industrydesc ?? null,
    virksomhedstype: data.companydesc ?? null,
    stiftet: data.startdate ?? null,
  };
}

export async function slaaCvrOp(cvr: string): Promise<CvrOpslag | null> {
  return forespørgCvr({ vat: cvr });
}

export async function slaaPNummerOp(pNummer: string): Promise<CvrOpslag | null> {
  // cvrapi.dk bruger 'produ' parameteren til P-nummer (produktionsenhed)
  return forespørgCvr({ produ: pNummer });
}
