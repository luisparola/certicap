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

  html, body {
    width: 210mm;
    height: 297mm;
    font-family: Arial, sans-serif;
    font-size: 9.5pt;
    color: #000;
  }

  .page {
    width: 210mm;
    height: 297mm;
    padding: 14mm 16mm 12mm 16mm;
    position: relative;
  }

  /* HEADER */
  table.header { width: 100%; border: 1pt solid #000; border-collapse: collapse; margin-bottom: 6pt; }
  table.header td { border: 1pt solid #000; padding: 5pt 7pt; vertical-align: middle; }
  .header-logo { width: 18%; }
  .header-title { width: 62%; text-align: center; }
  .header-version { width: 20%; text-align: center; font-weight: bold; font-size: 8.5pt; line-height: 2; }
  .header-sistema { font-weight: bold; font-size: 11pt; }
  .header-cert {
    color: #E8541A; font-weight: bold; font-size: 10pt;
    border-top: 1pt solid #000; padding-top: 4pt; margin-top: 4pt;
  }

  /* SECTIONS */
  .sec-title { font-size: 9.5pt; margin-top: 8pt; margin-bottom: 2pt; }
  .sec-title.bold { font-weight: bold; }

  table.info { width: 100%; border-collapse: collapse; font-size: 9.5pt; }
  table.info td { border: 0.5pt solid #000; padding: 4pt 6pt; line-height: 1.3; }
  table.info td.lbl { width: 28%; font-weight: bold; }

  /* NOTAS */
  table.notas { width: 100%; border-collapse: collapse; margin-top: 8pt; font-size: 9.5pt; }
  table.notas td, table.notas th { border: 0.5pt solid #000; padding: 4pt 5pt; text-align: center; }
  table.notas th { background: #D0D0D0; font-weight: bold; }

  /* FECHAS */
  table.fechas { border-collapse: collapse; margin-top: 8pt; font-size: 9.5pt; }
  table.fechas td { border: 0.5pt solid #000; padding: 4pt 6pt; }
  table.fechas td.lbl { font-weight: bold; width: 160pt; }

  /* LEGAL */
  .legal { margin-top: 16pt; font-size: 9pt; font-weight: bold; text-align: justify; line-height: 1.5; }

  /* FIRMA FOOTER */
  table.firma { width: 100%; border-collapse: collapse; margin-top: 14pt; }
  table.firma td { width: 33.3%; text-align: center; vertical-align: bottom; padding: 3pt 5pt; }
  .firma-linea { border-top: 1pt solid #000; width: 65%; margin: 0 auto; padding-top: 3pt; font-size: 9pt; }
  .qr-label { font-size: 7pt; font-weight: bold; margin-bottom: 4pt; }
  .organismo { font-weight: bold; font-size: 12pt; margin-bottom: 4pt; }

  /* PIE — anchored to bottom */
  .pie {
    position: absolute;
    bottom: 12mm;
    left: 16mm;
    right: 16mm;
    text-align: center;
    font-size: 8pt;
    line-height: 1.7;
  }
  .pie b { font-weight: bold; }

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

  img.logo { width: 100%; max-height: 45pt; object-fit: contain; }
  img.firma-img { height: 50pt; object-fit: contain; }
  img.qr { width: 70pt; height: 70pt; }
  img.logo-footer { height: 55pt; object-fit: contain; }
</style>
</head>
<body>
<div class="page">

  <!-- HEADER -->
  <table class="header">
    <tr>
      <td class="header-logo">
        ${d.logoBase64 ? `<img class="logo" src="${d.logoBase64}" alt="Formacap"/>` : "<span style='font-weight:bold;font-size:11pt'>FORMACAP</span>"}
      </td>
      <td class="header-title">
        <div class="header-sistema">Sistema de Gestión de la Calidad</div>
        <div class="header-cert">${esc(titulo)}</div>
      </td>
      <td class="header-version">
        Versión: 3<br/>RES. SENCE 2872<br/>Página ${esc(d.pagina)}
      </td>
    </tr>
  </table>

  <!-- EMPRESA -->
  <div class="sec-title bold">INFORMACIÓN EMPRESA PARTICIPANTE</div>
  <table class="info">
    <tr><td class="lbl">NOMBRE:</td><td>${esc(d.empresa_nombre)}</td></tr>
    <tr><td class="lbl">RUT:</td><td>${esc(d.empresa_rut)}</td></tr>
  </table>

  <!-- CURSO -->
  <div class="sec-title">INFORMACIÓN DE CURSO</div>
  <table class="info">
    <tr><td class="lbl">NOMBRE:</td><td>${esc(d.nombre_curso)}</td></tr>
    <tr><td class="lbl">FECHA INICIO:</td><td>${esc(d.fecha_inicio)}</td></tr>
    <tr><td class="lbl">FECHA TÉRMINO:</td><td>${esc(d.fecha_termino)}</td></tr>
    <tr><td class="lbl">LUGAR:</td><td>${esc(d.lugar)}</td></tr>
    <tr><td class="lbl">INSTRUCTOR:</td><td>${esc(d.instructor)}</td></tr>
  </table>

  <!-- PARTICIPANTE -->
  <div class="sec-title">INFORMACIÓN PARTICIPANTE</div>
  <table class="info">
    <tr><td class="lbl">NOMBRE:</td><td>${esc(d.nombre_participante)}</td></tr>
    <tr><td class="lbl">RUT:</td><td>${esc(d.rut_participante)}</td></tr>
  </table>

  ${isSoldadura ? `
  <!-- PROBETAS -->
  <div class="sec-title">INFORMACIÓN DE PROBETAS</div>
  <table class="info">
    <tr><td class="lbl">ESPESOR/DIÁMETRO DE TUBERÍA:</td><td>${esc(d.espesor_diametro)}</td></tr>
    <tr><td class="lbl">APLICACIÓN DE SOLDADURA:</td><td>${esc(d.aplicacion_soldadura)}</td></tr>
  </table>

  <div class="sec-title">FOTOS DE PROBETAS</div>
  <div class="fotos-wrap">
    ${d.foto_probeta_1 ? `<img src="${d.foto_probeta_1}" alt="Probeta 1"/>` : '<div class="foto-placeholder"></div>'}
    ${d.foto_probeta_2 ? `<img src="${d.foto_probeta_2}" alt="Probeta 2"/>` : '<div class="foto-placeholder"></div>'}
  </div>

  <div class="sec-title bold">OBSERVACIONES</div>
  <div class="obs-box">${esc(d.observaciones ?? "")}</div>
  ` : ""}

  ${showEquipos ? `
  <!-- EQUIPOS PUENTE GRÚA -->
  <div class="sec-title bold">EQUIPOS PUENTE GRÚA</div>
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

  <!-- NOTAS -->
  <table class="notas">
    <tr>
      <th colspan="${showSenales ? 3 : 2}">NOTAS</th>
      <th>ASISTENCIA</th>
      <th>N° REGISTRO</th>
      <th>ESTADO</th>
    </tr>
    <tr>
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

  <!-- FECHAS -->
  <table class="fechas">
    <tr><td class="lbl">FECHA DE EMISIÓN:</td><td>${esc(d.fecha_emision)}</td></tr>
    ${d.fecha_vencimiento ? `<tr><td class="lbl">FECHA DE VENCIMIENTO:</td><td>${esc(d.fecha_vencimiento)}</td></tr>` : ""}
  </table>

  <!-- LEGAL -->
  <div class="legal">
    Yo, Alexander Quijada, Gerente General de OTEC Capacitaciones Q&amp;C Spa, Rut 77.520.118-5,
    certifico que los datos consignados en este documento son fidedignos.
  </div>

  <!-- FIRMA / QR / LOGO -->
  <table class="firma">
    <tr>
      <td>
        <div class="qr-label">Consulta tu certificado:</div>
        <img class="qr" src="${d.qrBase64}" alt="QR"/>
      </td>
      <td>
        ${d.firmaBase64 ? `<img class="firma-img" src="${d.firmaBase64}" alt="Firma"/>` : ""}
        <div class="firma-linea">
          <div style="font-weight:bold">Alexander Quijada</div>
          <div style="font-size:8pt">Gerente General</div>
        </div>
      </td>
      <td>
        <div class="organismo">ORGANISMO TÉCNICO</div>
        ${d.logoBase64 ? `<img class="logo-footer" src="${d.logoBase64}" alt="Formacap"/>` : ""}
      </td>
    </tr>
  </table>

  <!-- PIE — anclado al fondo con position:absolute -->
  <div class="pie">
    Empresa certificada por <b>NCH 2728:2015</b> por el organismo <b>ICONTEC</b><br/>
    <b>Reconocida por SENCE, bajo Resolución 2872</b><br/>
    Página web www.formacap.cl; teléfono de contacto +56 9 73267783
  </div>

</div><!-- /page -->
</body>
</html>`
}
