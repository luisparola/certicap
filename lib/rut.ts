export function validarRut(rut: string): boolean {
  const clean = rut.replace(/\./g, "").replace(/-/g, "").toUpperCase()
  if (clean.length < 2) return false
  const body = clean.slice(0, -1)
  const dv = clean.slice(-1)

  if (!/^\d+$/.test(body)) return false

  let sum = 0
  let multiplier = 2
  for (let i = body.length - 1; i >= 0; i--) {
    sum += parseInt(body[i]) * multiplier
    multiplier = multiplier === 7 ? 2 : multiplier + 1
  }
  const expected = 11 - (sum % 11)
  const dvCalc = expected === 11 ? "0" : expected === 10 ? "K" : String(expected)
  return dv === dvCalc
}

export function formatRut(rut: string): string {
  const clean = rut.replace(/\./g, "").replace(/-/g, "").toUpperCase()
  if (clean.length < 2) return rut
  const body = clean.slice(0, -1)
  const dv = clean.slice(-1)
  return body.replace(/\B(?=(\d{3})+(?!\d))/g, ".") + "-" + dv
}

export function limpiarRut(rut: string): string {
  return rut.replace(/\./g, "").replace(/-/g, "").toUpperCase()
}

export function ocultarRut(rut: string): string {
  const clean = limpiarRut(rut)
  if (clean.length < 5) return "****"
  return "****" + clean.slice(-4)
}
