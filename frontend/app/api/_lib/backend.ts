const normalizeUrl = (url: string): string => url.replace(/\/$/, '');

const dedupe = (arr: string[]): string[] => Array.from(new Set(arr));

export const resolveBackendCandidates = (): string[] => {
  const configured = process.env.NEXT_PUBLIC_API_URL || '';
  const mappedConfigured = configured.includes('://backend')
    ? configured.replace('://backend', '://127.0.0.1')
    : configured;
  const baseCandidates = [
    mappedConfigured,
    'http://backend:3002',
    'http://host.docker.internal:3003',
    'http://host.docker.internal:3002',
    'http://127.0.0.1:3003',
    'http://localhost:3003',
    'http://127.0.0.1:3002',
    'http://localhost:3002',
  ].filter(Boolean) as string[];
  return dedupe(baseCandidates.map(normalizeUrl));
};

export const getApiBaseUrl = (): string => {
  return resolveBackendCandidates()[0] || 'http://127.0.0.1:3003';
};

export const forwardJson = async (path: string, init: RequestInit): Promise<Response> => {
  const candidates = resolveBackendCandidates();
  let lastError: unknown = null;
  for (const base of candidates) {
    try {
      return await fetch(`${base}${path}`, init);
    } catch (err) {
      lastError = err;
      continue;
    }
  }
  throw lastError instanceof Error ? lastError : new Error('Failed to reach backend');
};

export const forwardFormData = async (path: string, formData: FormData, headers: Headers): Promise<Response> => {
  const candidates = resolveBackendCandidates();
  const initHeaders: Record<string, string> = {};
  headers.forEach((value, key) => {
    if (key.toLowerCase() === 'content-type') return;
    initHeaders[key] = value;
  });
  let lastError: unknown = null;
  for (const base of candidates) {
    try {
      return await fetch(`${base}${path}`, {
        method: 'POST',
        body: formData as unknown as BodyInit,
        headers: initHeaders,
      });
    } catch (err) {
      lastError = err;
      continue;
    }
  }
  throw lastError instanceof Error ? lastError : new Error('Failed to reach backend');
};



