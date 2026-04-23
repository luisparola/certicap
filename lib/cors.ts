const ALLOWED_ORIGINS = [
  process.env.NEXT_PUBLIC_BASE_URL,
  "https://certicap.vercel.app",
  "http://localhost:3000",
].filter(Boolean) as string[]

export function corsHeaders(origin: string | null): Record<string, string> {
  const allowed = origin && ALLOWED_ORIGINS.includes(origin)
  return {
    "Access-Control-Allow-Origin": allowed ? origin : "null",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Max-Age": "86400",
  }
}

export function handleOptions(request: Request): Response {
  const origin = request.headers.get("origin")
  return new Response(null, { status: 204, headers: corsHeaders(origin) })
}
