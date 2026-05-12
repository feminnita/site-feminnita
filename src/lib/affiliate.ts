const STORAGE_KEY = "feminnita_ref";
const EXPIRY_KEY = "feminnita_ref_exp";
const TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 dias

export function saveAffiliateCode(code: string) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, code.toUpperCase());
  localStorage.setItem(EXPIRY_KEY, String(Date.now() + TTL_MS));
}

export function getAffiliateCode(): string | null {
  if (typeof window === "undefined") return null;
  const exp = localStorage.getItem(EXPIRY_KEY);
  if (exp && Date.now() > parseInt(exp)) {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(EXPIRY_KEY);
    return null;
  }
  return localStorage.getItem(STORAGE_KEY);
}

export function clearAffiliateCode() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(EXPIRY_KEY);
}
