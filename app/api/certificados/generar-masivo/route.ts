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
    const { actividadId } = body

    const actividad = await prisma.actividad.findFirst({
      where: { id: actividadId, tenantId },
      include: { participantes: { include: { certificado: true } } },
    })
    if (!actividad) return NextResponse.json({ error: "No encontrada" }, { status: 404 })

    const sinCertificado = actividad.participantes.filter((p) => {
      if (p.certificado) return false
      if (actividad.tipo_certificado === "SOLDADURA") {
        // Solo generar si ya tiene las 2 fotos (cargadas previamente)
        return true // En masivo, generamos sin fotos por ahora
      }
      return true
    })

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"
    const results = { generated: 0, errors: 0, total: sinCertificado.length }

    for (const participante of sinCertificado) {
      try {
        const codigo = generarCodigo()
        const verificarUrl = `${baseUrl}/verificar/${codigo}`
        const qrDataUrl = await generarQR(verificarUrl)
        const fechaEmision = new Date()
        let fechaVencimiento: Date | null = null
        if (actividad.tipo_certificado === "PUENTE_GRUA") {
          fechaVencimiento = new Date(fechaEmision)
          fechaVencimiento.setFullYear(fechaVencimiento.getFullYear() + 1)
        }
        const certData = {
          id: "temp", participanteId: participante.id, codigo,
          fecha_emision: fechaEmision, fecha_vencimiento: fechaVencimiento,
          foto_probeta_1: null, foto_probeta_2: null, qr_url: verificarUrl,
        }
        const html = generarTemplateHTML({
          tipo: actividad.tipo_certificado, participante, actividad,
          certificado: certData, qrDataUrl,
        })
        const pdfBuffer = await renderPDF(html)
        const pdfUrl = savePDF(pdfBuffer, `${codigo}.pdf`)
        await prisma.certificado.create({
          data: {
            participanteId: participante.id, codigo, pdf_url: pdfUrl,
            fecha_emision: fechaEmision, fecha_vencimiento: fechaVencimiento,
            qr_url: verificarUrl,
          },
        })
        results.generated++
      } catch (err) {
        console.error(`Error cert para ${participante.nombre}:`, err)
        results.errors++
      }
    }

    return NextResponse.json(results)
  } catch (error) {
    console.error("Error generacion masiva:", error)
    return NextResponse.json({ error: "Error en generacion masiva" }, { status: 500 })
  }
}
