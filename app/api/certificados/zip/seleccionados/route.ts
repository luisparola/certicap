import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { generarQR } from "@/lib/qr"
import { renderCertificadoPDF } from "@/lib/pdf"
import archiver from "archiver"

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    const tenantId = (session.user as any).tenantId

    const { certificadoIds } = await request.json()
    if (!Array.isArray(certificadoIds) || certificadoIds.length === 0) {
      return NextResponse.json({ error: "Sin certificados seleccionados" }, { status: 400 })
    }

    const certificados = await prisma.certificado.findMany({
      where: { id: { in: certificadoIds } },
      include: { participante: { include: { actividad: true } } },
    })

    // Verify all certs belong to this tenant
    const unauthorized = certificados.some(
      (c) => c.participante.actividad.tenantId !== tenantId
    )
    if (unauthorized) return NextResponse.json({ error: "No autorizado" }, { status: 403 })

    if (certificados.length === 0) {
      return NextResponse.json({ error: "No se encontraron certificados" }, { status: 404 })
    }

    const chunks: Buffer[] = []
    const archive = archiver("zip", { zlib: { level: 9 } })
    archive.on("data", (chunk) => chunks.push(chunk))
    const finished = new Promise<Buffer>((resolve, reject) => {
      archive.on("end", () => resolve(Buffer.concat(chunks)))
      archive.on("error", reject)
    })

    for (const cert of certificados) {
      const qrDataUrl = await generarQR(
        cert.qr_url ?? `${process.env.NEXT_PUBLIC_BASE_URL}/verificar/${cert.codigo}`
      )
      const pdfBuffer = await renderCertificadoPDF({
        tipo: cert.participante.actividad.tipo_certificado,
        participante: cert.participante,
        actividad: cert.participante.actividad,
        certificado: cert,
        qrDataUrl,
      })
      const cleanName = cert.participante.nombre.replace(/[^a-zA-Z0-9 ]/g, "").replace(/ /g, "_")
      archive.append(pdfBuffer, { name: `${cleanName}.pdf` })
    }

    archive.finalize()
    const zipBuffer = await finished

    const fecha = new Date().toISOString().slice(0, 10)
    return new NextResponse(new Uint8Array(zipBuffer), {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename=certificados_seleccionados_${fecha}.zip`,
      },
    })
  } catch (error) {
    console.error("Error ZIP seleccionados:", error)
    return NextResponse.json({ error: "Error generando ZIP" }, { status: 500 })
  }
}
