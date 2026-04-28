import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

async function getParticipanteAutorizado(participanteId: string, tenantId: string) {
  return prisma.participante.findFirst({
    where: { id: participanteId, actividad: { tenantId } },
    include: { actividad: true, certificado: true },
  })
}

export async function GET(
  request: Request,
  { params }: { params: { id: string; pid: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    const tenantId = (session.user as any).tenantId
    const participante = await getParticipanteAutorizado(params.pid, tenantId)
    if (!participante) return NextResponse.json({ error: "No encontrado" }, { status: 404 })
    return NextResponse.json(participante)
  } catch (error) {
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string; pid: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    const tenantId = (session.user as any).tenantId
    const existing = await getParticipanteAutorizado(params.pid, tenantId)
    if (!existing) return NextResponse.json({ error: "No encontrado" }, { status: 404 })

    const body = await request.json()
    const participante = await prisma.participante.update({
      where: { id: params.pid },
      data: {
        nombre: body.nombre,
        rut: body.rut,
        nota_teoria: body.nota_teoria ? parseFloat(body.nota_teoria) : null,
        nota_practica: body.nota_practica ? parseFloat(body.nota_practica) : null,
        asistencia_pct: body.asistencia_pct ? parseFloat(body.asistencia_pct) : null,
        senales: body.senales || null,
        nro_registro: body.nro_registro || null,
        estado: body.estado || "PENDIENTE",
        marca_equipo: body.marca_equipo || null,
        modelo_equipo: body.modelo_equipo || null,
        capacidad_equipo: body.capacidad_equipo || null,
        espesor_diametro: body.espesor_diametro || null,
        aplicacion_soldadura: body.aplicacion_soldadura || null,
        observaciones: body.observaciones || null,
      },
    })
    return NextResponse.json(participante)
  } catch (error) {
    console.error("Error actualizando participante:", error)
    return NextResponse.json({ error: "Error al actualizar" }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string; pid: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    const tenantId = (session.user as any).tenantId
    const existing = await getParticipanteAutorizado(params.pid, tenantId)
    if (!existing) return NextResponse.json({ error: "No encontrado" }, { status: 404 })

    const pid = params.pid

    await prisma.$transaction(async (tx: any) => {
      // 1. Certificado
      await tx.certificado.deleteMany({ where: { participanteId: pid } })

      // 2. Acuerdo
      await tx.acuerdoParticipante.deleteMany({ where: { participanteId: pid } })

      // 3. Respuestas de encuesta
      const respEnc = await tx.respuestaEncuesta.findMany({ where: { participanteId: pid } })
      for (const r of respEnc) {
        await tx.respuestaPregunta.deleteMany({ where: { respuestaEncuestaId: r.id } })
      }
      await tx.respuestaEncuesta.deleteMany({ where: { participanteId: pid } })

      // 4. Respuestas de evaluación
      const respEval = await tx.respuestaEval.findMany({ where: { participanteId: pid } })
      for (const r of respEval) {
        await tx.respuestaEvalPregunta.deleteMany({ where: { respuestaEvalId: r.id } })
      }
      await tx.respuestaEval.deleteMany({ where: { participanteId: pid } })

      // 5. Participante
      await tx.participante.delete({ where: { id: pid } })
    })

    return NextResponse.json({ message: "Participante eliminado" })
  } catch (error) {
    console.error("Error eliminando participante:", error)
    return NextResponse.json({ error: "Error al eliminar" }, { status: 500 })
  }
}
