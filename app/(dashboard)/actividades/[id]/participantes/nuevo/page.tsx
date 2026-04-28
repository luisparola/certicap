"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import { validarRut, formatRut } from "@/lib/rut"
import { MARCAS_PUENTE_GRUA, getModelos, getCapacidades } from "@/lib/equipos"
import { ArrowLeft, Loader2, Save } from "lucide-react"

export default function NuevoParticipantePage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [tipoActividad, setTipoActividad] = useState("")
  const [rutError, setRutError] = useState("")
  const [form, setForm] = useState({
    nombre: "", rut: "", nota_teoria: "", nota_practica: "", asistencia_pct: "",
    nro_registro: "", estado: "PENDIENTE", marca_equipo: "", modelo_equipo: "",
    capacidad_equipo: "", senales: "",
    espesor_diametro: "", aplicacion_soldadura: "", observaciones: "",
  })

  useEffect(() => {
    fetch(`/api/actividades/${params.id}`)
      .then((r) => r.json())
      .then((d) => setTipoActividad(d.tipo_certificado))
      .catch(console.error)
  }, [params.id])

  const handleChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }))
    if (field === "rut" && value.length > 3) {
      setForm((prev) => ({ ...prev, rut: formatRut(value) }))
      setRutError(validarRut(value) ? "" : "RUT invalido")
    } else if (field === "rut") { setRutError("") }
    if (field === "marca_equipo") { setForm((prev) => ({ ...prev, modelo_equipo: "", capacidad_equipo: "" })) }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validarRut(form.rut)) { setRutError("RUT invalido"); return }
    setLoading(true)
    try {
      const res = await fetch(`/api/actividades/${params.id}/participantes`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form),
      })
      if (!res.ok) throw new Error("Error")
      toast({ title: "Participante agregado", description: `${form.nombre} ha sido registrado.` })
      router.push(`/actividades/${params.id}`)
    } catch {
      toast({ variant: "destructive", title: "Error", description: "No se pudo agregar el participante." })
    } finally { setLoading(false) }
  }

  const modelos = form.marca_equipo ? [...getModelos(form.marca_equipo), "OTRO"] : []
  const capacidades = form.marca_equipo ? [...getCapacidades(form.marca_equipo), "OTRO"] : []

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
      <div className="flex items-center gap-4">
        <Link href={`/actividades/${params.id}`}><Button variant="ghost" size="icon" className="text-gray-400 hover:text-white"><ArrowLeft className="h-5 w-5" /></Button></Link>
        <div><h1 className="text-2xl font-bold text-white">Nuevo Participante</h1><p className="text-gray-400 mt-1">Agregar participante a la actividad</p></div>
      </div>
      <form onSubmit={handleSubmit}>
        <Card className="glass-card border-white/10">
          <CardHeader><CardTitle className="text-lg text-white">Datos del Participante</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2"><Label className="text-gray-300">Nombre Completo *</Label><Input required value={form.nombre} onChange={(e) => handleChange("nombre", e.target.value)} placeholder="Nombre y apellido" className="bg-[#0F0F0F] border-white/10 text-white" /></div>
              <div className="space-y-2"><Label className="text-gray-300">RUT *</Label><Input required value={form.rut} onChange={(e) => handleChange("rut", e.target.value)} placeholder="12.345.678-9" className={`bg-[#0F0F0F] border-white/10 text-white ${rutError ? "border-red-500/50" : ""}`} />{rutError && <p className="text-xs text-red-400">{rutError}</p>}</div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-2"><Label className="text-gray-300">Nota Teoría</Label><Input type="number" step="1" min="1" max="100" value={form.nota_teoria} onChange={(e) => handleChange("nota_teoria", e.target.value)} className="bg-[#0F0F0F] border-white/10 text-white" /></div>
              <div className="space-y-2"><Label className="text-gray-300">Nota Práctica</Label><Input type="number" step="1" min="1" max="100" value={form.nota_practica} onChange={(e) => handleChange("nota_practica", e.target.value)} className="bg-[#0F0F0F] border-white/10 text-white" /></div>
              <div className="space-y-2"><Label className="text-gray-300">Asistencia %</Label><Input type="number" min="0" max="100" value={form.asistencia_pct} onChange={(e) => handleChange("asistencia_pct", e.target.value)} className="bg-[#0F0F0F] border-white/10 text-white" /></div>
              <div className="space-y-2"><Label className="text-gray-300">N Registro</Label><Input value={form.nro_registro} onChange={(e) => handleChange("nro_registro", e.target.value)} className="bg-[#0F0F0F] border-white/10 text-white" /></div>
            </div>
            <div className="space-y-2"><Label className="text-gray-300">Estado *</Label><Select value={form.estado} onValueChange={(v) => handleChange("estado", v)}><SelectTrigger className="bg-[#0F0F0F] border-white/10 text-white w-full md:w-48"><SelectValue /></SelectTrigger><SelectContent className="bg-[#1A1A1A] border-white/10"><SelectItem value="APROBADO">Aprobado</SelectItem><SelectItem value="REPROBADO">Reprobado</SelectItem><SelectItem value="PENDIENTE">Pendiente</SelectItem></SelectContent></Select></div>
          </CardContent>
        </Card>

        {tipoActividad === "PUENTE_GRUA" && (
          <Card className="glass-card border-white/10 mt-4">
            <CardHeader><CardTitle className="text-lg text-white">Datos del Equipo</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2"><Label className="text-gray-300">Marca</Label><Select value={form.marca_equipo} onValueChange={(v) => handleChange("marca_equipo", v)}><SelectTrigger className="bg-[#0F0F0F] border-white/10 text-white"><SelectValue placeholder="Seleccionar marca" /></SelectTrigger><SelectContent className="bg-[#1A1A1A] border-white/10">{MARCAS_PUENTE_GRUA.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}<SelectItem value="OTRO">Otro</SelectItem></SelectContent></Select></div>
                <div className="space-y-2"><Label className="text-gray-300">Modelo</Label>{form.marca_equipo === "OTRO" ? <Input value={form.modelo_equipo} onChange={(e) => handleChange("modelo_equipo", e.target.value)} placeholder="Especificar modelo" className="bg-[#0F0F0F] border-white/10 text-white" /> : <Select value={form.modelo_equipo} onValueChange={(v) => handleChange("modelo_equipo", v)}><SelectTrigger className="bg-[#0F0F0F] border-white/10 text-white"><SelectValue placeholder="Seleccionar modelo" /></SelectTrigger><SelectContent className="bg-[#1A1A1A] border-white/10">{modelos.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent></Select>}</div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2"><Label className="text-gray-300">Capacidad</Label>{form.marca_equipo === "OTRO" ? <Input value={form.capacidad_equipo} onChange={(e) => handleChange("capacidad_equipo", e.target.value)} placeholder="Especificar capacidad" className="bg-[#0F0F0F] border-white/10 text-white" /> : <Select value={form.capacidad_equipo} onValueChange={(v) => handleChange("capacidad_equipo", v)}><SelectTrigger className="bg-[#0F0F0F] border-white/10 text-white"><SelectValue placeholder="Seleccionar capacidad" /></SelectTrigger><SelectContent className="bg-[#1A1A1A] border-white/10">{capacidades.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select>}</div>
                <div className="space-y-2"><Label className="text-gray-300">Senales</Label><Input value={form.senales} onChange={(e) => handleChange("senales", e.target.value)} placeholder="Senales utilizadas" className="bg-[#0F0F0F] border-white/10 text-white" /></div>
              </div>
            </CardContent>
          </Card>
        )}

        {tipoActividad === "RIGGER" && (
          <Card className="glass-card border-white/10 mt-4">
            <CardHeader><CardTitle className="text-lg text-white">Datos Rigger</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2"><Label className="text-gray-300">Señales</Label><Input value={form.senales} onChange={(e) => handleChange("senales", e.target.value)} placeholder="Nota de señales" className="bg-[#0F0F0F] border-white/10 text-white" /></div>
            </CardContent>
          </Card>
        )}

        {tipoActividad === "SOLDADURA" && (
          <Card className="glass-card border-white/10 mt-4">
            <CardHeader><CardTitle className="text-lg text-white">Datos de Soldadura</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2"><Label className="text-gray-300">Espesor/Diámetro de Tubería</Label><Input value={form.espesor_diametro} onChange={(e) => handleChange("espesor_diametro", e.target.value)} placeholder="Ej: 6 pulgadas" className="bg-[#0F0F0F] border-white/10 text-white" /></div>
                <div className="space-y-2"><Label className="text-gray-300">Aplicación de Soldadura</Label><Input value={form.aplicacion_soldadura} onChange={(e) => handleChange("aplicacion_soldadura", e.target.value)} placeholder="Ej: SMAW 6G" className="bg-[#0F0F0F] border-white/10 text-white" /></div>
              </div>
              <div className="space-y-2"><Label className="text-gray-300">Observaciones</Label><Textarea value={form.observaciones} onChange={(e) => handleChange("observaciones", e.target.value)} placeholder="Observaciones adicionales" className="bg-[#0F0F0F] border-white/10 text-white min-h-[80px]" /></div>
            </CardContent>
          </Card>
        )}

        <div className="flex justify-end gap-3 mt-6">
          <Link href={`/actividades/${params.id}`}><Button variant="ghost" className="text-gray-400">Cancelar</Button></Link>
          <Button type="submit" className="bg-[#E8541A] hover:bg-[#E8541A]/90" disabled={loading}>{loading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Guardando...</> : <><Save className="h-4 w-4 mr-2" />Guardar</>}</Button>
        </div>
      </form>
    </div>
  )
}
