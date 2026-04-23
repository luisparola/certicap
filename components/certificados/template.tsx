import React from "react"
import { Document, Page, Text, View, Image, StyleSheet, Font } from "@react-pdf/renderer"

// -- Styles --
const orange = "#E8541A"
const dark = "#1A1A1A"
const gray = "#666666"
const lightGray = "#f5f5f5"
const border = "#dddddd"

const s = StyleSheet.create({
  page: { padding: 40, fontSize: 10, fontFamily: "Helvetica", color: dark },
  // Header
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingBottom: 8, borderBottomWidth: 2, borderBottomColor: orange, marginBottom: 10 },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 8 },
  headerLogo: { backgroundColor: orange, color: "white", paddingVertical: 8, paddingHorizontal: 14, borderRadius: 3, fontSize: 13, fontFamily: "Helvetica-Bold" },
  headerText: { fontSize: 8, color: gray, lineHeight: 1.4 },
  headerRight: { textAlign: "right", fontSize: 8, color: gray, lineHeight: 1.4 },
  // Title
  certTitle: { backgroundColor: orange, color: "white", textAlign: "center", paddingVertical: 7, fontSize: 13, fontFamily: "Helvetica-Bold", borderRadius: 3, marginVertical: 12 },
  // Section title
  sectionTitle: { backgroundColor: lightGray, borderLeftWidth: 3, borderLeftColor: orange, paddingVertical: 4, paddingHorizontal: 8, fontFamily: "Helvetica-Bold", fontSize: 10, marginTop: 10, marginBottom: 6 },
  // Info table
  tableRow: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: border },
  tableLabel: { width: "25%", backgroundColor: "#f9f9f9", padding: 5, fontFamily: "Helvetica-Bold", fontSize: 9, color: "#333", borderRightWidth: 1, borderRightColor: border },
  tableValue: { width: "25%", padding: 5, fontSize: 9, borderRightWidth: 1, borderRightColor: border },
  tableValueWide: { width: "75%", padding: 5, fontSize: 9 },
  tableContainer: { borderWidth: 1, borderColor: border, marginBottom: 8 },
  // Notas table
  notasHeader: { flexDirection: "row", backgroundColor: orange },
  notasTh: { flex: 1, paddingVertical: 5, paddingHorizontal: 4, color: "white", fontSize: 9, textAlign: "center", fontFamily: "Helvetica-Bold" },
  notasRow: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: border },
  notasTd: { flex: 1, paddingVertical: 5, paddingHorizontal: 4, fontSize: 9, textAlign: "center", borderRightWidth: 1, borderRightColor: border },
  estadoAprobado: { backgroundColor: "#d4edda", color: "#155724", paddingVertical: 2, paddingHorizontal: 8, borderRadius: 8, fontSize: 9, fontFamily: "Helvetica-Bold" },
  estadoReprobado: { backgroundColor: "#f8d7da", color: "#721c24", paddingVertical: 2, paddingHorizontal: 8, borderRadius: 8, fontSize: 9, fontFamily: "Helvetica-Bold" },
  // Fechas
  fechasRow: { flexDirection: "row", gap: 20, marginTop: 8, marginBottom: 6 },
  fechaLabel: { fontSize: 9, color: gray },
  fechaValue: { fontSize: 9, fontFamily: "Helvetica-Bold" },
  // Legal
  legal: { fontSize: 8, color: gray, marginVertical: 10, lineHeight: 1.4, fontStyle: "italic" },
  // Footer
  footer: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end", marginTop: 16, paddingTop: 12, borderTopWidth: 1, borderTopColor: border },
  footerQr: { width: 90 },
  footerFirma: { alignItems: "center" },
  firmaLine: { width: 180, borderTopWidth: 1, borderTopColor: "#333", marginBottom: 4 },
  firmaName: { fontSize: 10, fontFamily: "Helvetica-Bold" },
  firmaTitle: { fontSize: 8, color: gray, textAlign: "center", lineHeight: 1.3 },
  footerLogo: { backgroundColor: orange, color: "white", paddingVertical: 6, paddingHorizontal: 10, borderRadius: 3, fontSize: 9, fontFamily: "Helvetica-Bold" },
  // Page footer
  pageFooter: { textAlign: "center", fontSize: 7, color: "#999", marginTop: 8, paddingTop: 4, borderTopWidth: 1, borderTopColor: "#eee" },
  // Fotos
  fotosContainer: { flexDirection: "row", justifyContent: "center", gap: 12, marginVertical: 8 },
  fotoBox: { borderWidth: 1, borderColor: border, padding: 4, borderRadius: 3 },
  fotoImg: { width: 180, height: 135 },
})

const TIPO_LABELS: Record<string, string> = {
  COMPETENCIAS: "CERTIFICADO DE COMPETENCIAS",
  PUENTE_GRUA: "CERTIFICADO DE OPERADOR DE PUENTE GRUA",
  RIGGER: "CERTIFICADO DE RIGGER",
  SOLDADURA: "CERTIFICADO DE SOLDADURA",
}

function InfoRow({ label1, value1, label2, value2 }: { label1: string; value1: string; label2?: string; value2?: string }) {
  if (label2 !== undefined) {
    return (
      <View style={s.tableRow}>
        <Text style={s.tableLabel}>{label1}</Text>
        <Text style={s.tableValue}>{value1}</Text>
        <Text style={s.tableLabel}>{label2}</Text>
        <Text style={s.tableValue}>{value2 || "-"}</Text>
      </View>
    )
  }
  return (
    <View style={s.tableRow}>
      <Text style={s.tableLabel}>{label1}</Text>
      <Text style={s.tableValueWide}>{value1}</Text>
    </View>
  )
}

export function CertificadoDocument(data: {
  tipo: string; participante: any; actividad: any; certificado: any; qrDataUrl: string;
}) {
  const { tipo, participante, actividad, certificado, qrDataUrl } = data

  const fechaEmision = new Date(certificado.fecha_emision).toLocaleDateString("es-CL")
  const fechaVencimiento = certificado.fecha_vencimiento
    ? new Date(certificado.fecha_vencimiento).toLocaleDateString("es-CL") : "N/A"
  const fechaInicio = new Date(actividad.fecha_inicio).toLocaleDateString("es-CL")
  const fechaTermino = new Date(actividad.fecha_termino).toLocaleDateString("es-CL")

  return (
    <Document>
      <Page size="LETTER" style={s.page}>
        {/* Header */}
        <View style={s.header}>
          <View style={s.headerLeft}>
            <Text style={s.headerLogo}>FORMACAP</Text>
            <View>
              <Text style={s.headerText}>Sistema de Gestion de la Calidad</Text>
              <Text style={s.headerText}>OTEC Capacitaciones Q&C Spa</Text>
            </View>
          </View>
          <View>
            <Text style={s.headerRight}>Version 1.0</Text>
            <Text style={s.headerRight}>RES. SENCE 2872</Text>
            <Text style={s.headerRight}>Codigo: {certificado.codigo}</Text>
          </View>
        </View>

        {/* Title */}
        <Text style={s.certTitle}>{TIPO_LABELS[tipo] || "CERTIFICADO"}</Text>

        {/* Empresa */}
        <Text style={s.sectionTitle}>INFORMACION EMPRESA PARTICIPANTE</Text>
        <View style={s.tableContainer}>
          <InfoRow label1="Nombre Empresa" value1={actividad.empresa_nombre} label2="RUT Empresa" value2={actividad.empresa_rut} />
        </View>

        {/* Curso */}
        <Text style={s.sectionTitle}>INFORMACION DE CURSO</Text>
        <View style={s.tableContainer}>
          <InfoRow label1="Nombre Curso" value1={actividad.nombre_curso} />
          <InfoRow label1="Fecha Inicio" value1={fechaInicio} label2="Fecha Termino" value2={fechaTermino} />
          <InfoRow label1="Lugar" value1={actividad.lugar} label2="Instructor" value2={actividad.instructor} />
        </View>

        {/* Participante */}
        <Text style={s.sectionTitle}>INFORMACION PARTICIPANTE</Text>
        <View style={s.tableContainer}>
          <InfoRow label1="Nombre" value1={participante.nombre} label2="RUT" value2={participante.rut} />
        </View>

        {/* Notas */}
        <Text style={s.sectionTitle}>NOTAS Y EVALUACION</Text>
        <View style={{ borderWidth: 1, borderColor: border, marginBottom: 8 }}>
          <View style={s.notasHeader}>
            <Text style={s.notasTh}>Teoria</Text>
            <Text style={s.notasTh}>Practica</Text>
            <Text style={s.notasTh}>Asistencia</Text>
            <Text style={s.notasTh}>N Registro</Text>
            <Text style={s.notasTh}>Estado</Text>
          </View>
          <View style={s.notasRow}>
            <Text style={s.notasTd}>{participante.nota_teoria ?? "-"}</Text>
            <Text style={s.notasTd}>{participante.nota_practica ?? "-"}</Text>
            <Text style={s.notasTd}>{participante.asistencia_pct ? `${participante.asistencia_pct}%` : "-"}</Text>
            <Text style={s.notasTd}>{participante.nro_registro || "-"}</Text>
            <View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingVertical: 4 }}>
              <Text style={participante.estado === "APROBADO" ? s.estadoAprobado : s.estadoReprobado}>
                {participante.estado}
              </Text>
            </View>
          </View>
        </View>

        {/* Equipo (Puente Grua) */}
        {tipo === "PUENTE_GRUA" && (
          <>
            <Text style={s.sectionTitle}>DATOS DEL EQUIPO</Text>
            <View style={s.tableContainer}>
              <InfoRow label1="Marca" value1={participante.marca_equipo || "-"} label2="Modelo" value2={participante.modelo_equipo || "-"} />
              <InfoRow label1="Capacidad" value1={participante.capacidad_equipo || "-"} label2="Senales" value2={participante.senales || "-"} />
            </View>
          </>
        )}

        {/* Fotos Probetas (Soldadura) */}
        {tipo === "SOLDADURA" && (certificado.foto_probeta_1 || certificado.foto_probeta_2) && (
          <>
            <Text style={s.sectionTitle}>FOTOS DE PROBETAS</Text>
            <View style={s.fotosContainer}>
              {certificado.foto_probeta_1 && (
                <View style={s.fotoBox}><Image style={s.fotoImg} src={certificado.foto_probeta_1} /></View>
              )}
              {certificado.foto_probeta_2 && (
                <View style={s.fotoBox}><Image style={s.fotoImg} src={certificado.foto_probeta_2} /></View>
              )}
            </View>
          </>
        )}

        {/* Fechas */}
        <View style={s.fechasRow}>
          <View style={{ flexDirection: "row", gap: 4 }}>
            <Text style={s.fechaLabel}>Fecha de Emision:</Text>
            <Text style={s.fechaValue}>{fechaEmision}</Text>
          </View>
          <View style={{ flexDirection: "row", gap: 4 }}>
            <Text style={s.fechaLabel}>Fecha de Vencimiento:</Text>
            <Text style={s.fechaValue}>{fechaVencimiento}</Text>
          </View>
        </View>

        {/* Legal */}
        <Text style={s.legal}>
          Yo, Alexander Quijada, Gerente General de OTEC Capacitaciones Q&C Spa, Rut 77.520.118-5, certifico que los datos consignados en este documento son fidedignos.
        </Text>

        {/* Footer */}
        <View style={s.footer}>
          <View style={s.footerQr}>
            <Image src={qrDataUrl} style={{ width: 90, height: 90 }} />
          </View>
          <View style={s.footerFirma}>
            <View style={s.firmaLine} />
            <Text style={s.firmaName}>Alexander Quijada</Text>
            <Text style={s.firmaTitle}>Gerente General</Text>
            <Text style={s.firmaTitle}>OTEC Capacitaciones Q&C Spa</Text>
          </View>
          <Text style={s.footerLogo}>FORMACAP</Text>
        </View>

        {/* Page footer */}
        <Text style={s.pageFooter}>
          Empresa certificada por NCH 2728:2015 por el organismo ICONTEC — Reconocida por SENCE, bajo Resolucion 2872 — www.formacap.cl — +56 9 73267783 — Pagina 1 de 1
        </Text>
      </Page>
    </Document>
  )
}
