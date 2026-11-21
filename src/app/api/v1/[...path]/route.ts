import { NextRequest, NextResponse } from 'next/server';

const COLLISION_BACKEND_HOSTS = new Set([
  'royal-backend.vercel.app',
  'royalbackend.vercel.app',
]);

function getBackendBaseUrl(): string {
  const candidates = [
    process.env.INTERNAL_API_URL,
    process.env.BACKEND_INTERNAL_URL,
    process.env.BACKEND_URL,
    process.env.NEXT_PUBLIC_BACKEND_URL,
    process.env.NEXT_PUBLIC_API_URL?.startsWith('http') ? process.env.NEXT_PUBLIC_API_URL : undefined,
  ];

  for (const candidate of candidates) {
    if (!candidate) continue;
    const cleaned = candidate.trim().replace(/\/api\/v1\/?$/, '').replace(/\/+$/, '');
    if (!cleaned) continue;
    try {
      const parsed = new URL(cleaned);
      if (COLLISION_BACKEND_HOSTS.has(parsed.hostname.toLowerCase())) {
        continue;
      }
    } catch {
      continue;
    }
    return cleaned;
  }

  if (process.env.VERCEL) {
    return 'https://royal-electro-backend.vercel.app';
  }
  return 'http://backend:4000';
}

async function handleProxy(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const resolvedParams = await params;
  const path = resolvedParams.path.join('/');
  const backendBase = getBackendBaseUrl();
  const search = request.nextUrl.search;
  const targetUrl = `${backendBase}/api/v1/${path}${search}`;

  const forwardHeaders = new Headers();
  request.headers.forEach((value, key) => {
    const lowerKey = key.toLowerCase();
    if (!['host', 'connection', 'content-length'].includes(lowerKey)) {
      forwardHeaders.set(key, value);
    }
  });

  const clientIp =
    request.headers.get('x-forwarded-for') ||
    request.headers.get('x-real-ip') ||
    '127.0.0.1';
  forwardHeaders.set('x-forwarded-for', clientIp);

  const init: RequestInit = {
    method: request.method,
    headers: forwardHeaders,
    redirect: 'manual',
  };

  if (!['GET', 'HEAD'].includes(request.method)) {
    try {
      const buffer = await request.arrayBuffer();
      if (buffer.byteLength > 0) {
        init.body = buffer;
      }
    } catch {
      // Pas de corps de requête
    }
  }

  try {
    const res = await fetch(targetUrl, init);

    const responseHeaders = new Headers();
    res.headers.forEach((value, key) => {
      const lowerKey = key.toLowerCase();
      if (!['content-encoding', 'transfer-encoding'].includes(lowerKey)) {
        responseHeaders.append(key, value);
      }
    });

    responseHeaders.set('x-proxy-target', backendBase);

    return new NextResponse(res.body, {
      status: res.status,
      statusText: res.statusText,
      headers: responseHeaders,
    });
  } catch (error: any) {
    console.error(`[API Proxy Error] -> ${targetUrl}:`, error?.message || error);
    return NextResponse.json(
      {
        statusCode: 502,
        message: `Erreur de communication avec le serveur API (${error?.message || 'ECONNREFUSED'})`,
        target: targetUrl,
      },
      { status: 502 },
    );
  }
}

export const GET = handleProxy;
export const POST = handleProxy;
export const PUT = handleProxy;
export const PATCH = handleProxy;
export const DELETE = handleProxy;
export const OPTIONS = handleProxy;
export const HEAD = handleProxy;
