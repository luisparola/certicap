import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { generarCodigo } from "@/lib/certificado"
import { generarQR } from "@/lib/qr"
import { renderCertificadoPDF } from "@/lib/pdf"

const ALLOWED_MIME = ["image/jpeg", "image/png", "image/webp"]
const MAX_SIZE = 5 * 1024 * 1024

function isAllowedDataUri(value: string): boolean {
  return ALLOWED_MIME.some((mime) => value.startsWith(`data:${mime};base64,`))
}

function validateImageDataUri(value: string): NextResponse | null {
  if (!isAllowedDataUri(value)) {
    return NextResponse.json({ error: "Formato no permitido" }, { status: 400 })
  }
  if (value.length * 0.75 > MAX_SIZE) {
    return NextResponse.json({ error: "Imagen muy grande" }, { status: 400 })
  }
  return null
}

function validateImageFile(file: File): NextResponse | null {
  if (!ALLOWED_MIME.includes(file.type) || file.size > MAX_SIZE) {
    return NextResponse.json({ error: "Imagen invalida" }, { status: 400 })
  }
  return null
}

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
      if (f1 instanceof File && f1.size > 0) {
        const invalid = validateImageFile(f1)
        if (invalid) return invalid
        foto_probeta_1 = await fileToDataUri(f1)
      }
      if (f2 instanceof File && f2.size > 0) {
        const invalid = validateImageFile(f2)
        if (invalid) return invalid
        foto_probeta_2 = await fileToDataUri(f2)
      }
    } else {
      const body = await request.json()
      participanteId = body.participanteId
      foto_probeta_1 = body.foto_probeta_1 || null
      foto_probeta_2 = body.foto_probeta_2 || null
      for (const foto of [foto_probeta_1, foto_probeta_2]) {
        if (typeof foto === "string") {
          const invalid = validateImageDataUri(foto)
          if (invalid) return invalid
        }
      }
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
    const tipoCert = participante.actividad.tipo_certificado
    if (tipoCert === "PUENTE_GRUA" || tipoCert === "RIGGER") {
      fechaVencimiento = new Date(fechaEmision)
      fechaVencimiento.setFullYear(fechaVencimiento.getFullYear() + 1)
    } else if (tipoCert === "SOLDADURA" || tipoCert === "COMPETENCIAS") {
      fechaVencimiento = new Date(fechaEmision)
      fechaVencimiento.setFullYear(fechaVencimiento.getFullYear() + 2)
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
  } catch (error) {
    console.error("[generar-certificado]", error instanceof Error ? error.message : error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
