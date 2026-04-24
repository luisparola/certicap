/* HTML certificate template — replaces @react-pdf/renderer */

const TITULO_CERT: Record<string, string> = {
  COMPETENCIAS: "CERTIFICADO DE COMPETENCIAS",
  PUENTE_GRUA: "CERTIFICADO DE OPERADOR DE PUENTE GRÚA",
  RIGGER: "CERTIFICADO DE RIGGER",
  SOLDADURA: "CERTIFICADO DE SOLDADURA",
}

function esc(val: any): string {
  if (val == null) return ""
  return String(val)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}

export interface HtmlCertData {
  tipo: string
  logoBase64: string
  firmaBase64: string
  qrBase64: string
  pagina: string
  empresa_nombre: string
  empresa_rut: string
  nombre_curso: string
  fecha_inicio: string
  fecha_termino: string
  lugar: string
  instructor: string
  nombre_participante: string
  rut_participante: string
  nota_teoria: string
  nota_practica: string
  asistencia_pct: string
  nro_registro: string
  estado: string
  senales: string
  espesor_diametro?: string
  aplicacion_soldadura?: string
  observaciones?: string
  foto_probeta_1?: string
  foto_probeta_2?: string
  fecha_emision: string
  fecha_vencimiento?: string
}

export function generarHTMLCertificado(d: HtmlCertData): string {
  const showSenales = d.tipo === "RIGGER" || d.tipo === "PUENTE_GRUA"
  const showEquipos = d.tipo === "PUENTE_GRUA"
  const isSoldadura = d.tipo === "SOLDADURA"
  const titulo = TITULO_CERT[d.tipo] ?? d.tipo

  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8"/>
<style>
  @page { size: A4; margin: 0; }
  * { margin: 0; padding: 0; box-sizing: border-box; }

  body {
    font-family: Arial, sans-serif;
    font-size: 9pt;
    color: #000;
    width: 210mm;
    min-height: 277mm;
    padding: 12mm 15mm 10mm 15mm;
    position: relative;
  }

  /* HEADER */
  table.header {
    width: 100%;
    border: 1pt solid #000;
    border-collapse: collapse;
    margin-bottom: 0;
  }
  table.header td { border: 0.5pt solid #000; padding: 3pt 5pt; vertical-align: middle; }
  .logo-cell { width: 20%; text-align: center; }
  .title-cell { width: 60%; text-align: center; }
  .version-cell { width: 20%; text-align: center; font-weight: bold; font-size: 8pt; line-height: 1.7; }
  .sgc-text { font-weight: bold; font-size: 10pt; }
  .cert-title-text {
    color: #E8541A; font-weight: bold; font-size: 10pt;
    border-top: 0.5pt solid #000; padding-top: 3pt; margin-top: 3pt;
  }

  /* SECTION TITLES */
  .seccion-titulo { font-size: 9pt; margin-top: 7pt; margin-bottom: 1pt; }
  .seccion-titulo.bold   { font-weight: bold; }
  .seccion-titulo.normal { font-weight: normal; }

  /* INFO TABLE */
  table.info { width: 100%; border-collapse: collapse; font-size: 9pt; margin-bottom: 0; }
  table.info td { border: 0.5pt solid #000; padding: 2.5pt 5pt; line-height: 1.2; }
  table.info td.label { width: 28%; font-weight: bold; }

  /* NOTAS TABLE */
  table.notas { width: 100%; border-collapse: collapse; margin-top: 7pt; font-size: 9pt; }
  table.notas td, table.notas th { border: 0.5pt solid #000; padding: 3pt 4pt; text-align: center; }
  table.notas .header-row th { background: #D0D0D0; font-weight: bold; }

  /* FECHAS */
  table.fechas { width: 45%; border-collapse: collapse; margin-top: 7pt; font-size: 9pt; }
  table.fechas td { border: 0.5pt solid #000; padding: 2.5pt 5pt; }
  table.fechas td.label { font-weight: bold; }

  /* LEGAL */
  .texto-legal {
    margin-top: 20pt;
    font-size: 8.5pt;
    font-weight: bold;
    text-align: justify;
    line-height: 1.4;
  }

  /* FOOTER */
  table.footer { width: 100%; border-collapse: collapse; margin-top: 15pt; }
  table.footer td { width: 33.3%; text-align: center; vertical-align: bottom; padding: 3pt; }
  .qr-label { font-size: 7pt; margin-bottom: 3pt; }
  .firma-line { border-top: 1pt solid #000; width: 70%; margin: 3pt auto 0; padding-top: 2pt; }
  .org-label { font-weight: bold; font-size: 10pt; margin-bottom: 3pt; }

  /* PIE */
  .pie { text-align: center; font-size: 7.5pt; margin-top: 20pt; line-height: 1.6; }

  /* EQUIPOS */
  table.equipos { width: 100%; border-collapse: collapse; margin-top: 3pt; font-size: 6.5pt; }
  table.equipos td { border: 0.5pt solid #000; padding: 1.5pt 2pt; text-align: center; }
  table.equipos td.eq-lbl { font-weight: bold; background: #E8E8E8; text-align: left; width: 12%; }

  /* FOTOS */
  .fotos-wrap { display: flex; gap: 4pt; border: 0.5pt solid #000; padding: 3pt; margin-top: 2pt; }
  .fotos-wrap img { width: 49%; height: 110pt; object-fit: cover; }
  .foto-placeholder { width: 49%; height: 110pt; border: 0.5pt solid #ccc; }

  /* OBS */
  .obs-box { border: 0.5pt solid #000; min-height: 36pt; padding: 4pt; margin-top: 2pt; font-size: 9pt; }

  img.logo { width: 100%; max-height: 44pt; object-fit: contain; }
  img.firma { height: 42pt; max-width: 130pt; object-fit: contain; }
  img.qr { width: 62pt; height: 62pt; }
  img.logo-footer { height: 46pt; object-fit: contain; }
</style>
</head>
<body>

<!-- 1. HEADER -->
<table class="header">
  <tr>
    <td class="logo-cell">
      ${d.logoBase64 ? `<img class="logo" src="${d.logoBase64}" alt="Formacap"/>` : "<span style='font-weight:bold;font-size:11pt'>FORMACAP</span>"}
    </td>
    <td class="title-cell">
      <div class="sgc-text">Sistema de Gestión de la Calidad</div>
      <div class="cert-title-text">${esc(titulo)}</div>
    </td>
    <td class="version-cell">
      Versión: 3<br/>RES. SENCE 2872<br/>Página ${esc(d.pagina)}
    </td>
  </tr>
</table>

<!-- 2. EMPRESA -->
<div class="seccion-titulo bold">INFORMACIÓN EMPRESA PARTICIPANTE</div>
<table class="info">
  <tr><td class="label">NOMBRE:</td><td>${esc(d.empresa_nombre)}</td></tr>
  <tr><td class="label">RUT:</td><td>${esc(d.empresa_rut)}</td></tr>
</table>

<!-- 3. CURSO -->
<div class="seccion-titulo normal">INFORMACIÓN DE CURSO</div>
<table class="info">
  <tr><td class="label">NOMBRE:</td><td>${esc(d.nombre_curso)}</td></tr>
  <tr><td class="label">FECHA INICIO:</td><td>${esc(d.fecha_inicio)}</td></tr>
  <tr><td class="label">FECHA TÉRMINO:</td><td>${esc(d.fecha_termino)}</td></tr>
  <tr><td class="label">LUGAR:</td><td>${esc(d.lugar)}</td></tr>
  <tr><td class="label">INSTRUCTOR:</td><td>${esc(d.instructor)}</td></tr>
</table>

<!-- 4. PARTICIPANTE -->
<div class="seccion-titulo normal">INFORMACIÓN PARTICIPANTE</div>
<table class="info">
  <tr><td class="label">NOMBRE:</td><td>${esc(d.nombre_participante)}</td></tr>
  <tr><td class="label">RUT:</td><td>${esc(d.rut_participante)}</td></tr>
</table>

${isSoldadura ? `
<!-- 5. SOLDADURA: PROBETAS -->
<div class="seccion-titulo normal">INFORMACIÓN DE PROBETAS</div>
<table class="info">
  <tr><td class="label">ESPESOR/DIÁMETRO DE TUBERÍA:</td><td>${esc(d.espesor_diametro)}</td></tr>
  <tr><td class="label">APLICACIÓN DE SOLDADURA:</td><td>${esc(d.aplicacion_soldadura)}</td></tr>
</table>

<!-- 5b. FOTOS PROBETAS -->
<div class="seccion-titulo normal">FOTOS DE PROBETAS</div>
<div class="fotos-wrap">
  ${d.foto_probeta_1 ? `<img src="${d.foto_probeta_1}" alt="Probeta 1"/>` : '<div class="foto-placeholder"></div>'}
  ${d.foto_probeta_2 ? `<img src="${d.foto_probeta_2}" alt="Probeta 2"/>` : '<div class="foto-placeholder"></div>'}
</div>

<!-- 5c. OBSERVACIONES -->
<div class="seccion-titulo bold">OBSERVACIONES</div>
<div class="obs-box">${esc(d.observaciones ?? "")}</div>
` : ""}

${showEquipos ? `
<!-- 6. EQUIPOS PUENTE GRÚA -->
<div class="seccion-titulo bold">EQUIPOS PUENTE GRÚA</div>
<table class="equipos">
  <tr>
    <td class="eq-lbl">MARCA</td>
    <td>KONECRANES</td><td>KONECRANES</td><td>KONECRANES</td><td>KONECRANES</td><td>KONECRANES</td><td>KONECRANES</td><td>KONECRANES</td>
  </tr><tr>
    <td class="eq-lbl">MODELO</td>
    <td>SMO912/XL708</td><td>SMO912/XL708</td><td>XL7712/XL403</td><td>XL708/XL403</td><td>CTX704</td><td>SMO912E/CXT704</td><td>TAG370XL Km-0</td>
  </tr><tr>
    <td class="eq-lbl">CAPACIDAD</td>
    <td>65/27 Ton</td><td>87/27 Ton</td><td>35/5 Ton</td><td>20/5 Ton</td><td>35 Ton</td><td>85/35 Ton</td><td>10 Ton</td>
  </tr>
</table>
<table class="equipos" style="margin-top:2pt">
  <tr>
    <td class="eq-lbl">MARCA</td>
    <td>ABUS</td><td>ABUS</td><td>ABUS</td><td>ABUS</td><td>ABUS</td><td>ABUS</td><td>ABUS</td><td>ABUS</td><td>ABUS</td>
  </tr><tr>
    <td class="eq-lbl">MODELO</td>
    <td>XL708/XL403</td><td>GM5000</td><td>GM5000</td><td>GM200</td><td>GM6200L</td><td>GM6200L</td><td>GM532H6/GM3050L</td><td>GM3060L6</td><td>TK712</td>
  </tr><tr>
    <td class="eq-lbl">CAPACIDAD</td>
    <td>15/5 Ton</td><td>25/5 Ton</td><td>0.5 Ton</td><td>2.5 Ton</td><td>20 Ton</td><td>12,5 Ton</td><td>30/5 Ton</td><td>5 Ton</td><td>3.2 Ton</td>
  </tr>
</table>
<table class="equipos" style="margin-top:2pt">
  <tr>
    <td class="eq-lbl">MARCA</td>
    <td>R&amp;M</td><td>INAMAR</td><td>TBM</td><td>WORLDHOIST/FIEFR</td><td>WORLDHOIST/FIEFR</td><td>WORLDHOIST/FIEFR</td><td>INAMAR/VAPOR</td><td>INAMAR/VAPOR</td>
  </tr><tr>
    <td class="eq-lbl">MODELO</td>
    <td>SX608</td><td>Biviga</td><td>PORTICO 3500</td><td>K2102</td><td>K3102</td><td>K4104</td><td>GM7000.125000</td><td>GM7000.90000</td>
  </tr><tr>
    <td class="eq-lbl">CAPACIDAD</td>
    <td>40 Ton</td><td>30/5 Ton</td><td>2 TON</td><td>1 TON</td><td>2 TON</td><td>12.5 TON</td><td>125/20 Ton</td><td>90/15 Ton</td>
  </tr>
</table>
<table class="equipos" style="margin-top:2pt">
  <tr>
    <td class="eq-lbl">MARCA</td><td>INAMAR/VAPOR</td><td>INAMAR/VAPOR</td>
  </tr><tr>
    <td class="eq-lbl">MODELO</td><td>GM6000.8000</td><td>GM800.3200</td>
  </tr><tr>
    <td class="eq-lbl">CAPACIDAD</td><td>7.5 Ton</td><td>3.2 Ton</td>
  </tr>
</table>
` : ""}

<!-- 7. NOTAS -->
<table class="notas">
  <tr class="header-row">
    <th colspan="${showSenales ? 3 : 2}">NOTAS</th>
    <th>ASISTENCIA</th>
    <th>N° REGISTRO</th>
    <th>ESTADO</th>
  </tr>
  <tr class="header-row">
    <th>TEORÍA</th>
    ${showSenales ? "<th>SEÑALES</th>" : ""}
    <th>PRÁCTICA</th>
    <th></th><th></th><th></th>
  </tr>
  <tr>
    <td>${esc(d.nota_teoria)}</td>
    ${showSenales ? `<td>${esc(d.senales)}</td>` : ""}
    <td>${esc(d.nota_practica)}</td>
    <td>${esc(d.asistencia_pct)}${d.asistencia_pct ? "%" : ""}</td>
    <td>${esc(d.nro_registro)}</td>
    <td><b>${esc(d.estado)}</b></td>
  </tr>
</table>

<!-- 8. FECHAS -->
<table class="fechas">
  <tr><td class="label">FECHA DE EMISIÓN:</td><td>${esc(d.fecha_emision)}</td></tr>
  ${d.fecha_vencimiento ? `<tr><td class="label">FECHA DE VENCIMIENTO:</td><td>${esc(d.fecha_vencimiento)}</td></tr>` : ""}
</table>

<!-- 9. LEGAL -->
<div class="texto-legal">
  Yo, Alexander Quijada, Gerente General de OTEC Capacitaciones Q&amp;C Spa, Rut 77.520.118-5,
  certifico que los datos consignados en este documento son fidedignos.
</div>

<!-- 10. FOOTER QR / FIRMA / LOGO -->
<table class="footer">
  <tr>
    <td>
      <div class="qr-label">Consulta tu certificado:</div>
      <img class="qr" src="${d.qrBase64}" alt="QR"/>
    </td>
    <td>
      ${d.firmaBase64 ? `<img class="firma" src="${d.firmaBase64}" alt="Firma"/>` : ""}
      <div class="firma-line">
        <div style="font-weight:bold;font-size:8.5pt">Alexander Quijada</div>
        <div style="font-size:7.5pt">Gerente General</div>
      </div>
    </td>
    <td>
      <div class="org-label">ORGANISMO TÉCNICO</div>
      ${d.logoBase64 ? `<img class="logo-footer" src="${d.logoBase64}" alt="Formacap"/>` : ""}
    </td>
  </tr>
</table>

<!-- 11. PIE -->
<div class="pie">
  Empresa certificada por <b>NCH 2728:2015</b> por el organismo <b>ICONTEC</b><br/>
  <b>Reconocida por SENCE, bajo Resolución 2872</b><br/>
  Página web www.formacap.cl; teléfono de contacto +56 9 73267783
</div>

</body>
</html>`
}
