import ReactPDF from "@react-pdf/renderer"
import { CertificadoDocument } from "@/components/certificados/template"

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
