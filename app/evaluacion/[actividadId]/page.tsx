"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { CheckCircle2, XCircle, Loader2, ClipboardCheck } from "lucide-react"
import { validarRut, formatRut } from "@/lib/rut"

export default function EvaluacionPage() {
  const params = useParams()
  const [step, setStep] = useState<"identificacion" | "preguntas" | "resultado">("identificacion")
  const [evaluacion, setEvaluacion] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [noDisponible, setNoDisponible] = useState(false)

  const [rut, setRut] = useState("")
  const [nombre, setNombre] = useState("")
  const [rutError, setRutError] = useState("")
  const [validando, setValidando] = useState(false)

  const [respuestas, setRespuestas] = useState<Record<string, number>>({})
  const [enviando, setEnviando] = useState(false)
  const [resultado, setResultado] = useState<any>(null)

  useEffect(() => {
    fetch(`/api/evaluacion/${params.actividadId}/publica`)
      .then((r) => r.json())
      .then((d) => { if (d.disponible) setEvaluacion(d); else setNoDisponible(true) })
      .catch(() => setNoDisponible(true))
      .finally(() => setLoading(false))
  }, [params.actividadId])

  const handleRutChange = (v: string) => {
    const f = formatRut(v)
    setRut(f); setNombre("")
    setRutError(f.length > 3 ? (validarRut(f) ? "" : "RUT inválido") : "")
  }

  const validarYContinuar = async () => {
    if (!validarRut(rut)) { setRutError("RUT inválido"); return }
    setValidando(true)
    try {
      const res = await fetch(`/api/encuestas/${params.actividadId}/validar-rut`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ rut }),
      })
      const d = await res.json()
      if (!d.valido) { setRutError("RUT no está matriculado en esta actividad"); return }
      if (d.yaRespondio) { setRutError("Ya completaste esta evaluación anteriormente"); return }
      setNombre(d.nombre)
      setStep("preguntas")
    } catch { setRutError("Error al validar RUT") } finally { setValidando(false) }
  }

  const enviar = async () => {
    setEnviando(true)
    try {
      const payload = evaluacion.preguntas.map((p: any) => ({ preguntaId: p.id, seleccionada: respuestas[p.id] }))
      const res = await fetch(`/api/evaluacion/${params.actividadId}/responder`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rut, respuestas: payload }),
      })
      const d = await res.json()
      if (!res.ok) throw new Error(d.error)
      setResultado(d)
      setStep("resultado")
    } catch (err: any) { alert(err.message || "Error al enviar") } finally { setEnviando(false) }
  }

  const todasRespondidas = evaluacion?.preguntas?.every((p: any) => respuestas[p.id] !== undefined)

  if (loading) return <div className="min-h-screen bg-[#0F0F0F] flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-[#E8541A]" /></div>
  if (noDisponible) return (
    <div className="min-h-screen bg-[#0F0F0F] flex items-center justify-center p-4">
      <Card className="max-w-md w-full glass-card border-white/10"><CardContent className="p-8 text-center text-gray-400">Esta evaluación no está disponible en este momento.</CardContent></Card>
    </div>
  )

  return (
    <div className="min-h-screen bg-[#0F0F0F] flex items-center justify-center p-4">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-[#E8541A]/8 rounded-full blur-[120px] pointer-events-none" />
      <div className="relative z-10 w-full max-w-xl">
        <div className="flex justify-center mb-6">
          <Image src="/logo-formacap.png" alt="Formacap" width={180} height={60} className="h-14 w-auto" />
        </div>

        {step === "identificacion" && (
          <Card className="glass-card border-white/10 bg-[#1A1A1A]/80">
            <CardContent className="p-6 space-y-5">
              <div className="text-center">
                <ClipboardCheck className="h-8 w-8 text-[#E8541A] mx-auto mb-2" />
                <h1 className="text-xl font-bold text-white">{evaluacion.titulo}</h1>
                <p className="text-gray-400 text-sm mt-1">{evaluacion.preguntas.length} preguntas de alternativas</p>
              </div>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-gray-300">Tu RUT</Label>
                  <Input value={rut} onChange={(e) => handleRutChange(e.target.value)} placeholder="12.345.678-9" className="bg-[#0F0F0F] border-white/10 text-white" />
                  {rutError && <p className="text-xs text-red-400">{rutError}</p>}
                </div>
                <Button onClick={validarYContinuar} disabled={validando || !rut || !!rutError} className="w-full bg-[#E8541A] hover:bg-[#E8541A]/90">
                  {validando ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}Comenzar
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {step === "preguntas" && (
          <Card className="glass-card border-white/10 bg-[#1A1A1A]/80">
            <CardContent className="p-6 space-y-6">
              <div className="text-center">
                <h1 className="text-lg font-bold text-white">{evaluacion.titulo}</h1>
                <p className="text-gray-400 text-sm">Hola, <span className="text-white font-medium">{nombre}</span></p>
              </div>

              {evaluacion.preguntas.map((p: any, i: number) => (
                <div key={p.id} className="space-y-3">
                  <p className="text-sm font-medium text-gray-200">
                    <span className="text-[#E8541A] font-bold mr-2">{i + 1}.</span>{p.texto}
                  </p>
                  <div className="space-y-2">
                    {p.alternativas.map((alt: string, idx: number) => (
                      <label key={idx} className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${respuestas[p.id] === idx ? "border-[#E8541A] bg-[#E8541A]/10" : "border-white/10 hover:border-white/20"}`}>
                        <input type="radio" name={p.id} value={idx} checked={respuestas[p.id] === idx} onChange={() => setRespuestas((prev) => ({ ...prev, [p.id]: idx }))} className="accent-[#E8541A]" />
                        <span className="text-sm text-gray-300">{alt}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}

              <div className="text-xs text-gray-500 text-center">
                {Object.keys(respuestas).length} / {evaluacion.preguntas.length} respondidas
              </div>

              <Button onClick={enviar} disabled={!todasRespondidas || enviando} className="w-full bg-[#E8541A] hover:bg-[#E8541A]/90">
                {enviando ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}Enviar Respuestas
              </Button>
            </CardContent>
          </Card>
        )}

        {step === "resultado" && resultado && (
          <Card className="glass-card border-white/10 bg-[#1A1A1A]/80">
            <CardContent className="p-8 text-center space-y-5">
              <div className={`p-4 rounded-full w-fit mx-auto ${resultado.aprobado ? "bg-emerald-500/10 border border-emerald-500/20" : "bg-red-500/10 border border-red-500/20"}`}>
                {resultado.aprobado ? <CheckCircle2 className="h-10 w-10 text-emerald-400" /> : <XCircle className="h-10 w-10 text-red-400" />}
              </div>
              <div>
                <p className={`text-3xl font-bold ${resultado.aprobado ? "text-emerald-400" : "text-red-400"}`}>
                  {resultado.aprobado ? "APROBADO" : "REPROBADO"}
                </p>
                <p className="text-4xl font-bold text-white mt-2">{resultado.puntaje.toFixed(0)}<span className="text-xl text-gray-400">/100</span></p>
              </div>
              <p className="text-sm text-gray-400">
                {resultado.correctas} correctas de {resultado.total} preguntas
              </p>
              <p className="text-xs text-gray-500">Puntaje mínimo de aprobación: 60 puntos</p>
            </CardContent>
          </Card>
        )}

        <p className="text-center text-xs text-gray-600 mt-6">Sistema de evaluación Formacap — www.formacap.cl</p>
      </div>
    </div>
  )
}
