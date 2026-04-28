import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

async function getTenant(actividadId: string, tenantId: string) {
  return prisma.actividad.findFirst({ where: { id: actividadId, tenantId } })
}

export async function GET(request: Request, { params }: { params: { actividadId: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    const tenantId = (session.user as any).tenantId

    const actividad = await getTenant(params.actividadId, tenantId)
    if (!actividad) return NextResponse.json({ error: "No encontrada" }, { status: 404 })

    const evaluacion = await prisma.evaluacion.findUnique({
      where: { actividadId: params.actividadId },
      include: {
        preguntas: { orderBy: { orden: "asc" } },
        respuestas: {
          where: { completada: true },
          include: { participante: { select: { nombre: true, rut: true } } },
          orderBy: { createdAt: "desc" },
        },
      },
    })

    if (!evaluacion) return NextResponse.json({ evaluacion: null })

    const totalParticipantes = await prisma.participante.count({ where: { actividadId: params.actividadId } })
    const totalCompletadas = evaluacion.respuestas.length
    const promedioGeneral = totalCompletadas > 0
      ? Math.round((evaluacion.respuestas.reduce((s, r) => s + r.puntaje, 0) / totalCompletadas) * 10) / 10
      : 0

    return NextResponse.json({
      evaluacion: {
        id: evaluacion.id,
        titulo: evaluacion.titulo,
        activa: evaluacion.activa,
        preguntas: evaluacion.preguntas,
      },
      stats: { totalParticipantes, totalCompletadas, promedioGeneral },
      respuestas: evaluacion.respuestas.map((r) => ({
        id: r.id,
        participante: r.participante,
        puntaje: r.puntaje,
        createdAt: r.createdAt,
      })),
    })
  } catch (error) {
    console.error("Error evaluacion GET:", error)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}

export async function POST(request: Request, { params }: { params: { actividadId: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    const tenantId = (session.user as any).tenantId

    const actividad = await getTenant(params.actividadId, tenantId)
    if (!actividad) return NextResponse.json({ error: "No encontrada" }, { status: 404 })

    const existing = await prisma.evaluacion.findUnique({ where: { actividadId: params.actividadId } })
    if (existing) return NextResponse.json({ error: "Ya existe una evaluación" }, { status: 400 })

    const evaluacion = await prisma.evaluacion.create({
      data: {
        actividadId: params.actividadId,
        titulo: `Evaluación — ${actividad.nombre_curso}`,
        activa: false,
      },
    })

    return NextResponse.json({ evaluacion }, { status: 201 })
  } catch (error) {
    console.error("Error evaluacion POST:", error)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}

export async function PUT(request: Request, { params }: { params: { actividadId: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    const tenantId = (session.user as any).tenantId

    const actividad = await getTenant(params.actividadId, tenantId)
    if (!actividad) return NextResponse.json({ error: "No encontrada" }, { status: 404 })

    const evaluacion = await prisma.evaluacion.findUnique({ where: { actividadId: params.actividadId } })
    if (!evaluacion) return NextResponse.json({ error: "No encontrada" }, { status: 404 })

    const body = await request.json()

    await prisma.evaluacion.update({
      where: { id: evaluacion.id },
      data: {
        titulo: body.titulo ?? evaluacion.titulo,
        activa: body.activa ?? evaluacion.activa,
      },
    })

    // Sync preguntas if provided
    if (body.preguntas) {
      const keepIds = body.preguntas.filter((p: any) => p.id).map((p: any) => p.id)
      await prisma.preguntaEval.deleteMany({ where: { evaluacionId: evaluacion.id, id: { notIn: keepIds } } })
      for (const p of body.preguntas) {
        if (p.id) {
          await prisma.preguntaEval.update({
            where: { id: p.id },
            data: { texto: p.texto, alternativas: p.alternativas, correcta: p.correcta, orden: p.orden },
          })
        } else {
          await prisma.preguntaEval.create({
            data: { evaluacionId: evaluacion.id, texto: p.texto, alternativas: p.alternativas, correcta: p.correcta, orden: p.orden },
          })
        }
      }
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("Error evaluacion PUT:", error)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}
