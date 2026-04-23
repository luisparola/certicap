import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { generarCodigo } from "@/lib/certificado"
import { generarQR } from "@/lib/qr"
import { renderCertificadoPDF } from "@/lib/pdf"

async function fileToDataUri(file: File): Promise<string> {
  const buf = Buffer.from(await file.arrayBuffer())
  return `data:${file.type};base64,${buf.toString("base64")}`
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    const tenantId = (session.user as any).tenantId

    let participanteId: string
    let foto_probeta_1: string | null = null
    let foto_probeta_2: string | null = null

    const contentType = request.headers.get("content-type") ?? ""
    if (contentType.includes("multipart/form-data")) {
      const fd = await request.formData()
      participanteId = fd.get("participanteId") as string
      const f1 = fd.get("foto_probeta_1") as File | null
      const f2 = fd.get("foto_probeta_2") as File | null
      if (f1 instanceof File) foto_probeta_1 = await fileToDataUri(f1)
      if (f2 instanceof File) foto_probeta_2 = await fileToDataUri(f2)
    } else {
      const body = await request.json()
      participanteId = body.participanteId
      foto_probeta_1 = body.foto_probeta_1 || null
      foto_probeta_2 = body.foto_probeta_2 || null
    }

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
      fecha_vencimiento: fechaVencimiento,
      foto_probeta_1, foto_probeta_2,
      qr_url: verificarUrl,
    }

    const pdfBuffer = await renderCertificadoPDF({
      tipo: participante.actividad.tipo_certificado,
      participante, actividad: participante.actividad,
      certificado: certData, qrDataUrl,
    })

    const certificado = await prisma.certificado.create({
      data: {
        participanteId, codigo, pdf_url: null,
        foto_probeta_1, foto_probeta_2,
        fecha_emision: fechaEmision, fecha_vencimiento: fechaVencimiento,
        qr_url: verificarUrl,
      },
    })

    return new Response(new Uint8Array(pdfBuffer), {
      status: 201,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="certificado-${codigo}.pdf"`,
        "X-Certificado-Id": certificado.id,
        "X-Certificado-Codigo": codigo,
      },
    })
  } catch (error: any) {
    console.error("Error generando certificado:", error)
    return NextResponse.json({
      error: error?.message ?? "Error al generar certificado",
      stack: error?.stack,
    }, { status: 500 })
  }
}
