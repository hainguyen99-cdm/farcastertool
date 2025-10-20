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
    console.log('Import request received');
    const formData = await req.formData();
    const file = formData.get('file');
    if (!(file instanceof File)) {
      console.error('No file provided in form data');
      return new Response(JSON.stringify({ error: 'Missing file field' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    console.log(`Processing file: ${file.name}, size: ${file.size}`);
    const text = await file.text();
    let accounts: Array<{ name: string; token: string; status?: string }> = [];

    const lowerName = (file.name || '').toLowerCase();
    if (lowerName.endsWith('.json') || text.trim().startsWith('[')) {
      const parsed = JSON.parse(text);
      if (!Array.isArray(parsed)) {
        return new Response(JSON.stringify({ error: 'JSON must be an array' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
      }
      accounts = parsed.map((it: any) => {
        let status = it.status;
        
        // Map status values to match backend enum
        if (status) {
          const statusMap: Record<string, string> = {
            'ACTIVE': 'Active',
            'EXPIRED': 'Expired', 
            'ERROR': 'Error',
            'active': 'Active',
            'expired': 'Expired',
            'error': 'Error'
          };
          status = statusMap[status] || 'Active'; // Default to Active
        }
        
        return { 
          name: String(it.name ?? ''), 
          token: String(it.token ?? ''), 
          status 
        };
      });
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
        let status = idxStatus !== -1 ? cols[idxStatus] : undefined;
        
        // Map status values to match backend enum
        if (status) {
          const statusMap: Record<string, string> = {
            'ACTIVE': 'Active',
            'EXPIRED': 'Expired', 
            'ERROR': 'Error',
            'active': 'Active',
            'expired': 'Expired',
            'error': 'Error'
          };
          status = statusMap[status] || 'Active'; // Default to Active
        }
        
        return {
          name: cols[idxName] ?? '',
          token: cols[idxToken] ?? '',
          status,
        };
      }).filter(a => a.name && a.token);
    }

    console.log(`Parsed ${accounts.length} accounts from file`);
    if (accounts.length === 0) {
      return new Response(JSON.stringify({ error: 'No valid accounts found in file' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    console.log('Forwarding to backend:', { accounts: accounts.length });
    
    try {
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
          message: `Backend returned ${response.status}: ${errorText}`,
          success: 0,
          errors: [`Backend connection failed: ${response.status} ${errorText}`]
        }), { 
          status: response.status, 
          headers: { 'Content-Type': 'application/json' } 
        });
      }
      
      const dataText = await response.text();
      const contentType = response.headers.get('Content-Type') || 'application/json';
      return new Response(dataText, { status: response.status, headers: { 'Content-Type': contentType } });
    } catch (backendError) {
      console.error('Backend connection error:', backendError);
      return new Response(JSON.stringify({ 
        error: 'Backend connection failed', 
        message: `Unable to connect to backend: ${backendError instanceof Error ? backendError.message : 'Unknown error'}`,
        success: 0,
        errors: [`Backend connection failed: ${backendError instanceof Error ? backendError.message : 'Unknown error'}`]
      }), { 
        status: 500, 
        headers: { 'Content-Type': 'application/json' } 
      });
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return new Response(JSON.stringify({ error: 'Import failed', message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}


