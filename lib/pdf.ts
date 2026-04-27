import puppeteer from "puppeteer-core"
import chromium from "@sparticuz/chromium-min"
import fs from "fs"
import path from "path"
import { generarHTMLCertificado } from "@/components/certificados/template"

export interface CertificadoData {
  tipo: string
  participante: any
  actividad: any
  certificado: any
  qrDataUrl: string
}

function imageToBase64(filename: string, mimeType: string): string {
  try {
    const fullPath = path.join(process.cwd(), "public", filename)
    const buffer = fs.readFileSync(fullPath)
    return `data:${mimeType};base64,${buffer.toString("base64")}`
  } catch {
    return ""
  }
}

function fmt(d: any): string {
  if (!d) return ""
  try { return new Date(d).toLocaleDateString("es-CL") } catch { return "" }
}

export async function renderCertificadoPDF(data: CertificadoData): Promise<Buffer> {
  const { tipo, participante, actividad, certificado, qrDataUrl } = data

  const logoBase64 = imageToBase64("logo-formacap.png", "image/png")
  const firmaBase64 = imageToBase64("firma-formacap.png", "image/png")

  const showVencimiento = tipo !== "COMPETENCIAS"
  const pagina = tipo === "PUENTE_GRUA" ? "1 de 2" : "1 de 1"

  // Fallback: calculate vencimiento from emision if missing in DB
  let fechaVencimientoFinal = certificado.fecha_vencimiento
  if (!fechaVencimientoFinal && (tipo === "PUENTE_GRUA" || tipo === "RIGGER")) {
    const fe = new Date(certificado.fecha_emision)
    fe.setFullYear(fe.getFullYear() + 1)
    fechaVencimientoFinal = fe
  } else if (!fechaVencimientoFinal && tipo === "SOLDADURA") {
    const fe = new Date(certificado.fecha_emision)
    fe.setFullYear(fe.getFullYear() + 2)
    fechaVencimientoFinal = fe
  }

  const html = generarHTMLCertificado({
    tipo,
    logoBase64,
    firmaBase64,
    qrBase64: qrDataUrl,
    pagina,
    empresa_nombre: actividad.empresa_nombre ?? "",
    empresa_rut: actividad.empresa_rut ?? "",
    nombre_curso: actividad.nombre_curso ?? "",
    fecha_inicio: fmt(actividad.fecha_inicio),
    fecha_termino: fmt(actividad.fecha_termino),
    lugar: actividad.lugar ?? "",
    instructor: actividad.instructor ?? "",
    nombre_participante: participante.nombre ?? "",
    rut_participante: participante.rut ?? "",
    nota_teoria: participante.nota_teoria != null ? String(participante.nota_teoria) : "",
    nota_practica: participante.nota_practica != null ? String(participante.nota_practica) : "",
    asistencia_pct: participante.asistencia_pct != null ? String(participante.asistencia_pct) : "",
    nro_registro: participante.nro_registro ?? "",
    estado: participante.estado ?? "",
    senales: participante.senales ?? "",
    espesor_diametro: participante.espesor_diametro ?? "",
    aplicacion_soldadura: participante.aplicacion_soldadura ?? "",
    observaciones: participante.observaciones ?? "",
    foto_probeta_1: certificado.foto_probeta_1 ?? "",
    foto_probeta_2: certificado.foto_probeta_2 ?? "",
    fecha_emision: fmt(certificado.fecha_emision),
    fecha_vencimiento: showVencimiento && fechaVencimientoFinal
      ? fmt(fechaVencimientoFinal)
      : "",
  })

  const executablePath = process.env.PUPPETEER_EXECUTABLE_PATH
    || await chromium.executablePath(
      "https://github.com/Sparticuz/chromium/releases/download/v131.0.1/chromium-v131.0.1-pack.tar"
    )

  const browser = await puppeteer.launch({
    args: chromium.args,
    defaultViewport: { width: 1280, height: 900 },
    executablePath,
    headless: true,
  })

  try {
    const page = await browser.newPage()
    await page.setContent(html, { waitUntil: "networkidle0" })
    const pdf = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: "0", right: "0", bottom: "0", left: "0" },
    })
    return Buffer.from(pdf)
  } finally {
    await browser.close()
  }
}
