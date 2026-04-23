import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { generarCodigo } from "@/lib/certificado"
import { generarQR } from "@/lib/qr"
import { renderPDF, savePDF } from "@/lib/pdf"
import { generarTemplateHTML } from "@/components/certificados/template"

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    const tenantId = (session.user as any).tenantId
    const body = await request.json()
    const { participanteId, foto_probeta_1, foto_probeta_2 } = body

    const participante = await prisma.participante.findFirst({
      where: { id: participanteId },
      include: { actividad: true, certificado: true },
    })
    if (!participante) return NextResponse.json({ error: "Participante no encontrado" }, { status: 404 })
    if (participante.actividad.tenantId !== tenantId) return NextResponse.json({ error: "No autorizado" }, { status: 403 })
    if (participante.certificado) return NextResponse.json({ error: "Ya tiene certificado" }, { status: 400 })

    const codigo = generarCodigo()
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"
    const verificarUrl = `${baseUrl}/verificar/${codigo}`
    const qrDataUrl = await generarQR(verificarUrl)

    const fechaEmision = new Date()
    let fechaVencimiento: Date | null = null
    if (participante.actividad.tipo_certificado === "PUENTE_GRUA") {
      fechaVencimiento = new Date(fechaEmision)
      fechaVencimiento.setFullYear(fechaVencimiento.getFullYear() + 1)
    }

    const certData = {
      id: "temp", participanteId, codigo, fecha_emision: fechaEmision,
      fecha_vencimiento: fechaVencimiento, foto_probeta_1: foto_probeta_1 || null,
      foto_probeta_2: foto_probeta_2 || null, qr_url: verificarUrl,
    }

    const html = generarTemplateHTML({
      tipo: participante.actividad.tipo_certificado,
      participante, actividad: participante.actividad,
      certificado: certData, qrDataUrl,
    })

    const pdfBuffer = await renderPDF(html)
    const filename = `${codigo}.pdf`
    const pdfUrl = savePDF(pdfBuffer, filename)

    const certificado = await prisma.certificado.create({
      data: {
        participanteId, codigo, pdf_url: pdfUrl,
        foto_probeta_1: foto_probeta_1 || null, foto_probeta_2: foto_probeta_2 || null,
        fecha_emision: fechaEmision, fecha_vencimiento: fechaVencimiento,
        qr_url: verificarUrl,
      },
    })

    return NextResponse.json(certificado, { status: 201 })
  } catch (error) {
    console.error("Error generando certificado:", error)
    return NextResponse.json({ error: "Error al generar certificado" }, { status: 500 })
  }
}
