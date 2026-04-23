export function generarTemplateHTML(data: {
  tipo: string; participante: any; actividad: any; certificado: any;
  qrDataUrl: string; logoBase64?: string; firmaBase64?: string;
}): string {
  const { tipo, participante, actividad, certificado, qrDataUrl } = data
  const tipoLabel: Record<string, string> = {
    COMPETENCIAS: "CERTIFICADO DE COMPETENCIAS",
    PUENTE_GRUA: "CERTIFICADO DE OPERADOR DE PUENTE GRUA",
    RIGGER: "CERTIFICADO DE RIGGER",
    SOLDADURA: "CERTIFICADO DE SOLDADURA",
  }
  const fechaEmision = new Date(certificado.fecha_emision).toLocaleDateString("es-CL")
  const fechaVencimiento = certificado.fecha_vencimiento ? new Date(certificado.fecha_vencimiento).toLocaleDateString("es-CL") : "N/A"
  const fechaInicio = new Date(actividad.fecha_inicio).toLocaleDateString("es-CL")
  const fechaTermino = new Date(actividad.fecha_termino).toLocaleDateString("es-CL")

  let equipoSection = ""
  if (tipo === "PUENTE_GRUA") {
    equipoSection = `
      <div class="section-title">DATOS DEL EQUIPO</div>
      <table class="info-table"><tbody>
        <tr><td class="label">Marca</td><td>${participante.marca_equipo || "-"}</td><td class="label">Modelo</td><td>${participante.modelo_equipo || "-"}</td></tr>
        <tr><td class="label">Capacidad</td><td>${participante.capacidad_equipo || "-"}</td><td class="label">Senales</td><td>${participante.senales || "-"}</td></tr>
      </tbody></table>`
  }

  let fotosSection = ""
  if (tipo === "SOLDADURA" && (certificado.foto_probeta_1 || certificado.foto_probeta_2)) {
    fotosSection = `
      <div class="section-title">FOTOS DE PROBETAS</div>
      <div class="fotos-container">
        ${certificado.foto_probeta_1 ? `<div class="foto"><img src="${certificado.foto_probeta_1}" alt="Probeta 1" /></div>` : ""}
        ${certificado.foto_probeta_2 ? `<div class="foto"><img src="${certificado.foto_probeta_2}" alt="Probeta 2" /></div>` : ""}
      </div>`
  }

  return `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><style>
  @page { size: letter; margin: 0; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: Arial, Helvetica, sans-serif; font-size: 11px; color: #1A1A1A; padding: 15mm; }
  .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; border-bottom: 2px solid #E8541A; padding-bottom: 10px; }
  .header-left { display: flex; align-items: center; gap: 10px; }
  .header-logo { width: 120px; height: 40px; background: #E8541A; color: white; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 14px; border-radius: 4px; }
  .header-text { font-size: 9px; color: #666; }
  .header-right { text-align: right; font-size: 9px; color: #666; }
  .cert-title { background: #E8541A; color: white; text-align: center; padding: 8px; font-size: 14px; font-weight: bold; margin: 15px 0; border-radius: 4px; }
  .section-title { background: #f5f5f5; border-left: 3px solid #E8541A; padding: 5px 10px; font-weight: bold; font-size: 11px; margin: 12px 0 8px; }
  .info-table { width: 100%; border-collapse: collapse; margin-bottom: 10px; }
  .info-table td { border: 1px solid #ddd; padding: 5px 8px; font-size: 10px; }
  .info-table .label { background: #f9f9f9; font-weight: bold; width: 25%; color: #333; }
  .notas-table { width: 100%; border-collapse: collapse; margin-bottom: 10px; }
  .notas-table th { background: #E8541A; color: white; padding: 6px 8px; font-size: 10px; text-align: center; }
  .notas-table td { border: 1px solid #ddd; padding: 5px 8px; font-size: 10px; text-align: center; }
  .legal { font-size: 9px; color: #666; margin: 15px 0; line-height: 1.4; font-style: italic; }
  .footer { display: flex; justify-content: space-between; align-items: flex-end; margin-top: 20px; padding-top: 15px; border-top: 1px solid #ddd; }
  .footer-qr img { width: 100px; }
  .footer-firma { text-align: center; }
  .footer-firma .line { width: 200px; border-top: 1px solid #333; margin: 0 auto 5px; }
  .footer-firma .name { font-weight: bold; font-size: 11px; }
  .footer-firma .title { font-size: 9px; color: #666; }
  .footer-logo { width: 80px; height: 27px; background: #E8541A; color: white; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 10px; border-radius: 3px; }
  .page-footer { text-align: center; font-size: 8px; color: #999; margin-top: 10px; padding-top: 5px; border-top: 1px solid #eee; }
  .fechas { display: flex; gap: 20px; margin: 10px 0; }
  .fechas div { font-size: 10px; }
  .fechas .lbl { color: #666; }
  .fotos-container { display: flex; gap: 15px; justify-content: center; margin: 10px 0; }
  .foto { border: 1px solid #ddd; padding: 5px; border-radius: 4px; }
  .foto img { width: 200px; height: 150px; object-fit: cover; }
  .estado-badge { display: inline-block; padding: 3px 12px; border-radius: 12px; font-weight: bold; font-size: 10px; }
  .estado-aprobado { background: #d4edda; color: #155724; }
  .estado-reprobado { background: #f8d7da; color: #721c24; }
</style></head>
<body>
  <div class="header">
    <div class="header-left">
      <div class="header-logo">FORMACAP</div>
      <div class="header-text">Sistema de Gestion de la Calidad<br/>OTEC Capacitaciones Q&C Spa</div>
    </div>
    <div class="header-right">Version 1.0<br/>RES. SENCE 2872<br/>Codigo: ${certificado.codigo}</div>
  </div>

  <div class="cert-title">${tipoLabel[tipo] || "CERTIFICADO"}</div>

  <div class="section-title">INFORMACION EMPRESA PARTICIPANTE</div>
  <table class="info-table"><tbody>
    <tr><td class="label">Nombre Empresa</td><td>${actividad.empresa_nombre}</td><td class="label">RUT Empresa</td><td>${actividad.empresa_rut}</td></tr>
  </tbody></table>

  <div class="section-title">INFORMACION DE CURSO</div>
  <table class="info-table"><tbody>
    <tr><td class="label">Nombre Curso</td><td colspan="3">${actividad.nombre_curso}</td></tr>
    <tr><td class="label">Fecha Inicio</td><td>${fechaInicio}</td><td class="label">Fecha Termino</td><td>${fechaTermino}</td></tr>
    <tr><td class="label">Lugar</td><td>${actividad.lugar}</td><td class="label">Instructor</td><td>${actividad.instructor}</td></tr>
  </tbody></table>

  <div class="section-title">INFORMACION PARTICIPANTE</div>
  <table class="info-table"><tbody>
    <tr><td class="label">Nombre</td><td>${participante.nombre}</td><td class="label">RUT</td><td>${participante.rut}</td></tr>
  </tbody></table>

  <div class="section-title">NOTAS Y EVALUACION</div>
  <table class="notas-table"><thead><tr><th>Teoria</th><th>Practica</th><th>Asistencia</th><th>N Registro</th><th>Estado</th></tr></thead><tbody>
    <tr>
      <td>${participante.nota_teoria ?? "-"}</td>
      <td>${participante.nota_practica ?? "-"}</td>
      <td>${participante.asistencia_pct ? participante.asistencia_pct + "%" : "-"}</td>
      <td>${participante.nro_registro || "-"}</td>
      <td><span class="estado-badge ${participante.estado === "APROBADO" ? "estado-aprobado" : "estado-reprobado"}">${participante.estado}</span></td>
    </tr>
  </tbody></table>

  ${equipoSection}
  ${fotosSection}

  <div class="fechas">
    <div><span class="lbl">Fecha de Emision:</span> <strong>${fechaEmision}</strong></div>
    <div><span class="lbl">Fecha de Vencimiento:</span> <strong>${fechaVencimiento}</strong></div>
  </div>

  <div class="legal">Yo, Alexander Quijada, Gerente General de OTEC Capacitaciones Q&C Spa, Rut 77.520.118-5, certifico que los datos consignados en este documento son fidedignos.</div>

  <div class="footer">
    <div class="footer-qr"><img src="${qrDataUrl}" alt="QR" /></div>
    <div class="footer-firma"><div class="line"></div><div class="name">Alexander Quijada</div><div class="title">Gerente General<br/>OTEC Capacitaciones Q&C Spa</div></div>
    <div class="footer-logo">FORMACAP</div>
  </div>

  <div class="page-footer">Empresa certificada por NCH 2728:2015 por el organismo ICONTEC — Reconocida por SENCE, bajo Resolucion 2872 — www.formacap.cl — +56 9 73267783 — Pagina 1 de 1</div>
</body></html>`
}
