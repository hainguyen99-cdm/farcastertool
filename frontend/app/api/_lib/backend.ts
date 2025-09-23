export const getApiBaseUrl = (): string => {
  const configured = process.env.NEXT_PUBLIC_API_URL || '';
  const url = configured || 'http://localhost:3002';
  const normalized = url.replace(/\/$/, '');
  if (normalized.includes('://backend')) {
    return 'http://localhost:3002';
  }
  return normalized;
};

export const forwardJson = async (path: string, init: RequestInit): Promise<Response> => {
  const base = getApiBaseUrl();
  const response = await fetch(`${base}${path}`, init);
  return response;
};

export const forwardFormData = async (path: string, formData: FormData, headers: Headers): Promise<Response> => {
  const base = getApiBaseUrl();
  const initHeaders: Record<string, string> = {};
  headers.forEach((value, key) => {
    if (key.toLowerCase() === 'content-type') return;
    initHeaders[key] = value;
  });
  const response = await fetch(`${base}${path}`, {
    method: 'POST',
    body: formData as unknown as BodyInit,
    headers: initHeaders,
  });
  return response;
};



