import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

const PREGUNTAS_BASE = [
  "¿Cómo evalúa el contenido del curso?",
  "¿Cómo evalúa al instructor/relator?",
  "¿Cómo evalúa la metodología utilizada?",
  "¿Cómo evalúa los materiales entregados?",
  "¿Cómo evalúa las instalaciones o plataforma utilizada?",
  "¿Recomendaría este curso a otras personas?",
]

async function getTenant(actividadId: string, tenantId: string) {
  return prisma.actividad.findFirst({ where: { id: actividadId, tenantId } })
}

export async function GET(
  request: Request,
  { params }: { params: { actividadId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    const tenantId = (session.user as any).tenantId

    const actividad = await getTenant(params.actividadId, tenantId)
    if (!actividad) return NextResponse.json({ error: "No encontrada" }, { status: 404 })

    const encuesta = await prisma.encuesta.findUnique({
      where: { actividadId: params.actividadId },
      include: {
        preguntas: { orderBy: { orden: "asc" } },
        respuestas: {
          where: { completada: true },
          include: {
            participante: { select: { nombre: true, rut: true } },
            respuestas: { include: { pregunta: { select: { texto: true, orden: true } } } },
          },
          orderBy: { createdAt: "desc" },
        },
      },
    })

    if (!encuesta) return NextResponse.json({ encuesta: null })

    const totalParticipantes = await prisma.participante.count({ where: { actividadId: params.actividadId } })
    const totalRespuestas = encuesta.respuestas.length

    // Promedio general
    const allValues = encuesta.respuestas.flatMap((r) => r.respuestas.map((rp) => rp.valor))
    const promedioGeneral = allValues.length > 0 ? allValues.reduce((a, b) => a + b, 0) / allValues.length : 0

    // Promedio por pregunta
    const porPregunta = encuesta.preguntas.map((p) => {
      const vals = encuesta.respuestas.flatMap((r) => r.respuestas.filter((rp) => rp.preguntaId === p.id).map((rp) => rp.valor))
      const avg = vals.length > 0 ? vals.reduce((a, b) => a + b, 0) / vals.length : 0
      return { preguntaId: p.id, texto: p.texto, orden: p.orden, promedio: Math.round(avg * 10) / 10 }
    })

    // Respuestas individuales con promedio
    const respuestasIndividuales = encuesta.respuestas.map((r) => {
      const vals = r.respuestas.map((rp) => rp.valor)
      const avg = vals.length > 0 ? vals.reduce((a, b) => a + b, 0) / vals.length : 0
      return {
        id: r.id,
        participante: r.participante,
        createdAt: r.createdAt,
        promedio: Math.round(avg * 10) / 10,
        detalle: r.respuestas
          .sort((a, b) => a.pregunta.orden - b.pregunta.orden)
          .map((rp) => ({ preguntaId: rp.preguntaId, texto: rp.pregunta.texto, valor: rp.valor })),
      }
    })

    return NextResponse.json({
      encuesta: { id: encuesta.id, titulo: encuesta.titulo, descripcion: encuesta.descripcion, activa: encuesta.activa, preguntas: encuesta.preguntas },
      stats: { totalParticipantes, totalRespuestas, promedioGeneral: Math.round(promedioGeneral * 10) / 10, porPregunta },
      respuestasIndividuales,
    })
  } catch (error) {
    console.error("Error obteniendo encuesta:", error)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}

export async function POST(
  request: Request,
  { params }: { params: { actividadId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    const tenantId = (session.user as any).tenantId

    const actividad = await getTenant(params.actividadId, tenantId)
    if (!actividad) return NextResponse.json({ error: "No encontrada" }, { status: 404 })

    const existing = await prisma.encuesta.findUnique({ where: { actividadId: params.actividadId } })
    if (existing) return NextResponse.json({ error: "Ya existe una encuesta" }, { status: 400 })

    const encuesta = await prisma.encuesta.create({
      data: {
        actividadId: params.actividadId,
        titulo: `Encuesta de Satisfacción — ${actividad.nombre_curso}`,
        descripcion: "Por favor evalúe los aspectos del curso en una escala del 1 al 5.",
        activa: false,
        preguntas: {
          create: PREGUNTAS_BASE.map((texto, i) => ({ orden: i + 1, texto })),
        },
      },
      include: { preguntas: { orderBy: { orden: "asc" } } },
    })

    return NextResponse.json({ encuesta }, { status: 201 })
  } catch (error) {
    console.error("Error creando encuesta:", error)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { actividadId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    const tenantId = (session.user as any).tenantId

    const actividad = await getTenant(params.actividadId, tenantId)
    if (!actividad) return NextResponse.json({ error: "No encontrada" }, { status: 404 })

    const encuesta = await prisma.encuesta.findUnique({ where: { actividadId: params.actividadId } })
    if (!encuesta) return NextResponse.json({ error: "No encontrada" }, { status: 404 })

    const body = await request.json()

    // Update encuesta metadata
    await prisma.encuesta.update({
      where: { id: encuesta.id },
      data: {
        titulo: body.titulo ?? encuesta.titulo,
        descripcion: body.descripcion ?? encuesta.descripcion,
        activa: body.activa ?? encuesta.activa,
      },
    })

    // Sync preguntas if provided
    if (body.preguntas) {
      // Delete removed preguntas (those not in body.preguntas)
      const keepIds = body.preguntas.filter((p: any) => p.id).map((p: any) => p.id)
      await prisma.pregunta.deleteMany({ where: { encuestaId: encuesta.id, id: { notIn: keepIds } } })

      for (const p of body.preguntas) {
        if (p.id) {
          await prisma.pregunta.update({ where: { id: p.id }, data: { texto: p.texto, orden: p.orden } })
        } else {
          await prisma.pregunta.create({ data: { encuestaId: encuesta.id, texto: p.texto, orden: p.orden } })
        }
      }
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("Error actualizando encuesta:", error)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { actividadId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    const tenantId = (session.user as any).tenantId

    const actividad = await getTenant(params.actividadId, tenantId)
    if (!actividad) return NextResponse.json({ error: "No encontrada" }, { status: 404 })

    const encuesta = await prisma.encuesta.findUnique({ where: { actividadId: params.actividadId } })
    if (!encuesta) return NextResponse.json({ error: "No encontrada" }, { status: 404 })

    await prisma.$transaction(async (tx: any) => {
      await tx.respuestaPregunta.deleteMany({
        where: { respuestaEncuesta: { encuestaId: encuesta.id } },
      })
      await tx.respuestaEncuesta.deleteMany({ where: { encuestaId: encuesta.id } })
      await tx.pregunta.deleteMany({ where: { encuestaId: encuesta.id } })
      await tx.encuesta.delete({ where: { id: encuesta.id } })
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("Error eliminando encuesta:", error)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}
