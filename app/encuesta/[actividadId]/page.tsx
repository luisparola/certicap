"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Loader2, Star, CheckCircle2 } from "lucide-react"
import { validarRut, formatRut } from "@/lib/rut"

const ESCALA = [
  { valor: 1, label: "Muy malo" },
  { valor: 2, label: "Malo" },
  { valor: 3, label: "Regular" },
  { valor: 4, label: "Bueno" },
  { valor: 5, label: "Muy bueno" },
]

function Stars({ value }: { value: number }) {
  return (
    <span className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star key={i} className={`h-6 w-6 ${i <= Math.round(value) ? "fill-amber-400 text-amber-400" : "text-gray-600"}`} />
      ))}
      <span className="ml-2 text-lg font-bold text-white">{value.toFixed(1)} / 5</span>
    </span>
  )
}

export default function EncuestaPublicaPage() {
  const params = useParams()
  const [step, setStep] = useState<"identificacion" | "preguntas" | "gracias">("identificacion")
  const [encuesta, setEncuesta] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [noDisponible, setNoDisponible] = useState(false)

  // Step 1
  const [rut, setRut] = useState("")
  const [rutError, setRutError] = useState("")
  const [nombre, setNombre] = useState("")
  const [validando, setValidando] = useState(false)
  const [yaRespondio, setYaRespondio] = useState(false)

  // Step 2
  const [respuestas, setRespuestas] = useState<Record<string, number>>({})
  const [enviando, setEnviando] = useState(false)

  // Step 3
  const [promedio, setPromedio] = useState(0)

  useEffect(() => {
    fetch(`/api/encuestas/${params.actividadId}`)
      .then((r) => r.json())
      .then((d) => {
        if (!d.encuesta || !d.encuesta.activa) { setNoDisponible(true); return }
        setEncuesta(d.encuesta)
      })
      .catch(() => setNoDisponible(true))
      .finally(() => setLoading(false))
  }, [params.actividadId])

  const handleRutChange = (v: string) => {
    const formatted = formatRut(v)
    setRut(formatted)
    setNombre("")
    setYaRespondio(false)
    if (formatted.length > 3) {
      setRutError(validarRut(formatted) ? "" : "RUT inválido")
    } else { setRutError("") }
  }

  const validarYContinuar = async () => {
    if (!validarRut(rut)) { setRutError("RUT inválido"); return }
    setValidando(true)
    try {
      const res = await fetch(`/api/encuestas/${params.actividadId}/validar-rut`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ rut }),
      })
      const data = await res.json()
      if (!data.valido) { setRutError("RUT no está matriculado en esta actividad"); return }
      if (data.yaRespondio) { setYaRespondio(true); return }
      setNombre(data.nombre)
      setStep("preguntas")
    } catch {
      setRutError("Error al validar RUT")
    } finally { setValidando(false) }
  }

  const enviarRespuestas = async () => {
    setEnviando(true)
    try {
      const payload = encuesta.preguntas.map((p: any) => ({ preguntaId: p.id, valor: respuestas[p.id] }))
      const res = await fetch(`/api/encuestas/${params.actividadId}/responder`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rut, respuestas: payload }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setPromedio(data.promedio)
      setStep("gracias")
    } catch (err: any) {
      alert(err.message || "Error al enviar respuestas")
    } finally { setEnviando(false) }
  }

  const todasRespondidas = encuesta?.preguntas.every((p: any) => respuestas[p.id] !== undefined)

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0F0F0F] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#E8541A]" />
      </div>
    )
  }

  if (noDisponible) {
    return (
      <div className="min-h-screen bg-[#0F0F0F] flex items-center justify-center p-4">
        <Card className="glass-card border-white/10 max-w-md w-full">
          <CardContent className="p-8 text-center">
            <p className="text-gray-400">Esta encuesta no está disponible en este momento.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0F0F0F] flex items-center justify-center p-4">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-[#E8541A]/8 rounded-full blur-[120px] pointer-events-none" />

      <div className="relative z-10 w-full max-w-lg">
        <div className="flex justify-center mb-6">
          <Image src="/logo-formacap.png" alt="Formacap" width={180} height={60} className="h-14 w-auto" />
        </div>

        {/* Step 1: Identificación */}
        {step === "identificacion" && (
          <Card className="glass-card border-white/10 bg-[#1A1A1A]/80">
            <CardContent className="p-6 space-y-5">
              <div className="text-center">
                <h1 className="text-xl font-bold text-white">{encuesta.titulo}</h1>
                {encuesta.descripcion && <p className="text-gray-400 text-sm mt-2">{encuesta.descripcion}</p>}
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-gray-300">Tu RUT</Label>
                  <Input
                    value={rut}
                    onChange={(e) => handleRutChange(e.target.value)}
                    placeholder="12.345.678-9"
                    className={`bg-[#0F0F0F] border-white/10 text-white ${rutError ? "border-red-500/50" : ""}`}
                  />
                  {rutError && <p className="text-xs text-red-400">{rutError}</p>}
                  {yaRespondio && (
                    <p className="text-sm text-amber-400 flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4" />Ya completaste esta encuesta. ¡Gracias!
                    </p>
                  )}
                </div>

                {nombre && (
                  <div className="space-y-2">
                    <Label className="text-gray-300">Nombre</Label>
                    <Input value={nombre} readOnly className="bg-[#0F0F0F] border-white/10 text-gray-400" />
                  </div>
                )}

                <Button
                  onClick={validarYContinuar}
                  disabled={validando || !rut || !!rutError}
                  className="w-full bg-[#E8541A] hover:bg-[#E8541A]/90"
                >
                  {validando ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                  Continuar
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Preguntas */}
        {step === "preguntas" && encuesta && (
          <Card className="glass-card border-white/10 bg-[#1A1A1A]/80">
            <CardContent className="p-6 space-y-6">
              <div className="text-center">
                <h1 className="text-lg font-bold text-white">{encuesta.titulo}</h1>
                <p className="text-gray-400 text-sm mt-1">Hola, <span className="text-white font-medium">{nombre}</span> — escala del 1 al 5</p>
              </div>

              {encuesta.preguntas.map((p: any, i: number) => (
                <div key={p.id} className="space-y-3">
                  <p className="text-sm text-gray-200 font-medium">{i + 1}. {p.texto}</p>
                  <div className="flex gap-2">
                    {ESCALA.map(({ valor, label }) => (
                      <button
                        key={valor}
                        onClick={() => setRespuestas((prev) => ({ ...prev, [p.id]: valor }))}
                        title={label}
                        className={`w-10 h-10 rounded-full text-sm font-bold border-2 transition-all ${
                          respuestas[p.id] === valor
                            ? "bg-[#E8541A] border-[#E8541A] text-white"
                            : "bg-transparent border-white/20 text-gray-400 hover:border-[#E8541A]/50 hover:text-white"
                        }`}
                      >
                        {valor}
                      </button>
                    ))}
                    {respuestas[p.id] && (
                      <span className="self-center text-xs text-gray-400 ml-1">{ESCALA[respuestas[p.id] - 1]?.label}</span>
                    )}
                  </div>
                </div>
              ))}

              <Button
                onClick={enviarRespuestas}
                disabled={!todasRespondidas || enviando}
                className="w-full bg-[#E8541A] hover:bg-[#E8541A]/90"
              >
                {enviando ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                Enviar Respuestas
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Gracias */}
        {step === "gracias" && (
          <Card className="glass-card border-white/10 bg-[#1A1A1A]/80">
            <CardContent className="p-8 text-center space-y-5">
              <div className="p-4 rounded-full bg-emerald-500/10 border border-emerald-500/20 w-fit mx-auto">
                <CheckCircle2 className="h-10 w-10 text-emerald-400" />
              </div>
              <h2 className="text-2xl font-bold text-white">¡Gracias por tu respuesta!</h2>
              <p className="text-gray-400">Tu evaluación ha sido registrada exitosamente.</p>
              <div className="flex justify-center">
                <Stars value={promedio} />
              </div>
            </CardContent>
          </Card>
        )}

        <p className="text-center text-xs text-gray-600 mt-6">Sistema de encuestas Formacap — www.formacap.cl</p>
      </div>
    </div>
  )
}
