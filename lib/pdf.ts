import puppeteer from "puppeteer"
import path from "path"
import fs from "fs"

export async function renderPDF(html: string): Promise<Buffer> {
  let browser
  try {
    // Desarrollo local: Puppeteer bundled Chromium
    // Produccion (Vercel): @sparticuz/chromium
    const isVercel = process.env.VERCEL === "1" || process.env.AWS_LAMBDA_FUNCTION_VERSION
    
    if (isVercel) {
      const chromium = require("@sparticuz/chromium")
      browser = await puppeteer.launch({
        args: chromium.args,
        defaultViewport: chromium.defaultViewport,
        executablePath: await chromium.executablePath(),
        headless: true,
      })
    } else {
      browser = await puppeteer.launch({
        headless: true,
        args: ["--no-sandbox", "--disable-setuid-sandbox"],
      })
    }

    const page = await browser.newPage()
    await page.setContent(html, { waitUntil: "networkidle0" })
    
    const pdfBuffer = await page.pdf({
      format: "Letter",
      printBackground: true,
      margin: { top: "10mm", right: "10mm", bottom: "10mm", left: "10mm" },
    })

    return Buffer.from(pdfBuffer)
  } finally {
    if (browser) await browser.close()
  }
}

export function savePDF(buffer: Buffer, filename: string): string {
  const dir = path.join(process.cwd(), "public", "uploads", "certificados")
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
  const filepath = path.join(dir, filename)
  fs.writeFileSync(filepath, buffer)
  return `/uploads/certificados/${filename}`
}
