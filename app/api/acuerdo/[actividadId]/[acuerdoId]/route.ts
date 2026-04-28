import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function DELETE(
  request: Request,
  { params }: { params: { actividadId: string; acuerdoId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    const tenantId = (session.user as any).tenantId

    // Verify actividad belongs to tenant
    const actCheck = await prisma.actividad.findFirst({ where: { id: params.actividadId, tenantId } })
    if (!actCheck) return NextResponse.json({ error: "No autorizado" }, { status: 403 })

    const acuerdo = await prisma.acuerdoParticipante.findUnique({
      where: { id: params.acuerdoId },
    })
    if (!acuerdo) return NextResponse.json({ error: "No encontrado" }, { status: 404 })

    const pid = acuerdo.participanteId

    await prisma.$transaction(async (tx: any) => {
      if (pid) {
        // 1. Certificado
        await tx.certificado.deleteMany({ where: { participanteId: pid } })

        // 2. Respuestas de encuesta
        const respEnc = await tx.respuestaEncuesta.findMany({ where: { participanteId: pid } })
        for (const r of respEnc) {
          await tx.respuestaPregunta.deleteMany({ where: { respuestaEncuestaId: r.id } })
        }
        await tx.respuestaEncuesta.deleteMany({ where: { participanteId: pid } })

        // 3. Respuestas de evaluación
        const respEval = await tx.respuestaEval.findMany({ where: { participanteId: pid } })
        for (const r of respEval) {
          await tx.respuestaEvalPregunta.deleteMany({ where: { respuestaEvalId: r.id } })
        }
        await tx.respuestaEval.deleteMany({ where: { participanteId: pid } })
      }

      // 4. Acuerdo
      await tx.acuerdoParticipante.delete({ where: { id: params.acuerdoId } })

      // 5. Participante
      if (pid) {
        await tx.participante.delete({ where: { id: pid } })
      }
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("Error eliminando acuerdo:", error)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}
