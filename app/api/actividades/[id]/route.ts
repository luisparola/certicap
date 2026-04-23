import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { Prisma } from "@prisma/client"

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const tenantId = (session.user as any).tenantId

    const actividad = await prisma.actividad.findFirst({
      where: { id: params.id, tenantId },
      include: {
        participantes: {
          include: { certificado: true },
          orderBy: { createdAt: "desc" },
        },
        _count: { select: { participantes: true } },
      },
    })

    if (!actividad) {
      return NextResponse.json({ error: "Actividad no encontrada" }, { status: 404 })
    }

    return NextResponse.json(actividad)
  } catch (error) {
    console.error("Error obteniendo actividad:", error)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const tenantId = (session.user as any).tenantId
    const body = await request.json()

    // Verificar que la actividad pertenece al tenant
    const existing = await prisma.actividad.findFirst({
      where: { id: params.id, tenantId },
    })
    if (!existing) {
      return NextResponse.json({ error: "Actividad no encontrada" }, { status: 404 })
    }

    const actividad = await prisma.actividad.update({
      where: { id: params.id },
      data: {
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

    return NextResponse.json(actividad)
  } catch (error) {
    console.error("Error actualizando actividad:", error)
    return NextResponse.json({ error: "Error al actualizar" }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const tenantId = (session.user as any).tenantId

    const existing = await prisma.actividad.findFirst({
      where: { id: params.id, tenantId },
    })
    if (!existing) {
      return NextResponse.json({ error: "Actividad no encontrada" }, { status: 404 })
    }

    const encuesta = await prisma.encuesta.findUnique({
      where: { actividadId: params.id },
      select: { id: true },
    })

    await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      if (encuesta) {
        await tx.respuestaPregunta.deleteMany({
          where: { respuestaEncuesta: { encuestaId: encuesta.id } },
        })
        await tx.respuestaEncuesta.deleteMany({ where: { encuestaId: encuesta.id } })
        await tx.pregunta.deleteMany({ where: { encuestaId: encuesta.id } })
        await tx.encuesta.delete({ where: { id: encuesta.id } })
      }
      await tx.certificado.deleteMany({ where: { participante: { actividadId: params.id } } })
      await tx.participante.deleteMany({ where: { actividadId: params.id } })
      await tx.actividad.delete({ where: { id: params.id } })
    })

    return NextResponse.json({ message: "Actividad eliminada" })
  } catch (error) {
    console.error("Error eliminando actividad:", error)
    return NextResponse.json({ error: "Error al eliminar" }, { status: 500 })
  }
}
