import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const target = process.env.VITE_API_URL || process.env.NEXT_PUBLIC_API_URL || process.env.API_URL;

  if (!target) {
    res.status(500).json({ success: false, message: 'API target is not configured' });
    return;
  }

  const upstream = new URL(target);
  const requestUrl = new URL(req.url || '/', 'http://localhost');
  const pathname = requestUrl.pathname.replace(/^\/api/, '') || '/';
  const url = new URL(`${pathname}${requestUrl.search}`, upstream);

  const headers: Record<string, string> = {};
  for (const [key, value] of Object.entries(req.headers)) {
    if (typeof value === 'string') {
      headers[key] = value;
    } else if (Array.isArray(value)) {
      headers[key] = value.join(',');
    }
  }

  const body =
    req.method !== 'GET' && req.method !== 'HEAD'
      ? typeof req.body === 'string'
        ? req.body
        : JSON.stringify(req.body ?? {})
      : undefined;

  const response = await fetch(url, {
    method: req.method,
    headers,
    body,
  });

  const responseBody = await response.text();
  res.status(response.status);
  res.setHeader('content-type', response.headers.get('content-type') || 'application/json');
  res.send(responseBody);
}
