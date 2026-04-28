"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { CheckCircle2, Loader2, FileText } from "lucide-react"
import { validarRut, formatRut } from "@/lib/rut"

const TEXTO_DEBERES = `En cumplimiento de la normativa SENCE y las condiciones del programa de capacitación, el participante declara conocer y aceptar los siguientes deberes y derechos:

DERECHOS:
• Recibir la capacitación en las condiciones acordadas.
• Obtener el certificado de competencias al aprobar el curso.
• Ser tratado con respeto y dignidad durante la capacitación.
• Acceder a los materiales del curso.
• Solicitar información sobre su evaluación.

DEBERES:
• Asistir puntualmente a las sesiones programadas.
• Mantener un comportamiento respetuoso con instructores y compañeros.
• No utilizar dispositivos electrónicos sin autorización.
• Cumplir con las evaluaciones en los plazos establecidos.
• Informar con anticipación cualquier ausencia justificada.`

const TEXTO_DATOS = `De conformidad con la Ley N° 19.628 sobre Protección de la Vida Privada y sus modificaciones, OTEC Capacitaciones Q&C Spa, RUT 77.520.118-5, en su calidad de responsable del tratamiento de datos personales, informa:

DATOS RECOPILADOS: Nombre completo, RUT, datos de evaluación y asistencia, resultados académicos.

FINALIDAD: Los datos serán utilizados exclusivamente para:
(a) Gestión del proceso de capacitación
(b) Emisión de certificados de competencias
(c) Reporte a organismos reguladores (SENCE)
(d) Comunicaciones relacionadas con el curso

DERECHOS ARCO: Usted tiene derecho a Acceder, Rectificar, Cancelar y Oponerse al tratamiento de sus datos personales, enviando solicitud a contacto@formacap.cl

CONSERVACIÓN: Los datos se conservarán por el período mínimo exigido por la normativa SENCE (5 años) y luego serán eliminados.

Al aceptar, usted autoriza expresamente el tratamiento de sus datos personales para las finalidades descritas.`

export default function AcuerdoPage() {
  const params = useParams()
  const [step, setStep] = useState<"datos" | "acuerdo" | "confirmacion">("datos")
  const [actividad, setActividad] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [noDisponible, setNoDisponible] = useState(false)

  const [rut, setRut] = useState("")
  const [nombre, setNombre] = useState("")
  const [rutError, setRutError] = useState("")
  const [verificando, setVerificando] = useState(false)
  const [nombreReadonly, setNombreReadonly] = useState(false)

  const [aceptaDeberes, setAceptaDeberes] = useState(false)
  const [aceptaDatos, setAceptaDatos] = useState(false)
  const [enviando, setEnviando] = useState(false)

  const [resultado, setResultado] = useState<any>(null)

  useEffect(() => {
    fetch(`/api/acuerdo/${params.actividadId}`)
      .then((r) => r.json())
      .then((d) => { if (d.actividad) setActividad(d.actividad); else setNoDisponible(true) })
      .catch(() => setNoDisponible(true))
      .finally(() => setLoading(false))
  }, [params.actividadId])

  const handleRutChange = (v: string) => {
    const f = formatRut(v)
    setRut(f)
    // Only reset name if it was auto-filled (readonly); preserve manually entered names
    if (nombreReadonly) {
      setNombre("")
      setNombreReadonly(false)
    }
    setRutError(f.length > 3 ? (validarRut(f) ? "" : "RUT inválido") : "")
  }

  const continuar = async () => {
    if (!validarRut(rut)) { setRutError("RUT inválido"); return }
    if (!nombre.trim()) return
    setVerificando(true)
    try {
      const res = await fetch(`/api/acuerdo/${params.actividadId}?rut=${encodeURIComponent(rut)}`)
      const d = await res.json()
      if (d.yaFirmo) {
        // Already signed — show confirmation directly
        setResultado({
          nombre: d.nombre || nombre,
          rut,
          curso: actividad.nombre_curso,
          empresa: actividad.empresa_nombre,
          fecha: d.fecha ? new Date(d.fecha).toLocaleString("es-CL") : new Date().toLocaleString("es-CL"),
          yaExistia: true,
        })
        setStep("confirmacion")
        return
      }
      if (d.yaMatriculado && d.nombre) {
        setNombre(d.nombre)
        setNombreReadonly(true)
      }
      setStep("acuerdo")
    } catch {
      setStep("acuerdo")
    } finally { setVerificando(false) }
  }

  const matricular = async () => {
    if (!aceptaDeberes || !aceptaDatos) return
    setEnviando(true)
    try {
      const res = await fetch(`/api/acuerdo/${params.actividadId}`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rut, nombre, acepta_datos: aceptaDatos, acepta_deberes: aceptaDeberes }),
      })
      const d = await res.json()
      if (!res.ok && !d.yaFirmo) throw new Error(d.error)
      setResultado({
        nombre: d.nombre || nombre,
        rut,
        curso: d.curso || actividad.nombre_curso,
        empresa: d.empresa || actividad.empresa_nombre,
        fecha: d.fecha ? new Date(d.fecha).toLocaleString("es-CL") : new Date().toLocaleString("es-CL"),
        yaExistia: d.yaExistia,
      })
      setStep("confirmacion")
    } catch (err: any) {
      alert(err.message || "Error al procesar")
    } finally { setEnviando(false) }
  }

  if (loading) return <div className="min-h-screen bg-[#0F0F0F] flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-[#E8541A]" /></div>
  if (noDisponible) return (
    <div className="min-h-screen bg-[#0F0F0F] flex items-center justify-center p-4">
      <Card className="max-w-md w-full glass-card border-white/10"><CardContent className="p-8 text-center text-gray-400">Este enlace no está disponible.</CardContent></Card>
    </div>
  )

  return (
    <div className="min-h-screen bg-[#0F0F0F] flex items-center justify-center p-4">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-[#E8541A]/8 rounded-full blur-[120px] pointer-events-none" />
      <div className="relative z-10 w-full max-w-xl">
        <div className="flex justify-center mb-6">
          <Image src="/logo-formacap.png" alt="Formacap" width={180} height={60} className="h-14 w-auto" />
        </div>

        {/* Step 1: Datos personales */}
        {step === "datos" && (
          <Card className="glass-card border-white/10 bg-[#1A1A1A]/80">
            <CardContent className="p-6 space-y-5">
              <div className="text-center">
                <FileText className="h-8 w-8 text-[#E8541A] mx-auto mb-2" />
                <h1 className="text-xl font-bold text-white">Matrícula y Acuerdo</h1>
                <p className="text-gray-400 text-sm mt-1">{actividad.nombre_curso}</p>
                <p className="text-gray-500 text-xs mt-0.5">{actividad.empresa_nombre}</p>
              </div>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-gray-300">Nombre completo *</Label>
                  <Input value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Tu nombre y apellido" className="bg-[#0F0F0F] border-white/10 text-white" />
                </div>
                <div className="space-y-2">
                  <Label className="text-gray-300">RUT *</Label>
                  <Input value={rut} onChange={(e) => handleRutChange(e.target.value)} placeholder="12.345.678-9" className={`bg-[#0F0F0F] border-white/10 text-white ${rutError ? "border-red-500/50" : ""}`} />
                  {rutError && <p className="text-xs text-red-400">{rutError}</p>}
                </div>
                <Button onClick={continuar} disabled={verificando || !nombre.trim() || !rut || !!rutError} className="w-full bg-[#E8541A] hover:bg-[#E8541A]/90">
                  {verificando ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                  Continuar
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Acuerdo */}
        {step === "acuerdo" && (
          <Card className="glass-card border-white/10 bg-[#1A1A1A]/80">
            <CardContent className="p-6 space-y-5">
              <div className="text-center">
                <h1 className="text-lg font-bold text-white">Acuerdo y Autorización de Datos</h1>
                <p className="text-gray-400 text-sm mt-1">{nombre} — {rut}</p>
              </div>

              <div className="space-y-2">
                <p className="text-xs font-bold text-[#E8541A] uppercase tracking-wider">A — Deberes y Derechos del Participante</p>
                <div className="h-44 overflow-y-auto bg-white/[0.06] rounded-lg p-4 text-xs text-gray-200 leading-relaxed border border-white/10 whitespace-pre-line">
                  {TEXTO_DEBERES}
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-xs font-bold text-[#E8541A] uppercase tracking-wider">B — Autorización de Datos — Ley 19.628</p>
                <div className="h-44 overflow-y-auto bg-white/[0.06] rounded-lg p-4 text-xs text-gray-200 leading-relaxed border border-white/10 whitespace-pre-line">
                  {TEXTO_DATOS}
                </div>
              </div>

              <div className="space-y-3 pt-1">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input type="checkbox" checked={aceptaDeberes} onChange={(e) => setAceptaDeberes(e.target.checked)} className="mt-0.5 accent-[#E8541A]" />
                  <span className="text-sm text-gray-300">He leído y acepto los Deberes y Derechos del Participante</span>
                </label>
                <label className="flex items-start gap-3 cursor-pointer">
                  <input type="checkbox" checked={aceptaDatos} onChange={(e) => setAceptaDatos(e.target.checked)} className="mt-0.5 accent-[#E8541A]" />
                  <span className="text-sm text-gray-300">Autorizo el tratamiento de mis datos personales conforme a la Ley 19.628</span>
                </label>
              </div>

              <Button onClick={matricular} disabled={!aceptaDeberes || !aceptaDatos || enviando} className="w-full bg-[#E8541A] hover:bg-[#E8541A]/90">
                {enviando ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                Aceptar y Matricularme
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Confirmación */}
        {step === "confirmacion" && resultado && (
          <Card className="glass-card border-white/10 bg-[#1A1A1A]/80">
            <CardContent className="p-8 text-center space-y-5">
              <div className="p-4 rounded-full bg-emerald-500/10 border border-emerald-500/20 w-fit mx-auto">
                <CheckCircle2 className="h-10 w-10 text-emerald-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">
                  {resultado.yaExistia ? "Ya estás matriculado en este curso" : `Te has matriculado exitosamente en\n${resultado.curso}`}
                </h2>
              </div>
              <div className="text-sm text-gray-300 space-y-1.5 text-left bg-white/[0.03] rounded-lg p-4 border border-white/5">
                <p><span className="text-gray-500">Nombre:</span> {resultado.nombre}</p>
                <p><span className="text-gray-500">RUT:</span> {resultado.rut}</p>
                <p><span className="text-gray-500">Curso:</span> {resultado.curso}</p>
                <p><span className="text-gray-500">Empresa:</span> {resultado.empresa}</p>
                <p><span className="text-gray-500">Fecha:</span> {resultado.fecha}</p>
              </div>
              <p className="text-sm text-gray-400">Recibirás tu certificado al completar el curso.</p>
              <p className="text-xs text-gray-600">Registro con validez legal conforme a la Ley 19.628 sobre Protección de la Vida Privada</p>
            </CardContent>
          </Card>
        )}

        <p className="text-center text-xs text-gray-600 mt-6">OTEC Capacitaciones Q&C Spa — Formacap — www.formacap.cl</p>
      </div>
    </div>
  )
}
