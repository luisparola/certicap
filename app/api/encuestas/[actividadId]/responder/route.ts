import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST(
  request: Request,
  { params }: { params: { actividadId: string } }
) {
  try {
    const { rut, respuestas } = await request.json()
    // respuestas: [{ preguntaId, valor }]

    const encuesta = await prisma.encuesta.findUnique({
      where: { actividadId: params.actividadId },
      include: { preguntas: true },
    })
    if (!encuesta || !encuesta.activa) {
      return NextResponse.json({ error: "Encuesta no disponible" }, { status: 400 })
    }

    const participante = await prisma.participante.findFirst({
      where: { actividadId: params.actividadId, rut },
    })
    if (!participante) return NextResponse.json({ error: "Participante no encontrado" }, { status: 404 })

    const yaRespondio = await prisma.respuestaEncuesta.findFirst({
      where: { encuestaId: encuesta.id, participanteId: participante.id, completada: true },
    })
    if (yaRespondio) return NextResponse.json({ error: "Ya respondiste esta encuesta" }, { status: 400 })

    // Validate all questions answered
    const preguntaIds = encuesta.preguntas.map((p) => p.id)
    const respondidas = respuestas.map((r: any) => r.preguntaId)
    const missing = preguntaIds.filter((id) => !respondidas.includes(id))
    if (missing.length > 0) return NextResponse.json({ error: "Faltan preguntas por responder" }, { status: 400 })

    // Validate values 1-5
    for (const r of respuestas) {
      if (r.valor < 1 || r.valor > 5) return NextResponse.json({ error: "Valor inválido" }, { status: 400 })
    }

    const respuestaEncuesta = await prisma.respuestaEncuesta.create({
      data: {
        encuestaId: encuesta.id,
        participanteId: participante.id,
        completada: true,
        respuestas: {
          create: respuestas.map((r: any) => ({ preguntaId: r.preguntaId, valor: r.valor })),
        },
      },
      include: { respuestas: true },
    })

    const vals = respuestaEncuesta.respuestas.map((r) => r.valor)
    const promedio = Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) / 10

    return NextResponse.json({ ok: true, promedio })
  } catch (error) {
    console.error("Error guardando respuesta:", error)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}
