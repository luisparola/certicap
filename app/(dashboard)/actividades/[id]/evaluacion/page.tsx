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
import { ArrowLeft, Plus, Trash2, Loader2, ClipboardCheck, Copy, CheckCircle2, XCircle } from "lucide-react"

export default function GestionEvaluacionPage() {
  const params = useParams()
  const { toast } = useToast()
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [saving, setSaving] = useState(false)
  const [preguntas, setPreguntas] = useState<any[]>([])

  const baseUrl = typeof window !== "undefined" ? window.location.origin : ""
  const urlPublica = `${baseUrl}/evaluacion/${params.id}`

  const fetchData = async () => {
    const res = await fetch(`/api/evaluacion/${params.id}`)
    const d = await res.json()
    setData(d)
    if (d.evaluacion) setPreguntas(d.evaluacion.preguntas)
    setLoading(false)
  }

  useEffect(() => { fetchData() }, [params.id])

  const crearEvaluacion = async () => {
    setCreating(true)
    try {
      const res = await fetch(`/api/evaluacion/${params.id}`, { method: "POST" })
      if (!res.ok) throw new Error("Error")
      toast({ title: "Evaluación creada" })
      fetchData()
    } catch {
      toast({ variant: "destructive", title: "Error", description: "No se pudo crear la evaluación." })
    } finally { setCreating(false) }
  }

  const guardar = async (patch?: any) => {
    setSaving(true)
    try {
      const body = patch ?? { preguntas: preguntas.map((p, i) => ({ ...p, orden: i + 1 })) }
      const res = await fetch(`/api/evaluacion/${params.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
      if (!res.ok) throw new Error("Error")
      toast({ title: "Guardado" })
      fetchData()
    } catch {
      toast({ variant: "destructive", title: "Error", description: "No se pudo guardar." })
    } finally { setSaving(false) }
  }

  const toggleActiva = async (activa: boolean) => { await guardar({ activa }) }

  const agregarPregunta = () => {
    setPreguntas((prev) => [...prev, {
      id: null, texto: "", orden: prev.length + 1,
      alternativas: ["", "", "", ""], correcta: 0,
    }])
  }

  const eliminarPregunta = (idx: number) => setPreguntas((prev) => prev.filter((_, i) => i !== idx))

  const updatePregunta = (idx: number, field: string, value: any) => {
    setPreguntas((prev) => prev.map((p, i) => i === idx ? { ...p, [field]: value } : p))
  }

  const updateAlternativa = (pidx: number, aidx: number, value: string) => {
    setPreguntas((prev) => prev.map((p, i) => i === pidx ? { ...p, alternativas: p.alternativas.map((a: string, j: number) => j === aidx ? value : a) } : p))
  }

  const copiarUrl = () => { navigator.clipboard.writeText(urlPublica); toast({ title: "URL copiada" }) }

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-[#E8541A]" /></div>

  if (!data?.evaluacion) {
    return (
      <div className="max-w-lg mx-auto space-y-6 animate-fade-in py-12">
        <div className="flex items-center gap-4">
          <Link href={`/actividades/${params.id}`}><Button variant="ghost" size="icon" className="text-gray-400 hover:text-white"><ArrowLeft className="h-5 w-5" /></Button></Link>
          <h1 className="text-2xl font-bold text-white">Evaluación</h1>
        </div>
        <Card className="glass-card border-white/10">
          <CardContent className="p-8 text-center">
            <ClipboardCheck className="h-12 w-12 mx-auto text-gray-600 mb-4" />
            <p className="text-gray-400 mb-6">No existe evaluación para esta actividad.</p>
            <Button onClick={crearEvaluacion} disabled={creating} className="bg-[#E8541A] hover:bg-[#E8541A]/90">
              {creating ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Plus className="h-4 w-4 mr-2" />}
              Crear Evaluación
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const { evaluacion, stats, respuestas } = data

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-4">
        <Link href={`/actividades/${params.id}`}><Button variant="ghost" size="icon" className="text-gray-400 hover:text-white"><ArrowLeft className="h-5 w-5" /></Button></Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-white">Evaluación</h1>
          <p className="text-gray-400 mt-1">{evaluacion.titulo}</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-400">{evaluacion.activa ? "Activa" : "Inactiva"}</span>
          <Switch checked={evaluacion.activa} onCheckedChange={toggleActiva} disabled={preguntas.length === 0} />
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

      {/* Stats */}
      {stats.totalCompletadas > 0 && (
        <div className="grid grid-cols-3 gap-4">
          <Card className="glass-card border-white/10"><CardContent className="p-4"><p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Completadas</p><p className="text-2xl font-bold text-white">{stats.totalCompletadas} <span className="text-sm font-normal text-gray-400">/ {stats.totalParticipantes}</span></p></CardContent></Card>
          <Card className="glass-card border-white/10 col-span-2"><CardContent className="p-4"><p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Promedio</p><p className="text-2xl font-bold text-white">{stats.promedioGeneral.toFixed(1)}<span className="text-sm font-normal text-gray-400">/100</span></p></CardContent></Card>
        </div>
      )}

      {/* Preguntas editables */}
      <Card className="glass-card border-white/10">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg text-white">Preguntas ({preguntas.length})</CardTitle>
          <Button variant="outline" size="sm" onClick={agregarPregunta} className="border-white/10 text-gray-300"><Plus className="h-4 w-4 mr-2" />Agregar</Button>
        </CardHeader>
        <CardContent className="space-y-6">
          {preguntas.length === 0 && <p className="text-gray-500 text-sm text-center py-4">Sin preguntas aún. Agrega al menos una para activar la evaluación.</p>}
          {preguntas.map((p, i) => (
            <div key={i} className="space-y-3 p-4 rounded-lg border border-white/5 bg-white/[0.02]">
              <div className="flex items-center gap-2">
                <span className="text-[#E8541A] font-bold text-sm">{i + 1}.</span>
                <Input value={p.texto} onChange={(e) => updatePregunta(i, "texto", e.target.value)} placeholder="Texto de la pregunta" className="bg-[#0F0F0F] border-white/10 text-white flex-1" />
                <Button variant="ghost" size="sm" className="text-gray-500 hover:text-red-400 shrink-0" onClick={() => eliminarPregunta(i)}><Trash2 className="h-4 w-4" /></Button>
              </div>
              <div className="space-y-2 ml-5">
                {p.alternativas.map((alt: string, ai: number) => (
                  <div key={ai} className="flex items-center gap-2">
                    <input type="radio" name={`correcta-${i}`} checked={p.correcta === ai} onChange={() => updatePregunta(i, "correcta", ai)} className="accent-[#E8541A] shrink-0" />
                    <Input value={alt} onChange={(e) => updateAlternativa(i, ai, e.target.value)} placeholder={`Alternativa ${String.fromCharCode(65 + ai)}`} className="bg-[#0F0F0F] border-white/10 text-white text-sm h-8" />
                    {p.correcta === ai && <span className="text-xs text-emerald-400 shrink-0">✓ correcta</span>}
                  </div>
                ))}
              </div>
            </div>
          ))}
          {preguntas.length > 0 && (
            <div className="flex justify-end">
              <Button onClick={() => guardar()} disabled={saving} className="bg-[#E8541A] hover:bg-[#E8541A]/90">
                {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}Guardar Preguntas
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Resultados individuales */}
      {respuestas?.length > 0 && (
        <Card className="glass-card border-white/10">
          <CardHeader><CardTitle className="text-lg text-white">Resultados</CardTitle></CardHeader>
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/5">
                  <th className="text-left text-gray-400 px-4 py-3">Participante</th>
                  <th className="text-left text-gray-400 px-4 py-3">Fecha</th>
                  <th className="text-left text-gray-400 px-4 py-3">Puntaje</th>
                  <th className="text-left text-gray-400 px-4 py-3">Estado</th>
                </tr>
              </thead>
              <tbody>
                {respuestas.map((r: any) => (
                  <tr key={r.id} className="border-b border-white/5">
                    <td className="px-4 py-3 text-white">{r.participante.nombre}</td>
                    <td className="px-4 py-3 text-gray-400">{new Date(r.createdAt).toLocaleDateString("es-CL")}</td>
                    <td className="px-4 py-3 text-white font-bold">{r.puntaje.toFixed(0)}/100</td>
                    <td className="px-4 py-3">
                      {r.puntaje >= 60
                        ? <Badge className="bg-[#16A34A] text-white"><CheckCircle2 className="h-3 w-3 mr-1" />Aprobado</Badge>
                        : <Badge className="bg-[#DC2626] text-white"><XCircle className="h-3 w-3 mr-1" />Reprobado</Badge>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
