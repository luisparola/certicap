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
import { ArrowLeft, Plus, Trash2, Loader2, ClipboardList, Copy, Star } from "lucide-react"

function Stars({ value }: { value: number }) {
  return (
    <span className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star key={i} className={`h-3.5 w-3.5 ${i <= Math.round(value) ? "fill-amber-400 text-amber-400" : "text-gray-700"}`} />
      ))}
      <span className="ml-1 text-sm text-gray-300">{value.toFixed(1)}</span>
    </span>
  )
}

export default function GestionEncuestaClientePage() {
  const params = useParams()
  const { toast } = useToast()
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [saving, setSaving] = useState(false)
  const [preguntas, setPreguntas] = useState<any[]>([])

  const baseUrl = typeof window !== "undefined" ? window.location.origin : ""
  const urlPublica = `${baseUrl}/encuesta-cliente/${params.id}`

  const fetchData = async () => {
    const res = await fetch(`/api/encuestas-cliente/${params.id}`)
    const d = await res.json()
    setData(d)
    if (d.encuesta) setPreguntas(d.encuesta.preguntas)
    setLoading(false)
  }

  useEffect(() => { fetchData() }, [params.id])

  const crearEncuesta = async () => {
    setCreating(true)
    try {
      const res = await fetch(`/api/encuestas-cliente/${params.id}`, { method: "POST" })
      if (!res.ok) throw new Error("Error")
      toast({ title: "Encuesta cliente creada" })
      fetchData()
    } catch { toast({ variant: "destructive", title: "Error", description: "No se pudo crear." }) }
    finally { setCreating(false) }
  }

  const guardar = async (patch?: any) => {
    setSaving(true)
    try {
      const body = patch ?? { preguntas: preguntas.map((p, i) => ({ ...p, orden: i + 1 })) }
      const res = await fetch(`/api/encuestas-cliente/${params.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
      if (!res.ok) throw new Error("Error")
      toast({ title: "Guardado" })
      fetchData()
    } catch { toast({ variant: "destructive", title: "Error", description: "No se pudo guardar." }) }
    finally { setSaving(false) }
  }

  const copiarUrl = () => { navigator.clipboard.writeText(urlPublica); toast({ title: "URL copiada" }) }

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-[#E8541A]" /></div>

  if (!data?.encuesta) {
    return (
      <div className="max-w-lg mx-auto space-y-6 animate-fade-in py-12">
        <div className="flex items-center gap-4">
          <Link href={`/actividades/${params.id}`}><Button variant="ghost" size="icon" className="text-gray-400 hover:text-white"><ArrowLeft className="h-5 w-5" /></Button></Link>
          <h1 className="text-2xl font-bold text-white">Encuesta de Cliente</h1>
        </div>
        <Card className="glass-card border-white/10">
          <CardContent className="p-8 text-center">
            <ClipboardList className="h-12 w-12 mx-auto text-gray-600 mb-4" />
            <p className="text-gray-400 mb-6">No existe encuesta de cliente para esta actividad.</p>
            <Button onClick={crearEncuesta} disabled={creating} className="bg-[#E8541A] hover:bg-[#E8541A]/90">
              {creating ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Plus className="h-4 w-4 mr-2" />}Crear Encuesta
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const { encuesta, stats, respuestas } = data

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-4">
        <Link href={`/actividades/${params.id}`}><Button variant="ghost" size="icon" className="text-gray-400 hover:text-white"><ArrowLeft className="h-5 w-5" /></Button></Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-white">Encuesta de Cliente</h1>
          <p className="text-gray-400 mt-1">{encuesta.titulo}</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-400">{encuesta.activa ? "Activa" : "Inactiva"}</span>
          <Switch checked={encuesta.activa} onCheckedChange={(v) => guardar({ activa: v })} />
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
      {stats.totalRespuestas > 0 && (
        <div className="grid grid-cols-2 gap-4">
          <Card className="glass-card border-white/10"><CardContent className="p-4"><p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Respuestas</p><p className="text-2xl font-bold text-white">{stats.totalRespuestas}</p></CardContent></Card>
          <Card className="glass-card border-white/10"><CardContent className="p-4"><p className="text-xs text-gray-400 uppercase tracking-wider mb-2">Promedio</p><Stars value={stats.promedioGeneral} /></CardContent></Card>
        </div>
      )}

      {/* Preguntas */}
      <Card className="glass-card border-white/10">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg text-white">Preguntas ({preguntas.length})</CardTitle>
          <Button variant="outline" size="sm" onClick={() => setPreguntas((p) => [...p, { id: null, texto: "", tipo: "escala", orden: p.length + 1 }])} className="border-white/10 text-gray-300"><Plus className="h-4 w-4 mr-2" />Agregar</Button>
        </CardHeader>
        <CardContent className="space-y-2">
          {preguntas.map((p, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="text-[#E8541A] font-bold text-sm">{i + 1}.</span>
              <Input value={p.texto} onChange={(e) => setPreguntas((prev) => prev.map((x, xi) => xi === i ? { ...x, texto: e.target.value } : x))} className="bg-[#0F0F0F] border-white/10 text-white flex-1" />
              <select value={p.tipo} onChange={(e) => setPreguntas((prev) => prev.map((x, xi) => xi === i ? { ...x, tipo: e.target.value } : x))}
                className="bg-[#0F0F0F] border border-white/10 text-gray-300 text-xs rounded px-2 py-1.5">
                <option value="escala">Escala</option>
                <option value="sino">Sí/No</option>
                <option value="texto">Texto</option>
              </select>
              <Button variant="ghost" size="sm" className="text-gray-500 hover:text-red-400 shrink-0" onClick={() => setPreguntas((prev) => prev.filter((_, xi) => xi !== i))}><Trash2 className="h-4 w-4" /></Button>
            </div>
          ))}
          <div className="flex justify-end pt-2">
            <Button onClick={() => guardar()} disabled={saving} className="bg-[#E8541A] hover:bg-[#E8541A]/90">
              {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}Guardar Preguntas
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Respuestas */}
      {respuestas?.length > 0 && (
        <Card className="glass-card border-white/10">
          <CardHeader><CardTitle className="text-lg text-white">Respuestas de Clientes</CardTitle></CardHeader>
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/5">
                  <th className="text-left text-gray-400 px-4 py-3">Empresa</th>
                  <th className="text-left text-gray-400 px-4 py-3">Contacto</th>
                  <th className="text-left text-gray-400 px-4 py-3">Fecha</th>
                  <th className="text-left text-gray-400 px-4 py-3">Promedio</th>
                </tr>
              </thead>
              <tbody>
                {respuestas.map((r: any) => (
                  <tr key={r.id} className="border-b border-white/5">
                    <td className="px-4 py-3 text-white">{r.nombre_empresa}</td>
                    <td className="px-4 py-3 text-gray-300">{r.nombre_contacto}</td>
                    <td className="px-4 py-3 text-gray-400">{new Date(r.createdAt).toLocaleDateString("es-CL")}</td>
                    <td className="px-4 py-3">{r.promedio > 0 ? <Stars value={r.promedio} /> : <span className="text-gray-500 text-xs">—</span>}</td>
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
