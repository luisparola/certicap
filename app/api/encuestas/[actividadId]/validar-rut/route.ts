import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { corsHeaders, handleOptions } from "@/lib/cors"
import { getClientIp, rateLimit } from "@/lib/ratelimit"

export async function OPTIONS(request: Request) {
  return handleOptions(request)
}

export async function POST(
  request: Request,
  { params }: { params: { actividadId: string } }
) {
  const origin = request.headers.get("origin")
  const headers = corsHeaders(origin)

  try {
    const body = await request.json()
    const rut = body.rut
    const ip = getClientIp(request)
    const rutKey = typeof rut === "string" && rut ? rut.trim().toUpperCase() : "empty"
    const { allowed } = rateLimit(`validar-rut:${ip}:${rutKey}`, 10, 60_000)
    if (!allowed) {
      return NextResponse.json({ error: "Demasiadas solicitudes." }, { status: 429, headers })
    }

    if (!rut) return NextResponse.json({ valido: false, yaRespondio: false }, { headers })

    const encuesta = await prisma.encuesta.findUnique({
      where: { actividadId: params.actividadId },
      select: { id: true, activa: true },
    })
    if (!encuesta || !encuesta.activa) {
      return NextResponse.json({ valido: false, yaRespondio: false }, { headers })
    }

    const participante = await prisma.participante.findFirst({
      where: { actividadId: params.actividadId, rut },
    })
    if (!participante) return NextResponse.json({ valido: false, yaRespondio: false }, { headers })

    const yaRespondio = await prisma.respuestaEncuesta.findFirst({
      where: { encuestaId: encuesta.id, participanteId: participante.id, completada: true },
    })

    return NextResponse.json(
      { valido: true, yaRespondio: !!yaRespondio },
      { headers }
    )
  } catch (error) {
    console.error("Error validando RUT:", error)
    return NextResponse.json({ error: "Error interno" }, { status: 500, headers })
  }
}
