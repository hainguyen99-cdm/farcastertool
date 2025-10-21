const normalizeUrl = (url: string): string => url.replace(/\/$/, '');

const dedupe = (arr: string[]): string[] => Array.from(new Set(arr));

export const resolveBackendCandidates = (): string[] => {
  // Only use server-side environment variables to prevent client-side CORS issues
  const serverOnly = process.env.BACKEND_URL || process.env.API_BASE_URL || '';
  
  const baseCandidates = [
    serverOnly,
    'http://backend:3002', // Docker internal network
    'http://host.docker.internal:3002', // Docker host access
    'http://172.17.0.1:3002', // Docker bridge network
    'http://127.0.0.1:3002', // Local development
    'http://localhost:3002', // Local development fallback
  ].filter(Boolean) as string[];
  return dedupe(baseCandidates.map(normalizeUrl));
};

export const getApiBaseUrl = (): string => {
  return resolveBackendCandidates()[0] || 'http://127.0.0.1:3003';
};

export const forwardJson = async (path: string, init: RequestInit): Promise<Response> => {
  const candidates = resolveBackendCandidates();
  let lastError: unknown = null;
  
  console.log('Trying backend candidates:', candidates);
  
  for (const base of candidates) {
    try {
      console.log(`Attempting to connect to: ${base}${path}`);
      
      // Add timeout to prevent hanging
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
      
      const response = await fetch(`${base}${path}`, {
        ...init,
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      console.log(`Successfully connected to: ${base}${path}, status: ${response.status}`);
      return response;
    } catch (err) {
      console.error(`Failed to connect to ${base}${path}:`, err);
      lastError = err;
      continue;
    }
  }
  
  console.error('All backend connection attempts failed');
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



