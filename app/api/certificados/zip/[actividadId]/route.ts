import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { generarQR } from "@/lib/qr"
import { renderCertificadoPDF } from "@/lib/pdf"
import archiver from "archiver"

export async function GET(
  request: Request,
  { params }: { params: { actividadId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    const tenantId = (session.user as any).tenantId

    const actividad = await prisma.actividad.findFirst({
      where: { id: params.actividadId, tenantId },
      include: { participantes: { include: { certificado: true } } },
    })
    if (!actividad) return NextResponse.json({ error: "No encontrada" }, { status: 404 })

    const conCertificado = actividad.participantes.filter((p: any) => p.certificado)
    if (conCertificado.length === 0)
      return NextResponse.json({ error: "No hay certificados para descargar" }, { status: 400 })

    const chunks: Buffer[] = []
    const archive = archiver("zip", { zlib: { level: 9 } })
    archive.on("data", (chunk) => chunks.push(chunk))
    const finished = new Promise<Buffer>((resolve, reject) => {
      archive.on("end", () => resolve(Buffer.concat(chunks)))
      archive.on("error", reject)
    })

    for (const participante of conCertificado) {
      const cert = participante.certificado!
      const qrDataUrl = await generarQR(cert.qr_url)
      const pdfBuffer = await renderCertificadoPDF({
        tipo: actividad.tipo_certificado,
        participante,
        actividad,
        certificado: cert,
        qrDataUrl,
      })
      const cleanName = participante.nombre.replace(/[^a-zA-Z0-9 ]/g, "").replace(/ /g, "_")
      archive.append(pdfBuffer, { name: `${cleanName}.pdf` })
    }

    archive.finalize()
    const zipBuffer = await finished

    return new NextResponse(new Uint8Array(zipBuffer), {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename=certificados_${actividad.nombre_curso.replace(/\s/g, "_")}.zip`,
      },
    })
  } catch (error) {
    console.error("Error ZIP:", error)
    return NextResponse.json({ error: "Error generando ZIP" }, { status: 500 })
  }
}
