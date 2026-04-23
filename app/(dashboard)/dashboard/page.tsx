"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
  PieChart, Pie,
} from "recharts"
import {
  BookOpen, Users, Award, Clock, ClipboardList,
  Star, TrendingUp, TrendingDown, Plus, Loader2,
} from "lucide-react"

// ── Constants ─────────────────────────────────────────────────────────────
const TIPO_LABELS: Record<string, string> = {
  COMPETENCIAS: "Competencias", PUENTE_GRUA: "Puente Grua",
  RIGGER: "Rigger", SOLDADURA: "Soldadura",
}
const TIPO_COLORS_BADGE: Record<string, string> = {
  COMPETENCIAS: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  PUENTE_GRUA: "bg-[#E8541A]/20 text-[#E8541A] border-[#E8541A]/30",
  RIGGER: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  SOLDADURA: "bg-purple-500/20 text-purple-400 border-purple-500/30",
}
const TIPO_CHART_COLORS: Record<string, string> = {
  COMPETENCIAS: "#3B82F6", PUENTE_GRUA: "#E8541A", RIGGER: "#10B981", SOLDADURA: "#8B5CF6",
}

const CHART_THEME = {
  axis: { tick: { fill: "#9CA3AF", fontSize: 11 }, axisLine: false, tickLine: false },
  grid: { stroke: "#1F2937", strokeDasharray: "3 3" },
  tooltip: { contentStyle: { background: "#111827", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, fontSize: 12 }, itemStyle: { color: "#E5E7EB" }, labelStyle: { color: "#9CA3AF" } },
}

// ── Sub-components ─────────────────────────────────────────────────────────
function Stars({ value, size = "sm" }: { value: number; size?: "sm" | "md" }) {
  const cls = size === "md" ? "h-5 w-5" : "h-3.5 w-3.5"
  return (
    <span className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star key={i} className={`${cls} ${i <= Math.round(value) ? "fill-amber-400 text-amber-400" : "text-gray-700"}`} />
      ))}
    </span>
  )
}

function KpiCard({ title, value, sub, icon: Icon, color, bg }: {
  title: string; value: string | number; sub?: string;
  icon: React.ElementType; color: string; bg: string
}) {
  return (
    <Card className="glass-card border-white/10 hover:border-white/20 transition-colors">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wider">{title}</p>
            <p className="text-3xl font-bold text-white mt-1">{value}</p>
            {sub && <p className="text-xs text-gray-500 mt-0.5">{sub}</p>}
          </div>
          <div className={`p-2.5 rounded-xl ${bg}`}>
            <Icon className={`h-5 w-5 ${color}`} />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function SatisfaccionBar({ nombre, promedio }: { nombre: string; promedio: number }) {
  const pct = (promedio / 5) * 100
  const barColor = promedio < 3 ? "bg-red-500" : promedio < 4 ? "bg-amber-400" : "bg-emerald-400"
  return (
    <div className="space-y-1">
      <div className="flex justify-between items-center text-sm">
        <span className="text-gray-300 truncate max-w-[70%]">{nombre}</span>
        <div className="flex items-center gap-1.5 shrink-0 ml-2">
          <Stars value={promedio} />
          <span className="text-white font-semibold text-xs w-6 text-right">{promedio.toFixed(1)}</span>
        </div>
      </div>
      <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
        <div className={`h-full ${barColor} rounded-full transition-all duration-500`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

function EncuestaBadge({ activa }: { activa: boolean | null }) {
  if (activa === null) return <Badge className="bg-gray-500/20 text-gray-500 text-xs">Sin encuesta</Badge>
  if (activa) return <Badge className="bg-emerald-500/20 text-emerald-400 text-xs">Activa</Badge>
  return <Badge className="bg-amber-500/20 text-amber-400 text-xs">Inactiva</Badge>
}

// ── Main page ──────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const { data: session } = useSession()
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/dashboard")
      .then((r) => r.json())
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-[#E8541A]" />
      </div>
    )
  }

  const kpis = data?.kpis ?? {}
  const certPorMes: { mes: string; cantidad: number }[] = data?.certificados_por_mes ?? []
  const porTipo: { tipo: string; cantidad: number }[] = data?.por_tipo ?? []
  const satisfPorAct: { nombre: string; promedio: number; total_respuestas: number }[] = data?.satisfaccion_por_actividad ?? []
  const actRecientes: any[] = data?.actividadesRecientes ?? []
  const satisfGen: number = data?.satisfaccion_general ?? 0
  const totalResp: number = data?.total_respuestas_encuestas ?? 0
  const mejorPregunta: { texto: string; promedio: number } | null = data?.mejor_pregunta ?? null
  const peorPregunta: { texto: string; promedio: number } | null = data?.peor_pregunta ?? null

  const encuestaKpi = `${totalResp} / ${kpis.totalParticipantes ?? 0}`

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <p className="text-gray-400 mt-1">Bienvenido, {session?.user?.name ?? "Administrador"}</p>
        </div>
        <Link href="/actividades/nueva">
          <Button className="bg-[#E8541A] hover:bg-[#E8541A]/90"><Plus className="h-4 w-4 mr-2" />Nueva Actividad</Button>
        </Link>
      </div>

      {/* Fila 1 — KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <KpiCard title="Actividades" value={kpis.totalActividades ?? 0} icon={BookOpen} color="text-blue-400" bg="bg-blue-500/10" />
        <KpiCard title="Participantes" value={kpis.totalParticipantes ?? 0} icon={Users} color="text-emerald-400" bg="bg-emerald-500/10" />
        <KpiCard title="Certificados" value={kpis.totalCertificados ?? 0} icon={Award} color="text-[#E8541A]" bg="bg-[#E8541A]/10" />
        <KpiCard title="Próx. a Vencer" value={kpis.certificadosProximosVencer ?? 0} sub="en 30 días" icon={Clock} color="text-amber-400" bg="bg-amber-500/10" />
        <KpiCard title="Encuestas" value={encuestaKpi} sub="respondidas / participantes" icon={ClipboardList} color="text-purple-400" bg="bg-purple-500/10" />
      </div>

      {/* Fila 2 — Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Bar chart */}
        <Card className="glass-card border-white/10 lg:col-span-3">
          <CardHeader><CardTitle className="text-base text-white">Certificados emitidos — últimos 6 meses</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={certPorMes} barSize={32}>
                <XAxis dataKey="mes" {...CHART_THEME.axis} />
                <YAxis allowDecimals={false} {...CHART_THEME.axis} />
                <Tooltip {...CHART_THEME.tooltip} />
                <Bar dataKey="cantidad" radius={[4, 4, 0, 0]}>
                  {certPorMes.map((_, i) => <Cell key={i} fill="#E8541A" fillOpacity={0.85} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Donut chart */}
        <Card className="glass-card border-white/10 lg:col-span-2">
          <CardHeader><CardTitle className="text-base text-white">Tipos de certificado</CardTitle></CardHeader>
          <CardContent>
            {porTipo.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={160}>
                  <PieChart>
                    <Pie data={porTipo} dataKey="cantidad" nameKey="tipo" innerRadius={45} outerRadius={75} paddingAngle={3}>
                      {porTipo.map((entry, i) => <Cell key={i} fill={TIPO_CHART_COLORS[entry.tipo] ?? "#6B7280"} />)}
                    </Pie>
                    <Tooltip formatter={(v: any, name: any) => [v, TIPO_LABELS[name] ?? name]} {...CHART_THEME.tooltip} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 mt-2">
                  {porTipo.map((entry) => {
                    const total = porTipo.reduce((s, e) => s + e.cantidad, 0)
                    const pct = total > 0 ? Math.round((entry.cantidad / total) * 100) : 0
                    return (
                      <div key={entry.tipo} className="flex items-center gap-1.5 text-xs">
                        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: TIPO_CHART_COLORS[entry.tipo] ?? "#6B7280" }} />
                        <span className="text-gray-300 truncate">{TIPO_LABELS[entry.tipo]}</span>
                        <span className="text-gray-500 ml-auto shrink-0">{pct}%</span>
                      </div>
                    )
                  })}
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center h-40 text-gray-500 text-sm">Sin datos</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Fila 3 — Satisfacción + Actividades recientes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Satisfacción por actividad */}
        <Card className="glass-card border-white/10">
          <CardHeader><CardTitle className="text-base text-white">Satisfacción promedio por actividad</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {satisfPorAct.length > 0 ? (
              satisfPorAct.map((a, i) => <SatisfaccionBar key={i} nombre={a.nombre} promedio={a.promedio} />)
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-gray-500 text-sm">
                <ClipboardList className="h-8 w-8 mb-2 text-gray-700" />
                Sin encuestas respondidas aún
              </div>
            )}
          </CardContent>
        </Card>

        {/* Actividades recientes */}
        <Card className="glass-card border-white/10">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base text-white">Actividades recientes</CardTitle>
            <Link href="/actividades"><Button variant="ghost" size="sm" className="text-gray-400 hover:text-white text-xs">Ver todas</Button></Link>
          </CardHeader>
          <CardContent className="p-0">
            {actRecientes.length > 0 ? (
              <div className="divide-y divide-white/5">
                {actRecientes.map((a) => (
                  <div key={a.id} className="flex items-center gap-3 px-6 py-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white font-medium truncate">{a.nombre_curso}</p>
                      <p className="text-xs text-gray-500">{a.participantes} participantes</p>
                    </div>
                    <Badge className={`${TIPO_COLORS_BADGE[a.tipo_certificado]} border text-xs shrink-0`}>{TIPO_LABELS[a.tipo_certificado]}</Badge>
                    <EncuestaBadge activa={a.encuesta_activa} />
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-gray-500 text-sm">
                <BookOpen className="h-8 w-8 mb-2 text-gray-700" />Sin actividades
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Fila 4 — Resumen encuestas */}
      <Card className="glass-card border-white/10">
        <CardHeader><CardTitle className="text-base text-white">Resumen de encuestas</CardTitle></CardHeader>
        <CardContent>
          {totalResp > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Promedio general */}
              <div className="space-y-2">
                <p className="text-xs text-gray-400 uppercase tracking-wider">Satisfacción general</p>
                <p className="text-4xl font-bold text-white">{satisfGen.toFixed(1)}</p>
                <Stars value={satisfGen} size="md" />
              </div>
              {/* Total respuestas */}
              <div className="space-y-1">
                <p className="text-xs text-gray-400 uppercase tracking-wider">Total respuestas</p>
                <p className="text-4xl font-bold text-white">{totalResp}</p>
                <p className="text-xs text-gray-500">encuestas completadas</p>
              </div>
              {/* Mejor pregunta */}
              <div className="space-y-2">
                <p className="text-xs text-gray-400 uppercase tracking-wider flex items-center gap-1">
                  <TrendingUp className="h-3 w-3 text-emerald-400" />Mejor evaluada
                </p>
                <p className="text-sm text-gray-200 leading-snug">{mejorPregunta?.texto ?? "-"}</p>
                {mejorPregunta && (
                  <div className="flex items-center gap-2">
                    <Stars value={mejorPregunta.promedio} />
                    <span className="text-emerald-400 font-semibold text-sm">{mejorPregunta.promedio.toFixed(1)}</span>
                  </div>
                )}
              </div>
              {/* Peor pregunta */}
              <div className="space-y-2">
                <p className="text-xs text-gray-400 uppercase tracking-wider flex items-center gap-1">
                  <TrendingDown className="h-3 w-3 text-red-400" />Por mejorar
                </p>
                <p className="text-sm text-gray-200 leading-snug">{peorPregunta?.texto ?? "-"}</p>
                {peorPregunta && (
                  <div className="flex items-center gap-2">
                    <Stars value={peorPregunta.promedio} />
                    <span className="text-red-400 font-semibold text-sm">{peorPregunta.promedio.toFixed(1)}</span>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-gray-500 text-sm">
              <ClipboardList className="h-8 w-8 mb-2 text-gray-700" />
              Sin respuestas de encuestas todavía
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
