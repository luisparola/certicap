"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Input } from "@/components/ui/input"
import { useToast } from "@/components/ui/use-toast"
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, LabelList } from "recharts"
import { ArrowLeft, ClipboardList, Copy, Plus, Trash2, Loader2, Star, GripVertical } from "lucide-react"

function barColor(v: number): string {
  if (v < 3) return "#EF4444"
  if (v < 4) return "#F59E0B"
  if (v < 5) return "#22C55E"
  return "#16A34A"
}

function Stars({ value, size = "sm" }: { value: number; size?: "sm" | "lg" }) {
  const sz = size === "lg" ? "h-6 w-6" : "h-3.5 w-3.5"
  return (
    <span className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star key={i} className={`${sz} ${i <= Math.round(value) ? "fill-amber-400 text-amber-400" : "text-gray-300"}`} />
      ))}
    </span>
  )
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: "#fff", border: "1px solid #E0E0E0", borderRadius: 8, padding: "6px 12px", fontSize: 12, color: "#333" }}>
      <span style={{ fontWeight: 600 }}>{label}:</span> {payload[0].value.toFixed(1)}
    </div>
  )
}

export default function GestionEncuestaPage() {
  const params = useParams()
  const { toast } = useToast()
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [saving, setSaving] = useState(false)
  const [preguntas, setPreguntas] = useState<any[]>([])
  const [detalle, setDetalle] = useState<string | null>(null)

  const baseUrl = typeof window !== "undefined" ? window.location.origin : ""
  const urlPublica = `${baseUrl}/encuesta/${params.id}`

  const fetchData = async () => {
    const res = await fetch(`/api/encuestas/${params.id}`)
    const d = await res.json()
    setData(d)
    if (d.encuesta) setPreguntas(d.encuesta.preguntas)
    setLoading(false)
  }

  useEffect(() => { fetchData() }, [params.id])

  const crearEncuesta = async () => {
    setCreating(true)
    try {
      const res = await fetch(`/api/encuestas/${params.id}`, { method: "POST" })
      if (!res.ok) throw new Error("Error")
      toast({ title: "Encuesta creada" })
      fetchData()
    } catch {
      toast({ variant: "destructive", title: "Error", description: "No se pudo crear la encuesta." })
    } finally { setCreating(false) }
  }

  const guardar = async (patch?: any) => {
    setSaving(true)
    try {
      const body = patch ?? { preguntas: preguntas.map((p, i) => ({ ...p, orden: i + 1 })) }
      const res = await fetch(`/api/encuestas/${params.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
      if (!res.ok) throw new Error("Error")
      toast({ title: "Guardado" })
      fetchData()
    } catch {
      toast({ variant: "destructive", title: "Error", description: "No se pudo guardar." })
    } finally { setSaving(false) }
  }

  const toggleActiva = async (activa: boolean) => { await guardar({ activa }) }
  const agregarPregunta = () => { setPreguntas((prev) => [...prev, { id: null, texto: "", orden: prev.length + 1 }]) }
  const eliminarPregunta = (idx: number) => { setPreguntas((prev) => prev.filter((_, i) => i !== idx)) }
  const copiarUrl = () => { navigator.clipboard.writeText(urlPublica); toast({ title: "URL copiada al portapapeles" }) }

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-[#E8541A]" /></div>

  if (!data?.encuesta) {
    return (
      <div className="max-w-lg mx-auto space-y-6 animate-fade-in py-12">
        <div className="flex items-center gap-4">
          <Link href={`/actividades/${params.id}`}><Button variant="ghost" size="icon" className="text-gray-400 hover:text-white"><ArrowLeft className="h-5 w-5" /></Button></Link>
          <h1 className="text-2xl font-bold text-white">Encuesta de Satisfacción</h1>
        </div>
        <Card className="glass-card border-white/10">
          <CardContent className="p-8 text-center">
            <ClipboardList className="h-12 w-12 mx-auto text-gray-600 mb-4" />
            <p className="text-gray-400 mb-6">No existe encuesta para esta actividad.</p>
            <Button onClick={crearEncuesta} disabled={creating} className="bg-[#E8541A] hover:bg-[#E8541A]/90">
              {creating ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Plus className="h-4 w-4 mr-2" />}
              Crear Encuesta
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const { encuesta, stats, respuestasIndividuales } = data
  const chartData = stats.porPregunta.map((p: any, i: number) => ({
    name: `P${i + 1}`,
    promedio: p.promedio,
    fill: barColor(p.promedio),
  }))
  const chartHeight = Math.max(180, chartData.length * 40)

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href={`/actividades/${params.id}`}><Button variant="ghost" size="icon" className="text-gray-400 hover:text-white"><ArrowLeft className="h-5 w-5" /></Button></Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-white">Encuesta de Satisfacción</h1>
          <p className="text-gray-400 mt-1">{encuesta.titulo}</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-400">{encuesta.activa ? "Activa" : "Inactiva"}</span>
          <Switch checked={encuesta.activa} onCheckedChange={toggleActiva} />
        </div>
      </div>

      {/* URL pública */}
      <Card className="glass-card border-white/10">
        <CardContent className="p-4 flex items-center gap-3">
          <span className="text-xs text-gray-400 uppercase tracking-wider shrink-0">URL pública</span>
          <code className="flex-1 text-sm text-[#E8541A] bg-[#E8541A]/5 px-3 py-1.5 rounded font-mono truncate">{urlPublica}</code>
          <Button variant="outline" size="sm" onClick={copiarUrl} className="border-white/10 text-gray-300 shrink-0">
            <Copy className="h-4 w-4 mr-2" />Copiar
          </Button>
        </CardContent>
      </Card>

      {/* ── RESUMEN MEJORADO ──────────────────────────────────────────── */}
      {stats.totalRespuestas > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Respuestas con barra de progreso */}
          <Card className="glass-card border-white/10">
            <CardContent className="p-5">
              <p className="text-xs text-gray-400 uppercase tracking-wider mb-3">Participación</p>
              <div className="flex items-end gap-2 mb-3">
                <span className="text-4xl font-bold text-white">{stats.totalRespuestas}</span>
                <span className="text-sm text-gray-400 mb-1">/ {stats.totalParticipantes} participantes</span>
              </div>
              <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${stats.totalParticipantes > 0 ? (stats.totalRespuestas / stats.totalParticipantes) * 100 : 0}%`,
                    background: "#E8541A",
                  }}
                />
              </div>
              <p className="text-xs text-gray-500 mt-1.5">
                {stats.totalParticipantes > 0
                  ? Math.round((stats.totalRespuestas / stats.totalParticipantes) * 100)
                  : 0}% de respuesta
              </p>
            </CardContent>
          </Card>

          {/* Promedio general con número grande */}
          <Card className="glass-card border-white/10 md:col-span-2 overflow-hidden">
            <CardContent className="p-5" style={{ background: "linear-gradient(135deg, rgba(232,84,26,0.06) 0%, transparent 60%)" }}>
              <p className="text-xs text-gray-400 uppercase tracking-wider mb-3">Satisfacción General</p>
              <div className="flex items-center gap-5">
                <span
                  className="font-bold leading-none"
                  style={{ fontSize: 52, color: barColor(stats.promedioGeneral) }}
                >
                  {stats.promedioGeneral.toFixed(1)}
                </span>
                <div>
                  <Stars value={stats.promedioGeneral} size="lg" />
                  <p className="text-xs text-gray-400 mt-1.5">promedio de {stats.totalRespuestas} respuesta{stats.totalRespuestas !== 1 ? "s" : ""}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ── RESULTADOS POR PREGUNTA ───────────────────────────────────── */}
      {stats.totalRespuestas > 0 && (
        <Card className="glass-card border-white/10">
          <CardHeader><CardTitle className="text-lg text-white">Resultados por Pregunta</CardTitle></CardHeader>
          <CardContent>
            {/* Row list */}
            <div className="divide-y divide-white/5">
              {stats.porPregunta.map((p: any, i: number) => {
                const color = barColor(p.promedio)
                const pct = (p.promedio / 5) * 100
                return (
                  <div key={p.preguntaId} className="flex items-center gap-3 py-3">
                    {/* Number */}
                    <span className="min-w-[22px] text-sm font-bold text-[#E8541A] shrink-0">{i + 1}</span>
                    {/* Text */}
                    <span className="flex-1 text-sm text-gray-300 min-w-0">{p.texto}</span>
                    {/* Bar */}
                    <div className="w-36 shrink-0 bg-white/10 rounded-full h-2">
                      <div className="h-2 rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: color }} />
                    </div>
                    {/* Stars */}
                    <Stars value={p.promedio} size="sm" />
                    {/* Value */}
                    <span className="min-w-[32px] text-right text-sm font-bold shrink-0" style={{ color }}>{p.promedio.toFixed(1)}</span>
                  </div>
                )
              })}
            </div>

            {/* Recharts horizontal bar chart */}
            <div className="mt-6" style={{ height: chartHeight }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  layout="vertical"
                  data={chartData}
                  margin={{ top: 0, right: 40, bottom: 0, left: 0 }}
                >
                  <XAxis
                    type="number"
                    domain={[0, 5]}
                    ticks={[1, 2, 3, 4, 5]}
                    tick={{ fill: "#9ca3af", fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    tick={{ fill: "#9ca3af", fontSize: 11 }}
                    width={28}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="promedio" radius={[0, 4, 4, 0]} maxBarSize={18}>
                    {chartData.map((entry: any, i: number) => (
                      <Cell key={i} fill={entry.fill} />
                    ))}
                    <LabelList
                      dataKey="promedio"
                      position="right"
                      formatter={(v: any) => (typeof v === "number" ? v.toFixed(1) : v)}
                      style={{ fill: "#9ca3af", fontSize: 11 }}
                    />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Preguntas editables */}
      <Card className="glass-card border-white/10">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg text-white">Preguntas</CardTitle>
          <Button variant="outline" size="sm" onClick={agregarPregunta} className="border-white/10 text-gray-300">
            <Plus className="h-4 w-4 mr-2" />Agregar
          </Button>
        </CardHeader>
        <CardContent className="space-y-2">
          {preguntas.map((p, i) => (
            <div key={i} className="flex items-center gap-2">
              <GripVertical className="h-4 w-4 text-gray-600 shrink-0" />
              <span className="text-gray-500 text-sm w-6 shrink-0">{i + 1}.</span>
              <Input
                value={p.texto}
                onChange={(e) => setPreguntas((prev) => prev.map((x, xi) => xi === i ? { ...x, texto: e.target.value } : x))}
                className="bg-[#0F0F0F] border-white/10 text-white flex-1"
              />
              <Button variant="ghost" size="sm" className="text-gray-500 hover:text-red-400 shrink-0" onClick={() => eliminarPregunta(i)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
          <div className="flex justify-end pt-2">
            <Button onClick={() => guardar()} disabled={saving} className="bg-[#E8541A] hover:bg-[#E8541A]/90">
              {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              Guardar Preguntas
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Respuestas individuales */}
      {respuestasIndividuales?.length > 0 && (
        <Card className="glass-card border-white/10">
          <CardHeader><CardTitle className="text-lg text-white">Respuestas Individuales</CardTitle></CardHeader>
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/5">
                  <th className="text-left text-gray-400 px-4 py-3">Participante</th>
                  <th className="text-left text-gray-400 px-4 py-3">Fecha</th>
                  <th className="text-left text-gray-400 px-4 py-3">Promedio</th>
                  <th className="text-left text-gray-400 px-4 py-3">Detalle</th>
                </tr>
              </thead>
              <tbody>
                {respuestasIndividuales.map((r: any) => (
                  <>
                    <tr key={r.id} className="border-b border-white/5">
                      <td className="px-4 py-3 text-white">{r.participante.nombre}</td>
                      <td className="px-4 py-3 text-gray-400">{new Date(r.createdAt).toLocaleDateString("es-CL")}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Stars value={r.promedio} size="sm" />
                          <span className="text-sm font-semibold" style={{ color: barColor(r.promedio) }}>{r.promedio.toFixed(1)}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white" onClick={() => setDetalle(detalle === r.id ? null : r.id)}>
                          {detalle === r.id ? "Ocultar" : "Ver"}
                        </Button>
                      </td>
                    </tr>
                    {detalle === r.id && (
                      <tr key={`${r.id}-detalle`} className="border-b border-white/5 bg-white/[0.02]">
                        <td colSpan={4} className="px-4 py-3">
                          <div className="space-y-1.5">
                            {r.detalle.map((d: any, i: number) => (
                              <div key={d.preguntaId} className="flex items-center gap-3 text-xs">
                                <span className="text-[#E8541A] font-bold w-5 shrink-0">{i + 1}.</span>
                                <span className="text-gray-300 flex-1">{d.texto}</span>
                                <span className="font-bold shrink-0" style={{ color: barColor(d.valor) }}>{d.valor}</span>
                              </div>
                            ))}
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
