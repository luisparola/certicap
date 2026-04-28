import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

const PREGUNTAS_CLIENTE = [
  { texto: "¿Cómo fue la atención general que se le brindó?", tipo: "escala" },
  { texto: "¿Se demostró conocimiento del o los servicios ofrecidos?", tipo: "escala" },
  { texto: "¿La persona administrativa, contestó de forma rápida y adecuada sus inquietudes?", tipo: "escala" },
  { texto: "¿Qué le pareció el servicio en general brindado?", tipo: "escala" },
  { texto: "¿El servicio prestado, cumplió con sus expectativas?", tipo: "escala" },
  { texto: "¿Se cumplió con lo planificado en el Servicio?", tipo: "escala" },
  { texto: "¿Recomendaría al organismo de capacitación?", tipo: "sino" },
  { texto: "¿Compraría otro servicio al organismo?", tipo: "sino" },
  { texto: "Observaciones: ¿Qué otros cursos le gustarían tomar?", tipo: "texto" },
]

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

    const encuesta = await prisma.encuestaCliente.findUnique({
      where: { actividadId: params.actividadId },
      include: {
        preguntas: { orderBy: { orden: "asc" } },
        respuestas: {
          where: { completada: true },
          include: { respuestas: { include: { pregunta: { select: { tipo: true } } } } },
          orderBy: { createdAt: "desc" },
        },
      },
    })

    if (!encuesta) return NextResponse.json({ encuesta: null })

    const totalRespuestas = encuesta.respuestas.length
    const promedioGeneral = totalRespuestas > 0
      ? Math.round((encuesta.respuestas.flatMap((r) => r.respuestas.filter((rp) => rp.pregunta.tipo === "escala").map((rp) => rp.valor)).reduce((a, b, _, arr) => a + b / arr.length, 0)) * 10) / 10
      : 0

    return NextResponse.json({
      encuesta: { id: encuesta.id, titulo: encuesta.titulo, activa: encuesta.activa, preguntas: encuesta.preguntas },
      stats: { totalRespuestas, promedioGeneral },
      respuestas: encuesta.respuestas.map((r) => {
        const vals = r.respuestas.filter((rp) => rp.pregunta.tipo === "escala").map((rp) => rp.valor)
        const promedio = vals.length > 0 ? Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) / 10 : 0
        return { id: r.id, nombre_empresa: r.nombre_empresa, nombre_contacto: r.nombre_contacto, createdAt: r.createdAt, promedio }
      }),
    })
  } catch (error) {
    console.error("Error encuesta-cliente GET:", error)
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

    const existing = await prisma.encuestaCliente.findUnique({ where: { actividadId: params.actividadId } })
    if (existing) return NextResponse.json({ error: "Ya existe" }, { status: 400 })

    const encuesta = await prisma.encuestaCliente.create({
      data: {
        actividadId: params.actividadId,
        titulo: `Encuesta Cliente — ${actividad.nombre_curso}`,
        activa: false,
        preguntas: { create: PREGUNTAS_CLIENTE.map((p, i) => ({ orden: i + 1, texto: p.texto, tipo: p.tipo })) },
      },
      include: { preguntas: { orderBy: { orden: "asc" } } },
    })

    return NextResponse.json({ encuesta }, { status: 201 })
  } catch (error) {
    console.error("Error encuesta-cliente POST:", error)
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

    const encuesta = await prisma.encuestaCliente.findUnique({ where: { actividadId: params.actividadId } })
    if (!encuesta) return NextResponse.json({ error: "No encontrada" }, { status: 404 })

    const body = await request.json()

    await prisma.encuestaCliente.update({
      where: { id: encuesta.id },
      data: { titulo: body.titulo ?? encuesta.titulo, activa: body.activa ?? encuesta.activa },
    })

    if (body.preguntas) {
      const keepIds = body.preguntas.filter((p: any) => p.id).map((p: any) => p.id)
      await prisma.preguntaCliente.deleteMany({ where: { encuestaClienteId: encuesta.id, id: { notIn: keepIds } } })
      for (const p of body.preguntas) {
        if (p.id) {
          await prisma.preguntaCliente.update({ where: { id: p.id }, data: { texto: p.texto, tipo: p.tipo, orden: p.orden } })
        } else {
          await prisma.preguntaCliente.create({ data: { encuestaClienteId: encuesta.id, texto: p.texto, tipo: p.tipo, orden: p.orden } })
        }
      }
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("Error encuesta-cliente PUT:", error)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}
