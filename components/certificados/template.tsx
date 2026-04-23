import React from "react"
import { Document, Page, Text, View, Image, StyleSheet } from "@react-pdf/renderer"
import {
  EQUIPOS_GRUPO_1_KONECRANES,
  EQUIPOS_GRUPO_2_ABUS,
  EQUIPOS_GRUPO_3_VARIOS,
  EQUIPOS_GRUPO_4_INAMAR_VAPOR,
  type EquipoPuenteGrua,
} from "@/lib/equipos"

/* ── Constants ──────────────────────────────────────────────────────── */
const ORANGE = "#E8541A"
const BLACK = "#000000"
const GRAY_BG = "#D0D0D0"
const B = 0.5 // border width

const TIPO_LABELS: Record<string, string> = {
  COMPETENCIAS: "CERTIFICADO DE COMPETENCIAS",
  PUENTE_GRUA: "CERTIFICADO DE OPERADOR DE PUENTE GRÚA",
  RIGGER: "CERTIFICADO DE RIGGER",
  SOLDADURA: "CERTIFICADO DE SOLDADURA",
}

/* ── Styles ─────────────────────────────────────────────────────────── */
const s = StyleSheet.create({
  page: { paddingTop: 28, paddingBottom: 28, paddingHorizontal: 28, fontSize: 9, fontFamily: "Helvetica", color: BLACK },

  /* Header */
  headerTable: { flexDirection: "row", borderWidth: B, borderColor: BLACK },
  headerCol1: { width: "20%", alignItems: "center", justifyContent: "center", padding: 4, borderRightWidth: B, borderRightColor: BLACK },
  headerCol2: { width: "60%", borderRightWidth: B, borderRightColor: BLACK },
  headerCol2Top: { padding: 5, alignItems: "center", justifyContent: "center" },
  headerCol2Bot: { borderTopWidth: B, borderTopColor: BLACK, padding: 5, alignItems: "center", justifyContent: "center" },
  headerCol3: { width: "20%", justifyContent: "center", padding: 6, gap: 2 },
  headerLogo: { width: 78 },
  headerSgc: { fontFamily: "Helvetica-Bold", fontSize: 10, textAlign: "center" },
  headerCertTitle: { fontFamily: "Helvetica-Bold", fontSize: 10, textAlign: "center", color: ORANGE },
  headerMeta: { fontFamily: "Helvetica-Bold", fontSize: 8, textAlign: "right" },

  /* Section titles */
  sectionBold: { fontFamily: "Helvetica-Bold", fontSize: 9, marginTop: 6, marginBottom: 2 },
  sectionNormal: { fontSize: 9, marginTop: 6, marginBottom: 2 },

  /* Info table */
  infoTable: { borderWidth: B, borderColor: BLACK, marginBottom: 3 },
  infoRow: { flexDirection: "row", borderBottomWidth: B, borderBottomColor: BLACK },
  infoRowLast: { flexDirection: "row" },
  infoLabel: { width: "30%", padding: 3, fontFamily: "Helvetica-Bold", fontSize: 9, borderRightWidth: B, borderRightColor: BLACK },
  infoValue: { width: "70%", padding: 3, fontSize: 9 },

  /* Notes table */
  notesTable: { borderWidth: B, borderColor: BLACK, marginBottom: 4 },
  notesHRow: { flexDirection: "row", backgroundColor: GRAY_BG },
  notesSRow: { flexDirection: "row", backgroundColor: GRAY_BG, borderTopWidth: B, borderTopColor: BLACK },
  notesDRow: { flexDirection: "row" },
  notesTh: { padding: 3, fontFamily: "Helvetica-Bold", fontSize: 8, textAlign: "center", borderRightWidth: B, borderRightColor: BLACK },
  notesTd: { padding: 3, fontSize: 9, textAlign: "center", borderRightWidth: B, borderRightColor: BLACK },

  /* Equipo tables */
  equipoGroupTitle: { fontFamily: "Helvetica-Bold", fontSize: 8, marginTop: 4, marginBottom: 1 },
  equipoTable: { borderWidth: B, borderColor: BLACK, marginBottom: 3 },
  equipoRow: { flexDirection: "row", borderBottomWidth: B, borderBottomColor: BLACK },
  equipoRowLast: { flexDirection: "row" },
  equipoLabelCell: { padding: 2, fontSize: 6, fontFamily: "Helvetica-Bold", backgroundColor: GRAY_BG, textAlign: "center", borderRightWidth: B, borderRightColor: BLACK },
  equipoDataCell: { padding: 2, fontSize: 6, textAlign: "center", borderRightWidth: B, borderRightColor: BLACK },

  /* Dates */
  fechasTable: { borderWidth: B, borderColor: BLACK, marginTop: 6, marginBottom: 4 },

  /* Soldadura */
  fotosBox: { borderWidth: B, borderColor: BLACK, flexDirection: "row", justifyContent: "space-around", padding: 4, marginBottom: 4, gap: 6 },
  fotoImg: { width: "46%", height: 160 },
  obsBox: { borderWidth: B, borderColor: BLACK, padding: 6, marginBottom: 4, height: 60 },

  /* Footer */
  legalText: { fontFamily: "Helvetica-Bold", fontSize: 7, marginTop: 6, marginBottom: 6, lineHeight: 1.5 },
  footerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end", marginTop: 4, marginBottom: 4 },
  footerLeft: { alignItems: "center", width: "28%" },
  footerCenter: { alignItems: "center", width: "38%" },
  footerRight: { alignItems: "center", width: "28%" },
  qrLabel: { fontSize: 7, marginBottom: 4, textAlign: "center" },
  qrImg: { width: 70, height: 70 },
  firmaImg: { width: 110, height: 46 },
  firmaLine: { width: "90%", borderTopWidth: 1, borderTopColor: BLACK, marginVertical: 3 },
  firmaName: { fontFamily: "Helvetica-Bold", fontSize: 9 },
  firmaTitle: { fontSize: 8, textAlign: "center" },
  footerOrgLabel: { fontFamily: "Helvetica-Bold", fontSize: 10, marginBottom: 4, textAlign: "center" },
  footerLogoImg: { width: 68 },
  pageFooter: { fontSize: 7, textAlign: "center", marginTop: 4, lineHeight: 1.5 },
})

/* ── Helpers ────────────────────────────────────────────────────────── */
function InfoRow({ label, value, last }: { label: string; value: string; last?: boolean }) {
  return (
    <View style={last ? s.infoRowLast : s.infoRow}>
      <Text style={s.infoLabel}>{label}</Text>
      <Text style={s.infoValue}>{value}</Text>
    </View>
  )
}

/* Double-header notes table.
   COMPETENCIAS / SOLDADURA (no señales): 5 cols → notas spans 2
   RIGGER / PUENTE_GRUA (con señales):   6 cols → notas spans 3        */
function NotesTable({ p, senales }: { p: any; senales: boolean }) {
  const sub = senales ? 3 : 2  // cols under NOTAS
  const total = sub + 3        // + ASISTENCIA + N°REG + ESTADO
  const pct = (n: number) => `${((n / total) * 100).toFixed(2)}%`
  const notasW = pct(sub)
  const singleW = pct(1)
  const thL = { ...s.notesTh, borderRightWidth: 0 } // last in row → no right border
  const tdL = { ...s.notesTd, borderRightWidth: 0, fontFamily: "Helvetica-Bold" }

  return (
    <View style={s.notesTable}>
      {/* Row 1 — group headers */}
      <View style={s.notesHRow}>
        <Text style={{ ...s.notesTh, width: notasW }}>NOTAS</Text>
        <Text style={{ ...s.notesTh, width: singleW }}>ASISTENCIA</Text>
        <Text style={{ ...s.notesTh, width: singleW }}>N° REGISTRO</Text>
        <Text style={{ ...thL, width: singleW }}>ESTADO</Text>
      </View>
      {/* Row 2 — sub-headers */}
      <View style={s.notesSRow}>
        <Text style={{ ...s.notesTh, width: singleW }}>TEORÍA</Text>
        {senales && <Text style={{ ...s.notesTh, width: singleW }}>SEÑALES</Text>}
        <Text style={{ ...s.notesTh, width: singleW }}>PRÁCTICA</Text>
        {/* empty cells preserve column borders */}
        <Text style={{ ...s.notesTh, width: singleW }}> </Text>
        <Text style={{ ...s.notesTh, width: singleW }}> </Text>
        <Text style={{ ...thL, width: singleW }}> </Text>
      </View>
      {/* Row 3 — data */}
      <View style={s.notesDRow}>
        <Text style={{ ...s.notesTd, width: singleW }}>{p.nota_teoria ?? "-"}</Text>
        {senales && <Text style={{ ...s.notesTd, width: singleW }}>{p.senales ?? "-"}</Text>}
        <Text style={{ ...s.notesTd, width: singleW }}>{p.nota_practica ?? "-"}</Text>
        <Text style={{ ...s.notesTd, width: singleW }}>
          {p.asistencia_pct != null ? `${p.asistencia_pct}%` : "-"}
        </Text>
        <Text style={{ ...s.notesTd, width: singleW }}>{p.nro_registro || "-"}</Text>
        <Text style={{ ...tdL, width: singleW }}>{p.estado}</Text>
      </View>
    </View>
  )
}

/* Equipo group: label-first rows (MARCA | v1 | v2 | ...), no highlighting */
function EquipoGroupTable({ title, equipos }: { title: string; equipos: EquipoPuenteGrua[] }) {
  const n = equipos.length
  // label col = 15%, remaining split among n data cols
  const labelW = "15%"
  const dataW = `${(85 / n).toFixed(2)}%`

  const rows: Array<{ label: string; field: keyof EquipoPuenteGrua }> = [
    { label: "MARCA", field: "marca" },
    { label: "MODELO", field: "modelo" },
    { label: "CAPACIDAD", field: "capacidad" },
  ]

  return (
    <View>
      <Text style={s.equipoGroupTitle}>{title}</Text>
      <View style={s.equipoTable}>
        {rows.map(({ label, field }, ri) => (
          <View key={ri} style={ri < 2 ? s.equipoRow : s.equipoRowLast}>
            <Text style={{ ...s.equipoLabelCell, width: labelW }}>{label}</Text>
            {equipos.map((eq, ci) => (
              <Text
                key={ci}
                style={{
                  ...s.equipoDataCell,
                  width: dataW,
                  borderRightWidth: ci === n - 1 ? 0 : B,
                }}
              >
                {eq[field]}
              </Text>
            ))}
          </View>
        ))}
      </View>
    </View>
  )
}

/* ── Main export ─────────────────────────────────────────────────────── */
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
  const showEquipos = tipo === "PUENTE_GRUA"
  const isSoldadura = tipo === "SOLDADURA"
  const showVencimiento = tipo !== "COMPETENCIAS"

  // TODO: reemplazar con logo real de Formacap (PNG transparente)
  const logoSrc = `${process.cwd()}/public/logo-formacap.png`
  // TODO: reemplazar con firma real de Alexander Quijada (PNG transparente)
  const firmaSrc = `${process.cwd()}/public/firma-formacap.png`

  const paginaLabel = tipo === "PUENTE_GRUA" ? "Página 1 de 2" : "Página 1 de 1"

  return (
    <Document>
      <Page size="A4" style={s.page}>

        {/* ── HEADER TABLE ─────────────────────────────────────────── */}
        <View style={s.headerTable}>
          {/* Col 1: logo */}
          <View style={s.headerCol1}>
            <Image src={logoSrc} style={s.headerLogo} />
          </View>

          {/* Col 2: SGC title (top) + cert title in orange (bottom) */}
          <View style={s.headerCol2}>
            <View style={s.headerCol2Top}>
              <Text style={s.headerSgc}>Sistema de Gestión de la Calidad</Text>
            </View>
            <View style={s.headerCol2Bot}>
              <Text style={s.headerCertTitle}>{TIPO_LABELS[tipo] ?? tipo}</Text>
            </View>
          </View>

          {/* Col 3: version meta (all bold) */}
          <View style={s.headerCol3}>
            <Text style={s.headerMeta}>Versión: 3</Text>
            <Text style={s.headerMeta}>RES. SENCE 2872</Text>
            <Text style={s.headerMeta}>{paginaLabel}</Text>
          </View>
        </View>

        {/* ── INFORMACIÓN EMPRESA PARTICIPANTE ─────────────────────── */}
        <Text style={s.sectionBold}>INFORMACIÓN EMPRESA PARTICIPANTE</Text>
        <View style={s.infoTable}>
          <InfoRow label="NOMBRE:" value={actividad.empresa_nombre} />
          <InfoRow label="RUT:" value={actividad.empresa_rut} last />
        </View>

        {/* ── INFORMACIÓN DE CURSO ─────────────────────────────────── */}
        <Text style={s.sectionNormal}>INFORMACIÓN DE CURSO</Text>
        <View style={s.infoTable}>
          <InfoRow label="NOMBRE:" value={actividad.nombre_curso} />
          <InfoRow label="FECHA INICIO:" value={fechaInicio} />
          <InfoRow label="FECHA TÉRMINO:" value={fechaTermino} />
          <InfoRow label="LUGAR:" value={actividad.lugar} />
          <InfoRow label="INSTRUCTOR:" value={actividad.instructor} last />
        </View>

        {/* ── INFORMACIÓN PARTICIPANTE ─────────────────────────────── */}
        <Text style={s.sectionNormal}>INFORMACIÓN PARTICIPANTE</Text>
        <View style={s.infoTable}>
          <InfoRow label="NOMBRE:" value={participante.nombre} />
          <InfoRow label="RUT:" value={participante.rut} last />
        </View>

        {/* ── SOLDADURA: INFORMACIÓN DE PROBETAS ───────────────────── */}
        {isSoldadura && (
          <>
            <Text style={s.sectionNormal}>INFORMACIÓN DE PROBETAS</Text>
            <View style={s.infoTable}>
              <InfoRow label="ESPESOR/DIÁMETRO DE TUBERÍA:" value={participante.espesor_diametro || "-"} />
              <InfoRow label="APLICACIÓN DE SOLDADURA:" value={participante.aplicacion_soldadura || "-"} last />
            </View>
          </>
        )}

        {/* ── SOLDADURA: FOTOS DE PROBETAS ─────────────────────────── */}
        {isSoldadura && (certificado.foto_probeta_1 || certificado.foto_probeta_2) && (
          <>
            <Text style={s.sectionNormal}>FOTOS DE PROBETAS</Text>
            <View style={s.fotosBox}>
              {certificado.foto_probeta_1 && (
                <Image src={certificado.foto_probeta_1} style={s.fotoImg} />
              )}
              {certificado.foto_probeta_2 && (
                <Image src={certificado.foto_probeta_2} style={s.fotoImg} />
              )}
            </View>
          </>
        )}

        {/* ── SOLDADURA: OBSERVACIONES (fixed-height, always shown) ── */}
        {isSoldadura && (
          <>
            <Text style={s.sectionBold}>OBSERVACIONES</Text>
            <View style={s.obsBox}>
              {participante.observaciones ? (
                <Text style={{ fontSize: 9 }}>{participante.observaciones}</Text>
              ) : null}
            </View>
          </>
        )}

        {/* ── TABLA DE NOTAS ───────────────────────────────────────── */}
        <NotesTable p={participante} senales={showSenales} />

        {/* ── EQUIPOS PUENTE GRÚA ──────────────────────────────────── */}
        {showEquipos && (
          <View>
            <Text style={s.sectionBold}>EQUIPOS PUENTE GRÚA</Text>
            <EquipoGroupTable title="KONECRANES" equipos={EQUIPOS_GRUPO_1_KONECRANES} />
            <EquipoGroupTable title="ABUS" equipos={EQUIPOS_GRUPO_2_ABUS} />
            <EquipoGroupTable title="R&M / INAMAR / TBM / WORLDHOIST / INAMAR-VAPOR" equipos={EQUIPOS_GRUPO_3_VARIOS} />
            <EquipoGroupTable title="INAMAR/VAPOR" equipos={EQUIPOS_GRUPO_4_INAMAR_VAPOR} />
          </View>
        )}

        {/* ── FECHAS ───────────────────────────────────────────────── */}
        <View style={s.fechasTable}>
          <InfoRow label="FECHA DE EMISIÓN:" value={fechaEmision} last={!showVencimiento} />
          {showVencimiento && (
            <InfoRow label="FECHA DE VENCIMIENTO:" value={fechaVencimiento || "N/A"} last />
          )}
        </View>

        {/* ── LEGAL TEXT (bold) ─────────────────────────────────────── */}
        <Text style={s.legalText}>
          Yo, Alexander Quijada, Gerente General de OTEC Capacitaciones Q&C Spa,
          Rut 77.520.118-5, certifico que los datos consignados en este documento son fidedignos.
        </Text>

        {/* ── FOOTER 3 COLUMNS ─────────────────────────────────────── */}
        <View style={s.footerRow}>
          {/* Left: label then QR */}
          <View style={s.footerLeft}>
            <Text style={s.qrLabel}>Consulta tu certificado:</Text>
            <Image src={qrDataUrl} style={s.qrImg} />
          </View>

          {/* Center: firma + line + name + title */}
          <View style={s.footerCenter}>
            <Image src={firmaSrc} style={s.firmaImg} />
            <View style={s.firmaLine} />
            <Text style={s.firmaName}>Alexander Quijada</Text>
            <Text style={s.firmaTitle}>Gerente General</Text>
          </View>

          {/* Right: label then logo */}
          <View style={s.footerRight}>
            <Text style={s.footerOrgLabel}>ORGANISMO TÉCNICO</Text>
            <Image src={logoSrc} style={s.footerLogoImg} />
          </View>
        </View>

        {/* ── PAGE FOOTER ──────────────────────────────────────────── */}
        <Text style={s.pageFooter}>
          {"Empresa certificada por NCH 2728:2015 por el organismo ICONTEC\n"}
          {"Reconocida por SENCE, bajo Resolución 2872\n"}
          {"Página web www.formacap.cl; teléfono de contacto +56 9 73267783"}
        </Text>

      </Page>
    </Document>
  )
}
