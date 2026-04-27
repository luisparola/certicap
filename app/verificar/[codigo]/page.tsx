"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import Image from "next/image"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { CheckCircle, XCircle, AlertTriangle, Loader2, ShieldCheck, Download } from "lucide-react"

const TIPO_LABELS: Record<string, string> = {
  COMPETENCIAS: "Competencias", PUENTE_GRUA: "Puente Grua",
  RIGGER: "Rigger", SOLDADURA: "Soldadura",
}

const ESTADO_LABELS: Record<string, string> = {
  APROBADO: "Aprobado", REPROBADO: "Reprobado", PENDIENTE: "Pendiente",
}

const ESTADO_COLORS: Record<string, string> = {
  APROBADO: "bg-[#16A34A] text-white",
  REPROBADO: "bg-[#DC2626] text-white",
  PENDIENTE: "bg-[#D97706] text-white",
}

function DataRow({ label, value }: { label: string; value: React.ReactNode }) {
  if (value === null || value === undefined || value === "") return null
  return (
    <div className="flex justify-between items-start">
      <span className="text-sm text-gray-400">{label}</span>
      <span className="text-sm text-white font-medium text-right">{value}</span>
    </div>
  )
}

export default function VerificarPage() {
  const params = useParams()
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [downloading, setDownloading] = useState(false)

  useEffect(() => {
    fetch(`/api/verificar/${params.codigo}`)
      .then((r) => {
        if (r.status === 404) { setNotFound(true); return null }
        return r.json()
      })
      .then((d) => { if (d) setData(d) })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false))
  }, [params.codigo])

  const descargarPDF = async () => {
    if (!data?.certificado_id) return
    setDownloading(true)
    try {
      const res = await fetch(`/api/certificados/${data.certificado_id}/pdf`)
      if (!res.ok) return
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `certificado-${data.codigo}.pdf`
      a.click()
      URL.revokeObjectURL(url)
    } finally {
      setDownloading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0F0F0F] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#E8541A]" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0F0F0F] flex items-center justify-center p-4">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-[#E8541A]/8 rounded-full blur-[120px] pointer-events-none" />

      <div className="relative z-10 w-full max-w-lg animate-fade-in">
        <div className="flex justify-center mb-6">
          <Image src="/logo-formacap.png" alt="Formacap" width={180} height={60} className="h-14 w-auto" />
        </div>

        {notFound || !data?.found ? (
          <Card className="glass-card border-white/10 bg-[#1A1A1A]/80">
            <CardContent className="p-8 text-center">
              <div className="p-4 rounded-full bg-red-500/10 border border-red-500/20 w-fit mx-auto mb-4">
                <XCircle className="h-10 w-10 text-red-400" />
              </div>
              <h2 className="text-xl font-bold text-white mb-2">Certificado no encontrado</h2>
              <p className="text-gray-400">
                El codigo <span className="font-mono text-white">{params.codigo}</span> no corresponde a ningun certificado registrado.
              </p>
            </CardContent>
          </Card>
        ) : (
          <Card className="glass-card border-white/10 bg-[#1A1A1A]/80 overflow-hidden">
            {/* Status banner */}
            <div className={`px-6 py-3 flex items-center gap-2 ${data.estado_certificado === "VALIDO" ? "bg-emerald-500/10 border-b border-emerald-500/20" : "bg-red-500/10 border-b border-red-500/20"}`}>
              {data.estado_certificado === "VALIDO" ? (
                <><CheckCircle className="h-5 w-5 text-emerald-400" /><span className="text-emerald-400 font-semibold">Certificado Valido</span></>
              ) : (
                <><AlertTriangle className="h-5 w-5 text-red-400" /><span className="text-red-400 font-semibold">Certificado Vencido</span></>
              )}
            </div>

            <CardContent className="p-6 space-y-5">
              {/* Shield icon + code */}
              <div className="text-center">
                <div className="p-3 rounded-full bg-[#E8541A]/10 border border-[#E8541A]/20 w-fit mx-auto mb-3">
                  <ShieldCheck className="h-8 w-8 text-[#E8541A]" />
                </div>
                <p className="text-xs text-gray-400 uppercase tracking-wider">Código de verificación</p>
                <p className="font-mono text-lg text-white font-bold">{data.codigo}</p>
              </div>

              <Separator className="bg-white/5" />

              {/* Participante */}
              <div className="space-y-3">
                <DataRow label="Participante" value={data.nombre} />
                <DataRow label="RUT" value={<span className="font-mono">{data.rut_parcial}</span>} />
                <DataRow label="Curso" value={data.curso} />
                <DataRow label="Tipo" value={<Badge className={`bg-[#E8541A]/20 text-[#E8541A] border-[#E8541A]/30 border`}>{TIPO_LABELS[data.tipo]}</Badge>} />
                <DataRow label="Empresa" value={data.empresa} />
                {data.nro_registro && <DataRow label="N° de Registro" value={<span className="font-mono">{data.nro_registro}</span>} />}
                {data.estado && (
                  <div className="flex justify-between items-start">
                    <span className="text-sm text-gray-400">Estado</span>
                    <Badge className={`border ${ESTADO_COLORS[data.estado] ?? ""}`}>{ESTADO_LABELS[data.estado] ?? data.estado}</Badge>
                  </div>
                )}
              </div>

              <Separator className="bg-white/5" />

              {/* Evaluacion */}
              {(data.nota_teoria != null || data.nota_practica != null || data.asistencia_pct != null) && (
                <>
                  <div className="space-y-3">
                    <p className="text-xs text-gray-500 uppercase tracking-wider">Evaluación</p>
                    {data.nota_teoria != null && <DataRow label="Nota Teoría" value={data.nota_teoria.toFixed(1)} />}
                    {data.nota_practica != null && <DataRow label="Nota Práctica" value={data.nota_practica.toFixed(1)} />}
                    {data.asistencia_pct != null && <DataRow label="Asistencia" value={`${data.asistencia_pct.toFixed(0)}%`} />}
                  </div>
                  <Separator className="bg-white/5" />
                </>
              )}

              {/* Fechas */}
              <div className="space-y-3">
                <DataRow label="Fecha Emisión" value={new Date(data.fecha_emision).toLocaleDateString("es-CL")} />
                {data.fecha_vencimiento && (
                  <div className="flex justify-between items-start">
                    <span className="text-sm text-gray-400">Fecha Vencimiento</span>
                    <span className={`text-sm font-medium ${data.estado_certificado === "VENCIDO" ? "text-red-400" : "text-white"}`}>
                      {new Date(data.fecha_vencimiento).toLocaleDateString("es-CL")}
                    </span>
                  </div>
                )}
              </div>

              <Separator className="bg-white/5" />

              {/* Descargar PDF */}
              <Button
                onClick={descargarPDF}
                disabled={downloading}
                className="w-full bg-[#E8541A] hover:bg-[#E8541A]/90 text-white"
              >
                {downloading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Download className="h-4 w-4 mr-2" />}
                Descargar Certificado
              </Button>
            </CardContent>

            {/* Footer */}
            <div className="px-6 py-4 bg-white/[0.02] border-t border-white/5 text-center">
              <p className="text-xs text-gray-500">OTEC Capacitaciones Q&C Spa - Formacap</p>
              <p className="text-xs text-gray-600 mt-1">www.formacap.cl</p>
            </div>
          </Card>
        )}

        <p className="text-center text-xs text-gray-600 mt-6">
          Sistema de verificación de certificados Formacap
        </p>
      </div>
    </div>
  )
}
