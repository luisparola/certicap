"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import { validarRut, formatRut } from "@/lib/rut"
import { ArrowLeft, Loader2, Save } from "lucide-react"
import Link from "next/link"

export default function NuevaActividadPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [rutError, setRutError] = useState("")
  const [form, setForm] = useState({
    nombre_curso: "", tipo_certificado: "", fecha_inicio: "", fecha_termino: "",
    lugar: "", instructor: "", empresa_nombre: "", empresa_rut: "", observaciones: "",
  })

  const handleChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }))
    if (field === "empresa_rut" && value.length > 3) {
      setForm((prev) => ({ ...prev, empresa_rut: formatRut(value) }))
      setRutError(validarRut(value) ? "" : "RUT invalido")
    } else if (field === "empresa_rut") { setRutError("") }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validarRut(form.empresa_rut)) { setRutError("RUT invalido"); return }
    setLoading(true)
    try {
      const res = await fetch("/api/actividades", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form),
      })
      if (!res.ok) throw new Error("Error")
      const data = await res.json()
      toast({ title: "Actividad creada", description: `"${form.nombre_curso}" registrada exitosamente.` })
      router.push(`/actividades/${data.id}`)
    } catch {
      toast({ variant: "destructive", title: "Error", description: "No se pudo crear la actividad." })
    } finally { setLoading(false) }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
      <div className="flex items-center gap-4">
        <Link href="/actividades"><Button variant="ghost" size="icon" className="text-gray-400 hover:text-white"><ArrowLeft className="h-5 w-5" /></Button></Link>
        <div><h1 className="text-2xl font-bold text-white">Nueva Actividad</h1><p className="text-gray-400 mt-1">Registra un nuevo curso o capacitacion</p></div>
      </div>
      <form onSubmit={handleSubmit}>
        <Card className="glass-card border-white/10">
          <CardHeader><CardTitle className="text-lg text-white">Informacion del Curso</CardTitle></CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2"><Label className="text-gray-300">Nombre del Curso *</Label><Input required value={form.nombre_curso} onChange={(e) => handleChange("nombre_curso", e.target.value)} placeholder="Ej: Operacion de Puente Grua" className="bg-[#0F0F0F] border-white/10 text-white" /></div>
              <div className="space-y-2"><Label className="text-gray-300">Tipo de Certificado *</Label><Select required value={form.tipo_certificado} onValueChange={(v) => handleChange("tipo_certificado", v)}><SelectTrigger className="bg-[#0F0F0F] border-white/10 text-white"><SelectValue placeholder="Selecciona tipo" /></SelectTrigger><SelectContent className="bg-[#1A1A1A] border-white/10"><SelectItem value="COMPETENCIAS">Competencias</SelectItem><SelectItem value="PUENTE_GRUA">Puente Grua</SelectItem><SelectItem value="RIGGER">Rigger</SelectItem><SelectItem value="SOLDADURA">Soldadura</SelectItem></SelectContent></Select></div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2"><Label className="text-gray-300">Fecha Inicio *</Label><Input type="date" required value={form.fecha_inicio} onChange={(e) => handleChange("fecha_inicio", e.target.value)} className="bg-[#0F0F0F] border-white/10 text-white" /></div>
              <div className="space-y-2"><Label className="text-gray-300">Fecha Termino *</Label><Input type="date" required value={form.fecha_termino} onChange={(e) => handleChange("fecha_termino", e.target.value)} className="bg-[#0F0F0F] border-white/10 text-white" /></div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2"><Label className="text-gray-300">Lugar *</Label><Input required value={form.lugar} onChange={(e) => handleChange("lugar", e.target.value)} placeholder="Ej: Planta Santiago" className="bg-[#0F0F0F] border-white/10 text-white" /></div>
              <div className="space-y-2"><Label className="text-gray-300">Instructor *</Label><Input required value={form.instructor} onChange={(e) => handleChange("instructor", e.target.value)} placeholder="Nombre del instructor" className="bg-[#0F0F0F] border-white/10 text-white" /></div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2"><Label className="text-gray-300">Empresa *</Label><Input required value={form.empresa_nombre} onChange={(e) => handleChange("empresa_nombre", e.target.value)} placeholder="Razon social" className="bg-[#0F0F0F] border-white/10 text-white" /></div>
              <div className="space-y-2"><Label className="text-gray-300">RUT Empresa *</Label><Input required value={form.empresa_rut} onChange={(e) => handleChange("empresa_rut", e.target.value)} placeholder="76.XXX.XXX-X" className={`bg-[#0F0F0F] border-white/10 text-white ${rutError ? "border-red-500/50" : ""}`} />{rutError && <p className="text-xs text-red-400">{rutError}</p>}</div>
            </div>
            <div className="space-y-2"><Label className="text-gray-300">Observaciones</Label><textarea value={form.observaciones} onChange={(e) => handleChange("observaciones", e.target.value)} placeholder="Notas adicionales (opcional)" rows={3} className="flex w-full rounded-md border border-white/10 bg-[#0F0F0F] px-3 py-2 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#E8541A]/20 transition-colors" /></div>
          </CardContent>
        </Card>
        <div className="flex justify-end gap-3 mt-6">
          <Link href="/actividades"><Button variant="ghost" className="text-gray-400">Cancelar</Button></Link>
          <Button type="submit" className="bg-[#E8541A] hover:bg-[#E8541A]/90" disabled={loading}>{loading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Guardando...</> : <><Save className="h-4 w-4 mr-2" />Guardar Actividad</>}</Button>
        </div>
      </form>
    </div>
  )
}
