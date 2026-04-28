import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST(request: Request, { params }: { params: { actividadId: string } }) {
  try {
    const { rut, respuestas } = await request.json()
    // respuestas: [{ preguntaId, seleccionada }]

    const evaluacion = await prisma.evaluacion.findUnique({
      where: { actividadId: params.actividadId },
      include: { preguntas: true },
    })
    if (!evaluacion || !evaluacion.activa) {
      return NextResponse.json({ error: "Evaluación no disponible" }, { status: 400 })
    }

    const participante = await prisma.participante.findFirst({
      where: { actividadId: params.actividadId, rut },
    })
    if (!participante) return NextResponse.json({ error: "Participante no encontrado" }, { status: 404 })

    const yaRespondio = await prisma.respuestaEval.findUnique({
      where: { evaluacionId_participanteId: { evaluacionId: evaluacion.id, participanteId: participante.id } },
    })
    if (yaRespondio) return NextResponse.json({ error: "Ya completaste esta evaluación" }, { status: 400 })

    // Validate all questions answered
    const preguntaIds = evaluacion.preguntas.map((p) => p.id)
    const respondidas = respuestas.map((r: any) => r.preguntaId)
    if (preguntaIds.some((id) => !respondidas.includes(id))) {
      return NextResponse.json({ error: "Faltan preguntas por responder" }, { status: 400 })
    }

    // Calculate score
    let correctasCount = 0
    const respuestasData = respuestas.map((r: any) => {
      const pregunta = evaluacion.preguntas.find((p) => p.id === r.preguntaId)!
      const esCorrecta = r.seleccionada === pregunta.correcta
      if (esCorrecta) correctasCount++
      return { preguntaId: r.preguntaId, seleccionada: r.seleccionada, correcta: esCorrecta }
    })

    const puntaje = Math.round((correctasCount / evaluacion.preguntas.length) * 100 * 10) / 10

    await prisma.respuestaEval.create({
      data: {
        evaluacionId: evaluacion.id,
        participanteId: participante.id,
        puntaje,
        completada: true,
        respuestas: { create: respuestasData },
      },
    })

    return NextResponse.json({
      ok: true,
      puntaje,
      correctas: correctasCount,
      total: evaluacion.preguntas.length,
      aprobado: puntaje >= 60,
    })
  } catch (error) {
    console.error("Error evaluacion responder:", error)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}
