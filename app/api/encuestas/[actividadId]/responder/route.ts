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
    const ip = getClientIp(request)
    const { allowed } = rateLimit(`enc-responder:${ip}`, 3, 60_000)
    if (!allowed) {
      return NextResponse.json({ error: "Demasiadas solicitudes." }, { status: 429, headers })
    }

    const { rut, respuestas } = await request.json()
    // respuestas: [{ preguntaId, valor?, valor_texto? }]

    const encuesta = await prisma.encuesta.findUnique({
      where: { actividadId: params.actividadId },
      include: { preguntas: true },
    })
    if (!encuesta || !encuesta.activa) {
      return NextResponse.json({ error: "Encuesta no disponible" }, { status: 400, headers })
    }

    const participante = await prisma.participante.findFirst({
      where: { actividadId: params.actividadId, rut },
    })
    if (!participante) return NextResponse.json({ error: "Participante no encontrado" }, { status: 404, headers })

    const yaRespondio = await prisma.respuestaEncuesta.findFirst({
      where: { encuestaId: encuesta.id, participanteId: participante.id, completada: true },
    })
    if (yaRespondio) return NextResponse.json({ error: "Ya respondiste esta encuesta" }, { status: 400, headers })

    // Validate all questions answered
    const preguntaIds = encuesta.preguntas.map((p) => p.id)
    const respondidas = respuestas.map((r: any) => r.preguntaId)
    const missing = preguntaIds.filter((id) => !respondidas.includes(id))
    if (missing.length > 0) return NextResponse.json({ error: "Faltan preguntas por responder" }, { status: 400, headers })

    // Validate per type
    for (const r of respuestas) {
      const pregunta = encuesta.preguntas.find((p) => p.id === r.preguntaId)
      if (!pregunta) continue
      if (pregunta.tipo === "escala") {
        if (r.valor < 1 || r.valor > 5) return NextResponse.json({ error: "Valor inválido para escala" }, { status: 400, headers })
      } else if (pregunta.tipo === "sino") {
        if (r.valor !== 0 && r.valor !== 1) return NextResponse.json({ error: "Valor inválido para sí/no" }, { status: 400, headers })
      }
      // texto: no integer validation needed
    }

    const respuestaEncuesta = await prisma.respuestaEncuesta.create({
      data: {
        encuestaId: encuesta.id,
        participanteId: participante.id,
        completada: true,
        respuestas: {
          create: respuestas.map((r: any) => ({
            preguntaId: r.preguntaId,
            valor: r.valor ?? 0,
            valor_texto: r.valor_texto ?? null,
          })),
        },
      },
      include: { respuestas: { include: { pregunta: { select: { tipo: true } } } } },
    })

    // Promedio calculated only from "escala" type questions
    const escalaVals = respuestaEncuesta.respuestas
      .filter((r) => r.pregunta.tipo === "escala")
      .map((r) => r.valor)

    const promedio = escalaVals.length > 0
      ? Math.round((escalaVals.reduce((a, b) => a + b, 0) / escalaVals.length) * 10) / 10
      : 0

    return NextResponse.json({ ok: true, promedio }, { headers })
  } catch (error) {
    console.error("Error guardando respuesta:", error)
    return NextResponse.json({ error: "Error interno" }, { status: 500, headers })
  }
}
