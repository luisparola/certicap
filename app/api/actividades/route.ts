import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const tenantId = (session.user as any).tenantId
    const { searchParams } = new URL(request.url)
    const tipo = searchParams.get("tipo")
    const busqueda = searchParams.get("busqueda")
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "20")

    const where: any = { tenantId }
    if (tipo) where.tipo_certificado = tipo
    if (busqueda) {
      where.OR = [
        { nombre_curso: { contains: busqueda, mode: "insensitive" } },
        { empresa_nombre: { contains: busqueda, mode: "insensitive" } },
      ]
    }

    const [actividades, total] = await Promise.all([
      prisma.actividad.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          _count: { select: { participantes: true } },
        },
      }),
      prisma.actividad.count({ where }),
    ])

    return NextResponse.json({
      actividades,
      total,
      pages: Math.ceil(total / limit),
      page,
    })
  } catch (error) {
    console.error("Error listando actividades:", error)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const tenantId = (session.user as any).tenantId
    const body = await request.json()

    const PREGUNTAS_BASE = [
      { texto: "¿Cómo fue la atención general que se le brindó?",                              tipo: "escala" },
      { texto: "¿Se demostró conocimiento del o los servicios ofrecidos?",                     tipo: "escala" },
      { texto: "¿La persona administrativa, contestó de forma rápida y adecuada sus inquietudes?", tipo: "escala" },
      { texto: "¿Qué le pareció el servicio en general brindado?",                             tipo: "escala" },
      { texto: "¿El servicio prestado, cumplió con sus expectativas?",                         tipo: "escala" },
      { texto: "¿Se cumplió con lo planificado en el Servicio?",                               tipo: "escala" },
      { texto: "¿Recomendaría al organismo de capacitación?",                                  tipo: "sino"   },
      { texto: "¿Compraría otro servicio al organismo?",                                       tipo: "sino"   },
      { texto: "Observaciones: ¿Qué otros cursos le gustarían tomar?",                         tipo: "texto"  },
    ]

    const actividad = await prisma.$transaction(async (tx) => {
      const act = await tx.actividad.create({
        data: {
          tenantId,
          nombre_curso: body.nombre_curso,
          tipo_certificado: body.tipo_certificado,
          fecha_inicio: new Date(body.fecha_inicio),
          fecha_termino: new Date(body.fecha_termino),
          lugar: body.lugar,
          instructor: body.instructor,
          empresa_nombre: body.empresa_nombre,
          empresa_rut: body.empresa_rut,
          observaciones: body.observaciones || null,
        },
      })

      // Auto-create encuesta with official Formacap questions
      await tx.encuesta.create({
        data: {
          actividadId: act.id,
          titulo: `Encuesta de Satisfacción — ${act.nombre_curso}`,
          descripcion: "Escala: 1=Deficiente  2=Malo  3=Regular  4=Bueno  5=Excelente",
          activa: false,
          preguntas: { create: PREGUNTAS_BASE.map((p, i) => ({ orden: i + 1, texto: p.texto, tipo: p.tipo })) },
        },
      })

      // Auto-create empty evaluacion
      await tx.evaluacion.create({
        data: {
          actividadId: act.id,
          titulo: `Evaluación — ${act.nombre_curso}`,
          activa: false,
        },
      })

      return act
    })

    return NextResponse.json(actividad, { status: 201 })
  } catch (error) {
    console.error("Error creando actividad:", error)
    return NextResponse.json({ error: "Error al crear actividad" }, { status: 500 })
  }
}
