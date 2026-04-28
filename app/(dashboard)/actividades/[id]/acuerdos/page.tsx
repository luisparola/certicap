"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import * as XLSX from "xlsx"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/components/ui/use-toast"
import { ArrowLeft, Copy, Download, Loader2, FileText, CheckCircle2, XCircle } from "lucide-react"

export default function GestionAcuerdosPage() {
  const params = useParams()
  const { toast } = useToast()
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  const baseUrl = typeof window !== "undefined" ? window.location.origin : ""
  const urlPublica = `${baseUrl}/acuerdo/${params.id}`

  useEffect(() => {
    fetch(`/api/acuerdo/${params.id}?lista=1`)
      .then((r) => r.json())
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [params.id])

  const copiarUrl = () => {
    navigator.clipboard.writeText(urlPublica)
    toast({ title: "URL copiada al portapapeles" })
  }

  const exportarExcel = () => {
    if (!data?.lista?.length) return
    const rows = data.lista.map((a: any) => ({
      Nombre: a.nombre,
      RUT: a.rut,
      "Fecha firma": new Date(a.fecha).toLocaleString("es-CL"),
      IP: a.ip_address ?? "-",
      "Acepta deberes": a.acepta_deberes ? "Sí" : "No",
      "Acepta datos": a.acepta_datos ? "Sí" : "No",
    }))
    const wb = XLSX.utils.book_new()
    const ws = XLSX.utils.json_to_sheet(rows)
    XLSX.utils.book_append_sheet(wb, ws, "Acuerdos")
    XLSX.writeFile(wb, `acuerdos_${data.actividad?.nombre_curso?.replace(/\s/g, "_") ?? params.id}.xlsx`)
  }

  if (loading) return (
    <div className="flex justify-center py-20">
      <Loader2 className="h-8 w-8 animate-spin text-[#E8541A]" />
    </div>
  )

  const lista: any[] = data?.lista ?? []
  const totalFirmados = data?.totalFirmados ?? 0
  const totalParticipantes = data?.totalParticipantes ?? 0
  const pct = totalParticipantes > 0 ? Math.round((totalFirmados / totalParticipantes) * 100) : 0

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href={`/actividades/${params.id}`}>
          <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-white">Acuerdos y Autorizaciones</h1>
          <p className="text-gray-400 mt-1">{data?.actividad?.nombre_curso}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={copiarUrl} className="border-white/10 text-gray-300">
            <Copy className="h-4 w-4 mr-2" />Copiar URL
          </Button>
          <Button size="sm" onClick={exportarExcel} disabled={!lista.length} className="bg-[#E8541A] hover:bg-[#E8541A]/90">
            <Download className="h-4 w-4 mr-2" />Exportar Excel
          </Button>
        </div>
      </div>

      {/* URL pública */}
      <Card className="glass-card border-white/10">
        <CardContent className="p-4 flex items-center gap-3">
          <span className="text-xs text-gray-400 uppercase tracking-wider shrink-0">Link de matrícula</span>
          <code className="flex-1 text-sm text-[#E8541A] bg-[#E8541A]/5 px-3 py-1.5 rounded font-mono truncate">{urlPublica}</code>
          <Button variant="outline" size="sm" onClick={copiarUrl} className="border-white/10 text-gray-300 shrink-0">
            <Copy className="h-4 w-4 mr-2" />Copiar
          </Button>
        </CardContent>
      </Card>

      {/* KPIs */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="glass-card border-white/10">
          <CardContent className="p-5">
            <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Firmados</p>
            <p className="text-3xl font-bold text-white">{totalFirmados}</p>
          </CardContent>
        </Card>
        <Card className="glass-card border-white/10">
          <CardContent className="p-5">
            <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Participantes</p>
            <p className="text-3xl font-bold text-white">{totalParticipantes}</p>
          </CardContent>
        </Card>
        <Card className="glass-card border-white/10">
          <CardContent className="p-5">
            <p className="text-xs text-gray-400 uppercase tracking-wider mb-2">% Firma</p>
            <p className="text-3xl font-bold text-white">{pct}%</p>
            <div className="h-1.5 bg-white/10 rounded-full mt-2 overflow-hidden">
              <div className="h-full bg-[#E8541A] rounded-full" style={{ width: `${pct}%` }} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabla */}
      <Card className="glass-card border-white/10">
        <CardContent className="p-0">
          {lista.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/5">
                    <th className="text-left text-gray-400 px-4 py-3">Nombre</th>
                    <th className="text-left text-gray-400 px-4 py-3">RUT</th>
                    <th className="text-left text-gray-400 px-4 py-3">Fecha firma</th>
                    <th className="text-left text-gray-400 px-4 py-3">IP</th>
                    <th className="text-center text-gray-400 px-4 py-3">Deberes</th>
                    <th className="text-center text-gray-400 px-4 py-3">Datos</th>
                    <th className="text-left text-gray-400 px-4 py-3">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {lista.map((a: any) => (
                    <tr key={a.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                      <td className="px-4 py-3 text-white font-medium">{a.nombre}</td>
                      <td className="px-4 py-3 text-gray-300 font-mono text-xs">{a.rut}</td>
                      <td className="px-4 py-3 text-gray-300 text-xs">{new Date(a.fecha).toLocaleString("es-CL")}</td>
                      <td className="px-4 py-3 text-gray-500 text-xs font-mono">{a.ip_address ?? "-"}</td>
                      <td className="px-4 py-3 text-center">
                        {a.acepta_deberes
                          ? <CheckCircle2 className="h-4 w-4 text-emerald-400 mx-auto" />
                          : <XCircle className="h-4 w-4 text-red-400 mx-auto" />}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {a.acepta_datos
                          ? <CheckCircle2 className="h-4 w-4 text-emerald-400 mx-auto" />
                          : <XCircle className="h-4 w-4 text-red-400 mx-auto" />}
                      </td>
                      <td className="px-4 py-3">
                        <Badge className="bg-[#16A34A] text-white text-xs">Firmado</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-16">
              <FileText className="h-12 w-12 mx-auto text-gray-600 mb-4" />
              <p className="text-gray-400">Nadie ha firmado el acuerdo aún</p>
              <p className="text-gray-500 text-sm mt-1">Comparte el link de acuerdo para que los participantes se matriculen</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
