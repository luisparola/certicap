import React from "react"
import { Document, Page, Text, View, Image, StyleSheet } from "@react-pdf/renderer"
import {
  EQUIPOS_GRUPO_1_KONECRANES,
  EQUIPOS_GRUPO_2_ABUS,
  EQUIPOS_GRUPO_3_VARIOS,
  EQUIPOS_GRUPO_4_INAMAR_VAPOR,
  type EquipoPuenteGrua,
} from "@/lib/equipos"

/* ===== CONSTANTS ===== */
const ORANGE = "#E8541A"
const BLACK = "#000000"
const GRAY_BG = "#CCCCCC"
const WHITE = "#FFFFFF"
const BORDER = 0.5

/* ===== STYLES ===== */
const s = StyleSheet.create({
  page: { paddingTop: 30, paddingBottom: 30, paddingHorizontal: 30, fontSize: 9, fontFamily: "Helvetica", color: BLACK },
  /* Header 3-col table */
  headerTable: { flexDirection: "row", borderWidth: BORDER, borderColor: BLACK },
  headerCol1: { width: "20%", alignItems: "center", justifyContent: "center", padding: 4, borderRightWidth: BORDER, borderRightColor: BLACK },
  headerCol2: { width: "55%", alignItems: "center", justifyContent: "center", padding: 4, borderRightWidth: BORDER, borderRightColor: BLACK },
  headerCol3: { width: "25%", justifyContent: "center", padding: 4 },
  headerLogo: { width: 80, height: "auto" },
  headerTitle: { fontFamily: "Helvetica-Bold", fontSize: 10, textAlign: "center" },
  headerMeta: { fontSize: 8, textAlign: "right" },
  /* Orange bar */
  orangeBar: { backgroundColor: ORANGE, paddingVertical: 5, marginTop: 2 },
  orangeBarText: { color: ORANGE, fontFamily: "Helvetica-Bold", fontSize: 11, textAlign: "center" },
  /* Section title */
  sectionTitle: { fontFamily: "Helvetica-Bold", fontSize: 10, marginTop: 8, marginBottom: 3, textTransform: "uppercase" },
  /* 2-col info table */
  infoTable: { borderWidth: BORDER, borderColor: BLACK, marginBottom: 4 },
  infoRow: { flexDirection: "row", borderBottomWidth: BORDER, borderBottomColor: BLACK },
  infoLabel: { width: "30%", padding: 3, fontFamily: "Helvetica-Bold", fontSize: 9, borderRightWidth: BORDER, borderRightColor: BLACK },
  infoValue: { width: "70%", padding: 3, fontSize: 9 },
  /* Notes table */
  notesHeaderRow: { flexDirection: "row", backgroundColor: GRAY_BG },
  notesTh: { flex: 1, padding: 3, fontFamily: "Helvetica-Bold", fontSize: 8, textAlign: "center", borderRightWidth: BORDER, borderRightColor: BLACK, borderBottomWidth: BORDER, borderBottomColor: BLACK },
  notesRow: { flexDirection: "row" },
  notesTd: { flex: 1, padding: 3, fontSize: 9, textAlign: "center", borderRightWidth: BORDER, borderRightColor: BLACK, borderBottomWidth: BORDER, borderBottomColor: BLACK },
  notesTable: { borderWidth: BORDER, borderColor: BLACK, marginBottom: 4 },
  /* Equipos mini table */
  equipoGroupTitle: { fontFamily: "Helvetica-Bold", fontSize: 8, marginTop: 4, marginBottom: 1 },
  equipoTable: { borderWidth: BORDER, borderColor: BLACK, marginBottom: 3 },
  equipoHeaderRow: { flexDirection: "row", backgroundColor: GRAY_BG },
  equipoRow: { flexDirection: "row" },
  equipoRowHighlight: { flexDirection: "row", backgroundColor: ORANGE },
  equipoCell: { padding: 2, fontSize: 6, textAlign: "center", borderRightWidth: BORDER, borderRightColor: BLACK, borderBottomWidth: BORDER, borderBottomColor: BLACK },
  equipoCellHighlight: { padding: 2, fontSize: 6, textAlign: "center", borderRightWidth: BORDER, borderRightColor: BLACK, borderBottomWidth: BORDER, borderBottomColor: BLACK, color: WHITE },
  equipoHeaderCell: { padding: 2, fontSize: 6, fontFamily: "Helvetica-Bold", textAlign: "center", borderRightWidth: BORDER, borderRightColor: BLACK, borderBottomWidth: BORDER, borderBottomColor: BLACK },
  /* Dates */
  fechasTable: { borderWidth: BORDER, borderColor: BLACK, marginTop: 6, marginBottom: 4 },
  /* Footer */
  legalText: { fontSize: 7, marginTop: 6, marginBottom: 6, lineHeight: 1.4 },
  footerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end", marginTop: 4, marginBottom: 6 },
  footerLeft: { alignItems: "center", width: "25%" },
  footerCenter: { alignItems: "center", width: "40%" },
  footerRight: { alignItems: "center", width: "25%" },
  qrImage: { width: 70, height: 70 },
  qrLabel: { fontSize: 7, marginTop: 2, textAlign: "center" },
  firmaImage: { width: 120, height: 50 },
  firmaName: { fontFamily: "Helvetica-Bold", fontSize: 9, marginTop: 2 },
  firmaTitle: { fontSize: 8, textAlign: "center" },
  footerLogoImg: { width: 70, height: "auto" },
  footerLogoLabel: { fontSize: 7, fontFamily: "Helvetica-Bold", marginTop: 2, textAlign: "center" },
  pageFooter: { fontSize: 7, textAlign: "center", marginTop: 4, lineHeight: 1.4 },
  /* Soldadura fotos */
  fotosRow: { flexDirection: "row", justifyContent: "center", gap: 8, marginVertical: 4 },
  fotoImg: { width: "48%", height: 160 },
  /* Observaciones */
  obsBox: { borderWidth: BORDER, borderColor: BLACK, padding: 6, marginBottom: 4, minHeight: 30 },
  obsText: { fontSize: 9 },
})

/* ===== HELPER: Remove last border-bottom on last info row ===== */
function InfoRow({ label, value, isLast }: { label: string; value: string; isLast?: boolean }) {
  const rowStyle = isLast ? { ...s.infoRow, borderBottomWidth: 0 } : s.infoRow
  return (
    <View style={rowStyle}>
      <Text style={s.infoLabel}>{label}</Text>
      <Text style={s.infoValue}>{value}</Text>
    </View>
  )
}

/* ===== EQUIPO GROUP TABLE (horizontal columns per equipo) ===== */
function EquipoGroupTable({
  title,
  equipos,
  selectedMarca,
  selectedModelo,
  selectedCapacidad,
}: {
  title: string
  equipos: EquipoPuenteGrua[]
  selectedMarca: string
  selectedModelo: string
  selectedCapacidad: string
}) {
  const colCount = equipos.length
  const colWidth = `${(100 / colCount).toFixed(2)}%`

  function isMatch(eq: EquipoPuenteGrua) {
    return (
      eq.marca.toUpperCase() === selectedMarca.toUpperCase() &&
      eq.modelo.toUpperCase() === selectedModelo.toUpperCase() &&
      eq.capacidad.toUpperCase() === selectedCapacidad.toUpperCase()
    )
  }

  const hasHighlight = equipos.some(isMatch)

  return (
    <View>
      <Text style={s.equipoGroupTitle}>{title}</Text>
      <View style={s.equipoTable}>
        {/* MARCA row */}
        <View style={s.equipoHeaderRow}>
          {equipos.map((eq, i) => (
            <Text key={`m${i}`} style={{ ...s.equipoHeaderCell, width: colWidth }}>
              {eq.marca}
            </Text>
          ))}
        </View>
        {/* MODELO row */}
        <View style={hasHighlight ? s.equipoRow : s.equipoRow}>
          {equipos.map((eq, i) => {
            const hl = isMatch(eq)
            return (
              <Text
                key={`mo${i}`}
                style={{
                  ...(hl ? s.equipoCellHighlight : s.equipoCell),
                  width: colWidth,
                  backgroundColor: hl ? ORANGE : undefined,
                }}
              >
                {eq.modelo}
              </Text>
            )
          })}
        </View>
        {/* CAPACIDAD row */}
        <View style={s.equipoRow}>
          {equipos.map((eq, i) => {
            const hl = isMatch(eq)
            return (
              <Text
                key={`c${i}`}
                style={{
                  ...(hl ? s.equipoCellHighlight : s.equipoCell),
                  width: colWidth,
                  backgroundColor: hl ? ORANGE : undefined,
                  borderBottomWidth: 0,
                }}
              >
                {eq.capacidad}
              </Text>
            )
          })}
        </View>
      </View>
    </View>
  )
}

/* ===== MAIN EXPORT ===== */
export function CertificadoDocument(data: {
  tipo: string
  participante: any
  actividad: any
  certificado: any
  qrDataUrl: string
}) {
  const { tipo, participante, actividad, certificado, qrDataUrl } = data

  const fechaEmision = new Date(certificado.fecha_emision).toLocaleDateString("es-CL")
  const fechaVencimiento = certificado.fecha_vencimiento
    ? new Date(certificado.fecha_vencimiento).toLocaleDateString("es-CL")
    : null
  const fechaInicio = new Date(actividad.fecha_inicio).toLocaleDateString("es-CL")
  const fechaTermino = new Date(actividad.fecha_termino).toLocaleDateString("es-CL")

  const showSenales = tipo === "RIGGER" || tipo === "PUENTE_GRUA"
  const showEquiposTable = tipo === "PUENTE_GRUA"
  const showSoldadura = tipo === "SOLDADURA"
  const showVencimiento = tipo === "RIGGER" || tipo === "PUENTE_GRUA" || tipo === "SOLDADURA"

  const selectedMarca = participante.marca_equipo || ""
  const selectedModelo = participante.modelo_equipo || ""
  const selectedCapacidad = participante.capacidad_equipo || ""

  // Use process.cwd() paths for server-side images
  const logoSrc = `${process.cwd()}/public/logo-formacap.png`
  const firmaSrc = `${process.cwd()}/public/firma-formacap.png`

  return (
    <Document>
      <Page size="A4" style={s.page}>
        {/* ===== HEADER TABLE ===== */}
        <View style={s.headerTable}>
          <View style={s.headerCol1}>
            <Image src={logoSrc} style={s.headerLogo} />
          </View>
          <View style={s.headerCol2}>
            <Text style={s.headerTitle}>Sistema de Gestión de la Calidad</Text>
          </View>
          <View style={s.headerCol3}>
            <Text style={s.headerMeta}>Versión: 3</Text>
            <Text style={s.headerMeta}>RES. SENCE 2872</Text>
            <Text style={s.headerMeta}>Página 1 de 1</Text>
          </View>
        </View>

        {/* ===== ORANGE BAR ===== */}
        <View style={s.orangeBar}>
          <Text style={{ ...s.orangeBarText, color: WHITE }}>CERTIFICADO DE COMPETENCIAS</Text>
        </View>

        {/* ===== INFORMACIÓN EMPRESA PARTICIPANTE ===== */}
        <Text style={s.sectionTitle}>Información Empresa Participante</Text>
        <View style={s.infoTable}>
          <InfoRow label="NOMBRE:" value={actividad.empresa_nombre} />
          <InfoRow label="RUT:" value={actividad.empresa_rut} isLast />
        </View>

        {/* ===== INFORMACIÓN DE CURSO ===== */}
        <Text style={s.sectionTitle}>Información de Curso</Text>
        <View style={s.infoTable}>
          <InfoRow label="NOMBRE:" value={actividad.nombre_curso} />
          <InfoRow label="FECHA INICIO:" value={fechaInicio} />
          <InfoRow label="FECHA TÉRMINO:" value={fechaTermino} />
          <InfoRow label="LUGAR:" value={actividad.lugar} />
          <InfoRow label="INSTRUCTOR:" value={actividad.instructor} isLast />
        </View>

        {/* ===== INFORMACIÓN PARTICIPANTE ===== */}
        <Text style={s.sectionTitle}>Información Participante</Text>
        <View style={s.infoTable}>
          <InfoRow label="NOMBRE:" value={participante.nombre} />
          <InfoRow label="RUT:" value={participante.rut} isLast />
        </View>

        {/* ===== TABLA DE NOTAS ===== */}
        <View style={s.notesTable}>
          <View style={s.notesHeaderRow}>
            <Text style={s.notesTh}>TEORÍA</Text>
            {showSenales && <Text style={s.notesTh}>SEÑALES</Text>}
            <Text style={s.notesTh}>PRÁCTICA</Text>
            <Text style={s.notesTh}>ASISTENCIA</Text>
            <Text style={s.notesTh}>N° REGISTRO</Text>
            <Text style={{ ...s.notesTh, borderRightWidth: 0 }}>ESTADO</Text>
          </View>
          <View style={s.notesRow}>
            <Text style={s.notesTd}>{participante.nota_teoria ?? "-"}</Text>
            {showSenales && <Text style={s.notesTd}>{participante.senales ?? "-"}</Text>}
            <Text style={s.notesTd}>{participante.nota_practica ?? "-"}</Text>
            <Text style={s.notesTd}>
              {participante.asistencia_pct != null ? `${participante.asistencia_pct}%` : "-"}
            </Text>
            <Text style={s.notesTd}>{participante.nro_registro || "-"}</Text>
            <Text style={{ ...s.notesTd, borderRightWidth: 0, fontFamily: "Helvetica-Bold" }}>
              {participante.estado}
            </Text>
          </View>
        </View>

        {/* ===== EQUIPOS PUENTE GRÚA ===== */}
        {showEquiposTable && (
          <View>
            <Text style={s.sectionTitle}>Equipos Puente Grúa</Text>
            <EquipoGroupTable
              title="KONECRANES"
              equipos={EQUIPOS_GRUPO_1_KONECRANES}
              selectedMarca={selectedMarca}
              selectedModelo={selectedModelo}
              selectedCapacidad={selectedCapacidad}
            />
            <EquipoGroupTable
              title="ABUS"
              equipos={EQUIPOS_GRUPO_2_ABUS}
              selectedMarca={selectedMarca}
              selectedModelo={selectedModelo}
              selectedCapacidad={selectedCapacidad}
            />
            <EquipoGroupTable
              title="R&M / INAMAR / TBM / WORLDHOIST / INAMAR-VAPOR"
              equipos={EQUIPOS_GRUPO_3_VARIOS}
              selectedMarca={selectedMarca}
              selectedModelo={selectedModelo}
              selectedCapacidad={selectedCapacidad}
            />
            <EquipoGroupTable
              title="INAMAR/VAPOR"
              equipos={EQUIPOS_GRUPO_4_INAMAR_VAPOR}
              selectedMarca={selectedMarca}
              selectedModelo={selectedModelo}
              selectedCapacidad={selectedCapacidad}
            />
          </View>
        )}

        {/* ===== SOLDADURA: INFO PROBETAS ===== */}
        {showSoldadura && (
          <View>
            <Text style={s.sectionTitle}>Información de Probetas</Text>
            <View style={s.infoTable}>
              <InfoRow label="ESPESOR/DIÁMETRO DE TUBERÍA:" value={participante.espesor_diametro || "-"} />
              <InfoRow label="APLICACIÓN DE SOLDADURA:" value={participante.aplicacion_soldadura || "-"} isLast />
            </View>
          </View>
        )}

        {/* ===== SOLDADURA: FOTOS PROBETAS ===== */}
        {showSoldadura && (certificado.foto_probeta_1 || certificado.foto_probeta_2) && (
          <View>
            <Text style={s.sectionTitle}>Fotos de Probetas</Text>
            <View style={s.fotosRow}>
              {certificado.foto_probeta_1 && (
                <Image src={certificado.foto_probeta_1} style={s.fotoImg} />
              )}
              {certificado.foto_probeta_2 && (
                <Image src={certificado.foto_probeta_2} style={s.fotoImg} />
              )}
            </View>
          </View>
        )}

        {/* ===== SOLDADURA: OBSERVACIONES ===== */}
        {showSoldadura && participante.observaciones && (
          <View>
            <Text style={s.sectionTitle}>Observaciones</Text>
            <View style={s.obsBox}>
              <Text style={s.obsText}>{participante.observaciones}</Text>
            </View>
          </View>
        )}

        {/* ===== FECHAS ===== */}
        <View style={s.fechasTable}>
          <InfoRow label="FECHA DE EMISIÓN:" value={fechaEmision} isLast={!showVencimiento} />
          {showVencimiento && (
            <InfoRow label="FECHA DE VENCIMIENTO:" value={fechaVencimiento || "N/A"} isLast />
          )}
        </View>

        {/* ===== LEGAL TEXT ===== */}
        <Text style={s.legalText}>
          Yo, Alexander Quijada, Gerente General de OTEC Capacitaciones Q&C Spa, Rut 77.520.118-5, certifico que los datos consignados en este documento son fidedignos.
        </Text>

        {/* ===== FOOTER 3 COLUMNS ===== */}
        <View style={s.footerRow}>
          {/* Left: QR */}
          <View style={s.footerLeft}>
            <Image src={qrDataUrl} style={s.qrImage} />
            <Text style={s.qrLabel}>Consulta tu certificado:</Text>
          </View>
          {/* Center: Firma */}
          <View style={s.footerCenter}>
            <Image src={firmaSrc} style={s.firmaImage} />
            <Text style={s.firmaName}>Alexander Quijada</Text>
            <Text style={s.firmaTitle}>Gerente General</Text>
          </View>
          {/* Right: Logo */}
          <View style={s.footerRight}>
            <Image src={logoSrc} style={s.footerLogoImg} />
            <Text style={s.footerLogoLabel}>ORGANISMO TÉCNICO</Text>
          </View>
        </View>

        {/* ===== PAGE FOOTER ===== */}
        <Text style={s.pageFooter}>
          Empresa certificada por NCH 2728:2015 por el organismo ICONTEC
        </Text>
        <Text style={s.pageFooter}>
          Reconocida por SENCE, bajo Resolución 2872
        </Text>
        <Text style={s.pageFooter}>
          Página web www.formacap.cl; teléfono de contacto +56 9 73267783
        </Text>
      </Page>
    </Document>
  )
}
