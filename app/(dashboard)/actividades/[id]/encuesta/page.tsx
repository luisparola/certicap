"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Input } from "@/components/ui/input"
import { useToast } from "@/components/ui/use-toast"
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts"
import { ArrowLeft, ClipboardList, Copy, Plus, Trash2, Loader2, Star, GripVertical } from "lucide-react"

function Stars({ value }: { value: number }) {
  return (
    <span className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star key={i} className={`h-4 w-4 ${i <= Math.round(value) ? "fill-amber-400 text-amber-400" : "text-gray-600"}`} />
      ))}
      <span className="ml-1 text-sm text-gray-300">{value.toFixed(1)} / 5</span>
    </span>
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

  const toggleActiva = async (activa: boolean) => {
    await guardar({ activa })
  }

  const agregarPregunta = () => {
    setPreguntas((prev) => [...prev, { id: null, texto: "", orden: prev.length + 1 }])
  }

  const eliminarPregunta = (idx: number) => {
    setPreguntas((prev) => prev.filter((_, i) => i !== idx))
  }

  const copiarUrl = () => {
    navigator.clipboard.writeText(urlPublica)
    toast({ title: "URL copiada al portapapeles" })
  }

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-[#E8541A]" /></div>

  // No encuesta yet
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

  return (
    <div className="space-y-6 animate-fade-in">
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

      {/* KPIs */}
      {stats.totalRespuestas > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="glass-card border-white/10">
            <CardContent className="p-4">
              <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Respuestas</p>
              <p className="text-2xl font-bold text-white">{stats.totalRespuestas} <span className="text-sm font-normal text-gray-400">/ {stats.totalParticipantes}</span></p>
            </CardContent>
          </Card>
          <Card className="glass-card border-white/10 md:col-span-2">
            <CardContent className="p-4">
              <p className="text-xs text-gray-400 uppercase tracking-wider mb-2">Promedio General</p>
              <Stars value={stats.promedioGeneral} />
            </CardContent>
          </Card>
        </div>
      )}

      {/* Gráfico por pregunta */}
      {stats.totalRespuestas > 0 && (
        <Card className="glass-card border-white/10">
          <CardHeader><CardTitle className="text-lg text-white">Resultados por Pregunta</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {stats.porPregunta.map((p: any, i: number) => (
              <div key={p.preguntaId} className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-300 truncate max-w-[80%]">{i + 1}. {p.texto}</span>
                  <span className="text-[#E8541A] font-semibold ml-2 shrink-0">{p.promedio.toFixed(1)}</span>
                </div>
                <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full bg-[#E8541A] rounded-full transition-all" style={{ width: `${(p.promedio / 5) * 100}%` }} />
                </div>
              </div>
            ))}

            <div className="mt-6" style={{ height: 200 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart layout="vertical" data={stats.porPregunta.map((p: any, i: number) => ({ name: `P${i + 1}`, promedio: p.promedio }))}>
                  <XAxis type="number" domain={[0, 5]} tick={{ fill: "#9ca3af", fontSize: 11 }} />
                  <YAxis type="category" dataKey="name" tick={{ fill: "#9ca3af", fontSize: 11 }} width={30} />
                  <Tooltip formatter={(v: any) => [v.toFixed(1), "Promedio"]} contentStyle={{ background: "#1A1A1A", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8 }} />
                  <Bar dataKey="promedio" radius={[0, 4, 4, 0]}>
                    {stats.porPregunta.map((_: any, i: number) => <Cell key={i} fill="#E8541A" />)}
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
                      <td className="px-4 py-3"><Stars value={r.promedio} /></td>
                      <td className="px-4 py-3">
                        <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white" onClick={() => setDetalle(detalle === r.id ? null : r.id)}>
                          {detalle === r.id ? "Ocultar" : "Ver"}
                        </Button>
                      </td>
                    </tr>
                    {detalle === r.id && (
                      <tr key={`${r.id}-detalle`} className="border-b border-white/5 bg-white/[0.02]">
                        <td colSpan={4} className="px-4 py-3">
                          <div className="space-y-1">
                            {r.detalle.map((d: any, i: number) => (
                              <div key={d.preguntaId} className="flex items-center gap-3 text-xs">
                                <span className="text-gray-500 w-4">{i + 1}.</span>
                                <span className="text-gray-300 flex-1">{d.texto}</span>
                                <span className="text-[#E8541A] font-bold w-4">{d.valor}</span>
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
