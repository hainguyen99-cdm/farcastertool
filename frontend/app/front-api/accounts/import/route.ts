import { NextRequest } from 'next/server';
import { forwardJson } from '../../../api/_lib/backend';

export const dynamic = 'force-dynamic';

function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += ch;
    }
  }
  result.push(current);
  return result.map(v => v.trim().replace(/^"|"$/g, ''));
}

export async function POST(req: NextRequest): Promise<Response> {
  try {
    const formData = await req.formData();
    const file = formData.get('file');
    if (!(file instanceof File)) {
      return new Response(JSON.stringify({ error: 'Missing file field' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    const text = await file.text();
    let accounts: Array<{ name: string; token: string; status?: string }> = [];

    const lowerName = (file.name || '').toLowerCase();
    if (lowerName.endsWith('.json') || text.trim().startsWith('[')) {
      const parsed = JSON.parse(text);
      if (!Array.isArray(parsed)) {
        return new Response(JSON.stringify({ error: 'JSON must be an array' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
      }
      accounts = parsed.map((it: any) => ({ name: String(it.name ?? ''), token: String(it.token ?? ''), status: it.status }));
    } else {
      const lines = text.split(/\r?\n/).filter(l => l.trim().length > 0);
      if (lines.length < 2) {
        return new Response(JSON.stringify({ error: 'CSV must include a header and at least one row' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
      }
      const header = parseCsvLine(lines[0]).map(h => h.toLowerCase());
      const idxName = header.indexOf('name');
      const idxToken = header.indexOf('token');
      const idxStatus = header.indexOf('status');
      if (idxName === -1 || idxToken === -1) {
        return new Response(JSON.stringify({ error: 'CSV header must include name,token[,status]' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
      }
      accounts = lines.slice(1).map(line => {
        const cols = parseCsvLine(line);
        return {
          name: cols[idxName] ?? '',
          token: cols[idxToken] ?? '',
          status: idxStatus !== -1 ? cols[idxStatus] : undefined,
        };
      }).filter(a => a.name && a.token);
    }

    const response = await forwardJson('/accounts/import', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ accounts }),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Backend import failed:', response.status, errorText);
      return new Response(JSON.stringify({ 
        error: 'Backend import failed', 
        message: `Backend returned ${response.status}: ${errorText}` 
      }), { 
        status: response.status, 
        headers: { 'Content-Type': 'application/json' } 
      });
    }
    
    const dataText = await response.text();
    const contentType = response.headers.get('Content-Type') || 'application/json';
    return new Response(dataText, { status: response.status, headers: { 'Content-Type': contentType } });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return new Response(JSON.stringify({ error: 'Import failed', message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}


