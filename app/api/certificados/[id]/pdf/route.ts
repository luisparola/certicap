import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { generarQR } from "@/lib/qr"
import { renderCertificadoPDF } from "@/lib/pdf"

export async function GET(
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

    const qrDataUrl = await generarQR(certificado.qr_url ?? `${process.env.NEXT_PUBLIC_BASE_URL}/verificar/${certificado.codigo}`)

    const pdfBuffer = await renderCertificadoPDF({
      tipo: certificado.participante.actividad.tipo_certificado,
      participante: certificado.participante,
      actividad: certificado.participante.actividad,
      certificado,
      qrDataUrl,
    })

    return new Response(new Uint8Array(pdfBuffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="certificado-${certificado.codigo}.pdf"`,
      },
    })
  } catch (error) {
    console.error("[certificado-pdf]", error instanceof Error ? error.message : error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
