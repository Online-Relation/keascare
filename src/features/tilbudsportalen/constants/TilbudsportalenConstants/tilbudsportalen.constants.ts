// src/features/tilbudsportalen/constants/TilbudsportalenConstants/tilbudsportalen.constants.ts

export const TP_BASE_URL = 'https://tilbudsportalen.dk/tilbudssoegning';
export const TP_LISTE_URL = `${TP_BASE_URL}/soegVoksneTilbud/index`;
export const TP_DETALJE_URL = `${TP_BASE_URL}/tilbudDetaljeside/index`;
export const TP_AKTIV_MENUPUNKT = 'VOKSNE';
export const TP_RESULTATER_PR_SIDE = 20;
export const TP_DELAY_MS = 800;

export const TP_USER_AGENT =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

export const TP_BROWSER_HEADERS = {
  'User-Agent': TP_USER_AGENT,
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
  'Accept-Language': 'da-DK,da;q=0.9,en-US;q=0.8,en;q=0.7',
  'Accept-Encoding': 'gzip, deflate, br',
  'Cache-Control': 'no-cache',
  'Pragma': 'no-cache',
  'Sec-Fetch-Dest': 'document',
  'Sec-Fetch-Mode': 'navigate',
  'Sec-Fetch-Site': 'none',
  'Sec-Fetch-User': '?1',
  'Upgrade-Insecure-Requests': '1',
};
