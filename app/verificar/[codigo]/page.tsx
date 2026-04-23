"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import Image from "next/image"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { CheckCircle, XCircle, AlertTriangle, Loader2, ShieldCheck } from "lucide-react"

const TIPO_LABELS: Record<string, string> = {
  COMPETENCIAS: "Competencias", PUENTE_GRUA: "Puente Grua",
  RIGGER: "Rigger", SOLDADURA: "Soldadura",
}

export default function VerificarPage() {
  const params = useParams()
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

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
        {/* Logo */}
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
                <p className="text-xs text-gray-400 uppercase tracking-wider">Codigo de verificacion</p>
                <p className="font-mono text-lg text-white font-bold">{data.codigo}</p>
              </div>

              <Separator className="bg-white/5" />

              {/* Data rows */}
              <div className="space-y-3">
                <div className="flex justify-between items-start">
                  <span className="text-sm text-gray-400">Participante</span>
                  <span className="text-sm text-white font-medium text-right">{data.nombre}</span>
                </div>
                <div className="flex justify-between items-start">
                  <span className="text-sm text-gray-400">RUT</span>
                  <span className="text-sm text-gray-300 font-mono">{data.rut_parcial}</span>
                </div>
                <div className="flex justify-between items-start">
                  <span className="text-sm text-gray-400">Curso</span>
                  <span className="text-sm text-white text-right">{data.curso}</span>
                </div>
                <div className="flex justify-between items-start">
                  <span className="text-sm text-gray-400">Tipo</span>
                  <Badge className="bg-[#E8541A]/20 text-[#E8541A] border-[#E8541A]/30 border">{TIPO_LABELS[data.tipo]}</Badge>
                </div>
                <div className="flex justify-between items-start">
                  <span className="text-sm text-gray-400">Empresa</span>
                  <span className="text-sm text-white text-right">{data.empresa}</span>
                </div>

                <Separator className="bg-white/5" />

                <div className="flex justify-between items-start">
                  <span className="text-sm text-gray-400">Fecha Emision</span>
                  <span className="text-sm text-white">{new Date(data.fecha_emision).toLocaleDateString("es-CL")}</span>
                </div>
                {data.fecha_vencimiento && (
                  <div className="flex justify-between items-start">
                    <span className="text-sm text-gray-400">Fecha Vencimiento</span>
                    <span className={`text-sm font-medium ${data.estado_certificado === "VENCIDO" ? "text-red-400" : "text-white"}`}>
                      {new Date(data.fecha_vencimiento).toLocaleDateString("es-CL")}
                    </span>
                  </div>
                )}
              </div>
            </CardContent>

            {/* Footer */}
            <div className="px-6 py-4 bg-white/[0.02] border-t border-white/5 text-center">
              <p className="text-xs text-gray-500">OTEC Capacitaciones Q&C Spa - Formacap</p>
              <p className="text-xs text-gray-600 mt-1">www.formacap.cl</p>
            </div>
          </Card>
        )}

        <p className="text-center text-xs text-gray-600 mt-6">
          Sistema de verificacion de certificados Formacap
        </p>
      </div>
    </div>
  )
}
