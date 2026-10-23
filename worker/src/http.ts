export class HttpError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
  ) {
    super(message);
  }
}

export function json(body: unknown, status = 200, headers: HeadersInit = {}): Response {
  const response = Response.json(body, { status, headers });
  response.headers.set('Cache-Control', 'no-store');
  return response;
}

/** Error body: `{ error: 'code', message }` (plan section 7.9). */
export function errorResponse(error: HttpError): Response {
  return json({ error: error.code, message: error.message }, error.status);
}

export function redirect(location: string, headers: HeadersInit = {}): Response {
  const response = new Response(null, { status: 303, headers });
  response.headers.set('Location', location);
  response.headers.set('Cache-Control', 'no-store');
  return response;
}

export function getCookie(request: Request, name: string): string | null {
  const header = request.headers.get('Cookie');
  if (!header) return null;
  for (const part of header.split(';')) {
    const [key, ...rest] = part.trim().split('=');
    if (key === name) return decodeURIComponent(rest.join('='));
  }
  return null;
}

export async function readJson(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    throw new HttpError(400, 'invalid_json', 'The body is not valid JSON.');
  }
}
