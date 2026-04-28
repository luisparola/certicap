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
  { valor: 1, label: "Deficiente" },
  { valor: 2, label: "Malo" },
  { valor: 3, label: "Regular" },
  { valor: 4, label: "Bueno" },
  { valor: 5, label: "Excelente" },
]

type Respuesta = { valor?: number; valor_texto?: string }

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

function PreguntaInput({ pregunta, value, onChange }: {
  pregunta: any
  value: Respuesta | undefined
  onChange: (v: Respuesta) => void
}) {
  if (pregunta.tipo === "sino") {
    return (
      <div className="flex gap-3">
        {[{ v: 1, label: "Sí" }, { v: 0, label: "No" }].map(({ v, label }) => (
          <button
            key={v}
            onClick={() => onChange({ valor: v })}
            className={`px-6 py-2 rounded-lg text-sm font-bold border-2 transition-all ${
              value?.valor === v
                ? "bg-[#E8541A] border-[#E8541A] text-white"
                : "bg-transparent border-white/20 text-gray-400 hover:border-[#E8541A]/50 hover:text-white"
            }`}
          >
            {label}
          </button>
        ))}
      </div>
    )
  }

  if (pregunta.tipo === "texto") {
    return (
      <textarea
        value={value?.valor_texto ?? ""}
        onChange={(e) => onChange({ valor: 0, valor_texto: e.target.value })}
        placeholder="Escribe tu respuesta aquí..."
        rows={3}
        className="w-full rounded-md border border-white/10 bg-[#0F0F0F]/60 px-3 py-2 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-[#E8541A]/40 transition-colors resize-none"
      />
    )
  }

  // escala (default)
  return (
    <div className="flex flex-wrap gap-2">
      {ESCALA.map(({ valor, label }) => (
        <button
          key={valor}
          onClick={() => onChange({ valor })}
          title={label}
          className={`w-10 h-10 rounded-full text-sm font-bold border-2 transition-all ${
            value?.valor === valor
              ? "bg-[#E8541A] border-[#E8541A] text-white"
              : "bg-transparent border-white/20 text-gray-400 hover:border-[#E8541A]/50 hover:text-white"
          }`}
        >
          {valor}
        </button>
      ))}
      {value?.valor !== undefined && (
        <span className="self-center text-xs text-gray-400 ml-1">{ESCALA[value.valor - 1]?.label}</span>
      )}
    </div>
  )
}

export default function EncuestaPublicaPage() {
  const params = useParams()
  const [step, setStep] = useState<"identificacion" | "preguntas" | "gracias">("identificacion")
  const [encuesta, setEncuesta] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [noDisponible, setNoDisponible] = useState(false)

  const [rut, setRut] = useState("")
  const [rutError, setRutError] = useState("")
  const [nombre, setNombre] = useState("")
  const [validando, setValidando] = useState(false)
  const [yaRespondio, setYaRespondio] = useState(false)

  const [respuestas, setRespuestas] = useState<Record<string, Respuesta>>({})
  const [enviando, setEnviando] = useState(false)
  const [promedio, setPromedio] = useState(0)

  useEffect(() => {
    fetch(`/api/encuestas/${params.actividadId}/publica`)
      .then((r) => r.json())
      .then((d) => {
        if (!d.disponible) { setNoDisponible(true); return }
        setEncuesta(d)
      })
      .catch(() => setNoDisponible(true))
      .finally(() => setLoading(false))
  }, [params.actividadId])

  const handleRutChange = (v: string) => {
    const f = formatRut(v)
    setRut(f); setNombre(""); setYaRespondio(false)
    setRutError(f.length > 3 ? (validarRut(f) ? "" : "RUT inválido") : "")
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
    } catch { setRutError("Error al validar RUT") } finally { setValidando(false) }
  }

  const enviarRespuestas = async () => {
    setEnviando(true)
    try {
      const payload = encuesta.preguntas.map((p: any) => ({
        preguntaId: p.id,
        valor: respuestas[p.id]?.valor ?? 0,
        valor_texto: respuestas[p.id]?.valor_texto ?? null,
      }))
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

  const todasRespondidas = encuesta?.preguntas.every((p: any) => {
    const r = respuestas[p.id]
    if (!r) return false
    if (p.tipo === "texto") return (r.valor_texto?.trim().length ?? 0) > 0
    return r.valor !== undefined
  })

  if (loading) return (
    <div className="min-h-screen bg-[#0F0F0F] flex items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-[#E8541A]" />
    </div>
  )

  if (noDisponible) return (
    <div className="min-h-screen bg-[#0F0F0F] flex items-center justify-center p-4">
      <Card className="glass-card border-white/10 max-w-md w-full">
        <CardContent className="p-8 text-center">
          <p className="text-gray-400">Esta encuesta no está disponible en este momento.</p>
        </CardContent>
      </Card>
    </div>
  )

  const act = encuesta?.actividad
  const fechaStr = act?.fecha_inicio ? new Date(act.fecha_inicio).toLocaleDateString("es-CL") : "-"

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
                <p className="text-gray-400 text-xs mt-1 font-mono">{encuesta.descripcion}</p>
              </div>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-gray-300">Tu RUT</Label>
                  <Input value={rut} onChange={(e) => handleRutChange(e.target.value)} placeholder="12.345.678-9"
                    className={`bg-[#0F0F0F] border-white/10 text-white ${rutError ? "border-red-500/50" : ""}`} />
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
                <Button onClick={validarYContinuar} disabled={validando || !rut || !!rutError}
                  className="w-full bg-[#E8541A] hover:bg-[#E8541A]/90">
                  {validando ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}Continuar
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Preguntas */}
        {step === "preguntas" && encuesta && (
          <Card className="glass-card border-white/10 bg-[#1A1A1A]/80">
            <CardContent className="p-6 space-y-5">

              {/* Encabezado del formulario con datos del curso */}
              <div className="space-y-1">
                <h1 className="text-base font-bold text-white text-center">ENCUESTA DE SATISFACCIÓN DEL PARTICIPANTE</h1>
                <p className="text-xs text-gray-500 text-center">OTEC Capacitaciones Q&C Spa — Formacap</p>
              </div>
              {act && (
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs border border-white/10 rounded-lg p-3 bg-white/[0.02]">
                  <div><span className="text-gray-500">Empresa:</span> <span className="text-gray-300">{act.empresa_nombre}</span></div>
                  <div><span className="text-gray-500">Participante:</span> <span className="text-gray-300">{nombre}</span></div>
                  <div><span className="text-gray-500">Fecha:</span> <span className="text-gray-300">{fechaStr}</span></div>
                  <div><span className="text-gray-500">Curso:</span> <span className="text-gray-300">{act.nombre_curso}</span></div>
                  <div className="col-span-2"><span className="text-gray-500">Relator:</span> <span className="text-gray-300">{act.instructor}</span></div>
                </div>
              )}

              {/* Leyenda escala */}
              <div className="text-center text-xs text-gray-500 font-mono bg-white/[0.03] rounded px-3 py-1.5">
                DEFICIENTE = 1 &nbsp;|&nbsp; MALO = 2 &nbsp;|&nbsp; REGULAR = 3 &nbsp;|&nbsp; BUENO = 4 &nbsp;|&nbsp; EXCELENTE = 5
              </div>

              {/* Preguntas */}
              <div className="space-y-5">
                {encuesta.preguntas.map((p: any, i: number) => (
                  <div key={p.id} className="space-y-2">
                    <p className="text-sm text-gray-200 font-medium leading-snug">{i + 1}. {p.texto}</p>
                    <PreguntaInput
                      pregunta={p}
                      value={respuestas[p.id]}
                      onChange={(v) => setRespuestas((prev) => ({ ...prev, [p.id]: v }))}
                    />
                  </div>
                ))}
              </div>

              <Button onClick={enviarRespuestas} disabled={!todasRespondidas || enviando}
                className="w-full bg-[#E8541A] hover:bg-[#E8541A]/90">
                {enviando ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}Enviar Respuestas
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
              {promedio > 0 && (
                <div className="flex justify-center">
                  <Stars value={promedio} />
                </div>
              )}
            </CardContent>
          </Card>
        )}

        <p className="text-center text-xs text-gray-600 mt-6">Sistema de encuestas Formacap — www.formacap.cl</p>
      </div>
    </div>
  )
}
