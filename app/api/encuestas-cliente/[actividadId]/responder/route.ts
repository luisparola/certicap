import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getClientIp, rateLimit } from "@/lib/ratelimit"

export async function POST(request: Request, { params }: { params: { actividadId: string } }) {
  try {
    const ip = getClientIp(request)
    const { allowed } = rateLimit(`enc-cliente:${ip}`, 3, 60_000)
    if (!allowed) {
      return NextResponse.json({ error: "Demasiadas solicitudes." }, { status: 429 })
    }

    const { nombre_empresa, nombre_contacto, respuestas } = await request.json()
    if (!nombre_empresa || !nombre_contacto) {
      return NextResponse.json({ error: "Nombre empresa y contacto son obligatorios" }, { status: 400 })
    }

    const encuesta = await prisma.encuestaCliente.findUnique({
      where: { actividadId: params.actividadId },
      include: { preguntas: true },
    })
    if (!encuesta || !encuesta.activa) {
      return NextResponse.json({ error: "Encuesta no disponible" }, { status: 400 })
    }

    // Validate all questions answered
    const preguntaIds = encuesta.preguntas.map((p) => p.id)
    const respondidas = respuestas.map((r: any) => r.preguntaId)
    if (preguntaIds.some((id) => !respondidas.includes(id))) {
      return NextResponse.json({ error: "Faltan preguntas por responder" }, { status: 400 })
    }

    // Validate per type
    for (const r of respuestas) {
      const pregunta = encuesta.preguntas.find((p) => p.id === r.preguntaId)
      if (!pregunta) continue
      if (pregunta.tipo === "escala" && (r.valor < 1 || r.valor > 5)) {
        return NextResponse.json({ error: "Valor inválido para escala" }, { status: 400 })
      }
      if (pregunta.tipo === "sino" && r.valor !== 0 && r.valor !== 1) {
        return NextResponse.json({ error: "Valor inválido para sí/no" }, { status: 400 })
      }
    }

    const respuestaEncuesta = await prisma.respuestaEncuestaCliente.create({
      data: {
        encuestaClienteId: encuesta.id,
        nombre_empresa: nombre_empresa.trim(),
        nombre_contacto: nombre_contacto.trim(),
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

    const escalaVals = respuestaEncuesta.respuestas
      .filter((r) => r.pregunta.tipo === "escala")
      .map((r) => r.valor)

    const promedio = escalaVals.length > 0
      ? Math.round((escalaVals.reduce((a, b) => a + b, 0) / escalaVals.length) * 10) / 10
      : 0

    return NextResponse.json({ ok: true, promedio })
  } catch (error) {
    console.error("Error encuesta-cliente responder:", error)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}
