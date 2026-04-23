import QRCode from "qrcode"

export async function generarQR(url: string): Promise<string> {
  const qrDataUrl = await QRCode.toDataURL(url, {
    width: 150,
    margin: 1,
    color: { dark: "#1A1A1A", light: "#FFFFFF" },
  })
  return qrDataUrl
}
