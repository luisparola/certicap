import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    const tenantId = (session.user as any).tenantId

    const certificado = await prisma.certificado.findUnique({
      where: { id: params.id },
      include: { participante: { include: { actividad: true } } },
    })
    if (!certificado) return NextResponse.json({ error: "No encontrado" }, { status: 404 })
    if (certificado.participante.actividad.tenantId !== tenantId)
      return NextResponse.json({ error: "No autorizado" }, { status: 403 })

    await prisma.certificado.delete({ where: { id: params.id } })
    return NextResponse.json({ message: "Certificado eliminado" })
  } catch (error) {
    console.error("Error eliminando certificado:", error)
    return NextResponse.json({ error: "Error al eliminar" }, { status: 500 })
  }
}
