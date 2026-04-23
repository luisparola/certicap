import ReactPDF from "@react-pdf/renderer"
import { CertificadoDocument } from "@/components/certificados/template"
import path from "path"
import fs from "fs"

export interface CertificadoData {
  tipo: string
  participante: any
  actividad: any
  certificado: any
  qrDataUrl: string
}

export async function renderCertificadoPDF(data: CertificadoData): Promise<Buffer> {
  const doc = CertificadoDocument(data)
  const stream = await ReactPDF.renderToStream(doc as any)

  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = []
    stream.on("data", (chunk: Buffer) => chunks.push(chunk))
    stream.on("end", () => resolve(Buffer.concat(chunks)))
    stream.on("error", reject)
  })
}

export function savePDF(buffer: Buffer, filename: string): string {
  const dir = path.join(process.cwd(), "public", "uploads", "certificados")
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
  const filepath = path.join(dir, filename)
  fs.writeFileSync(filepath, buffer)
  return `/uploads/certificados/${filename}`
}
