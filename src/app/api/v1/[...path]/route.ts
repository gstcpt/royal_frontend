import { NextRequest, NextResponse } from 'next/server';

function getBackendBaseUrl(): string {
  const raw =
    process.env.INTERNAL_API_URL ||
    process.env.BACKEND_URL ||
    process.env.NEXT_PUBLIC_BACKEND_URL ||
    'http://backend:4000';
  return raw.replace(/\/api\/v1\/?$/, '').replace(/\/+$/, '');
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
