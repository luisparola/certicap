import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST(
  request: Request,
  { params }: { params: { actividadId: string } }
) {
  try {
    const { rut } = await request.json()
    if (!rut) return NextResponse.json({ valido: false, nombre: null, yaRespondio: false })

    const encuesta = await prisma.encuesta.findUnique({
      where: { actividadId: params.actividadId },
      select: { id: true, activa: true },
    })
    if (!encuesta || !encuesta.activa) {
      return NextResponse.json({ valido: false, nombre: null, yaRespondio: false })
    }

    const participante = await prisma.participante.findFirst({
      where: { actividadId: params.actividadId, rut },
    })

    if (!participante) return NextResponse.json({ valido: false, nombre: null, yaRespondio: false })

    const yaRespondio = await prisma.respuestaEncuesta.findFirst({
      where: { encuestaId: encuesta.id, participanteId: participante.id, completada: true },
    })

    return NextResponse.json({ valido: true, nombre: participante.nombre, yaRespondio: !!yaRespondio })
  } catch (error) {
    console.error("Error validando RUT:", error)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}
