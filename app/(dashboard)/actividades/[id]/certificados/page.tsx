"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useToast } from "@/components/ui/use-toast"
import { ArrowLeft, Award, Download, Loader2, FileDown, Zap } from "lucide-react"

export default function CertificadosActividadPage() {
  const params = useParams()
  const { toast } = useToast()
  const [actividad, setActividad] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [generatingId, setGeneratingId] = useState("")
  const [progress, setProgress] = useState(0)

  const fetchData = async () => {
    const res = await fetch(`/api/actividades/${params.id}`)
    const data = await res.json()
    setActividad(data)
    setLoading(false)
  }

  useEffect(() => { fetchData() }, [params.id])

  const downloadBlob = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  }

  const generar = async (participanteId: string) => {
    setGeneratingId(participanteId)
    try {
      const res = await fetch("/api/certificados/generar", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ participanteId }),
      })
      if (!res.ok) { const e = await res.json(); throw new Error(e.error) }
      const blob = await res.blob()
      const codigo = res.headers.get("X-Certificado-Codigo") ?? "certificado"
      downloadBlob(blob, `certificado-${codigo}.pdf`)
      toast({ title: "Certificado generado", description: "PDF descargado exitosamente." })
      fetchData()
    } catch (err: any) {
      toast({ variant: "destructive", title: "Error", description: err.message || "Error al generar" })
    } finally { setGeneratingId("") }
  }

  const descargarPDF = async (certificadoId: string, codigo: string) => {
    const res = await fetch(`/api/certificados/${certificadoId}/pdf`)
    if (!res.ok) { toast({ variant: "destructive", title: "Error", description: "No se pudo descargar el PDF" }); return }
    const blob = await res.blob()
    downloadBlob(blob, `certificado-${codigo}.pdf`)
  }

  const generarMasivo = async () => {
    setGenerating(true); setProgress(0)
    try {
      const res = await fetch("/api/certificados/generar-masivo", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ actividadId: params.id }),
      })
      if (!res.ok) throw new Error("Error")
      const result = await res.json()
      setProgress(100)
      toast({ title: "Generacion masiva completada", description: `${result.generated} certificados generados. ${result.errors} errores.` })
      fetchData()
    } catch {
      toast({ variant: "destructive", title: "Error", description: "Error en generacion masiva" })
    } finally { setGenerating(false) }
  }

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-[#E8541A]" /></div>
  if (!actividad) return <div className="text-center py-20 text-gray-400">No encontrada</div>

  const participantes = actividad.participantes || []
  const conCert = participantes.filter((p: any) => p.certificado)
  const sinCert = participantes.filter((p: any) => !p.certificado)

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-4">
        <Link href={`/actividades/${params.id}`}><Button variant="ghost" size="icon" className="text-gray-400 hover:text-white"><ArrowLeft className="h-5 w-5" /></Button></Link>
        <div className="flex-1"><h1 className="text-2xl font-bold text-white">Certificados</h1><p className="text-gray-400 mt-1">{actividad.nombre_curso}</p></div>
        <div className="flex gap-2">
          {sinCert.length > 0 && <Button onClick={generarMasivo} disabled={generating} className="bg-[#E8541A] hover:bg-[#E8541A]/90">{generating ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Generando...</> : <><Zap className="h-4 w-4 mr-2" />Generar Todos ({sinCert.length})</>}</Button>}
          {conCert.length > 0 && <a href={`/api/certificados/zip/${params.id}`}><Button variant="outline" className="border-white/10 text-gray-300"><FileDown className="h-4 w-4 mr-2" />Descargar ZIP</Button></a>}
        </div>
      </div>

      {generating && <Card className="glass-card border-white/10"><CardContent className="p-4"><p className="text-sm text-gray-400 mb-2">Generando certificados...</p><Progress value={progress} className="h-2" /></CardContent></Card>}

      <div className="grid grid-cols-2 gap-4">
        <Card className="glass-card border-white/10"><CardContent className="p-4"><p className="text-xs text-gray-400">Emitidos</p><p className="text-2xl font-bold text-emerald-400">{conCert.length}</p></CardContent></Card>
        <Card className="glass-card border-white/10"><CardContent className="p-4"><p className="text-xs text-gray-400">Pendientes</p><p className="text-2xl font-bold text-amber-400">{sinCert.length}</p></CardContent></Card>
      </div>

      <Card className="glass-card border-white/10">
        <CardContent className="p-0">
          <Table>
            <TableHeader><TableRow className="border-white/5"><TableHead className="text-gray-400">Participante</TableHead><TableHead className="text-gray-400">RUT</TableHead><TableHead className="text-gray-400">Estado</TableHead><TableHead className="text-gray-400">Codigo</TableHead><TableHead className="text-gray-400">Acciones</TableHead></TableRow></TableHeader>
            <TableBody>
              {participantes.map((p: any) => (
                <TableRow key={p.id} className="border-white/5">
                  <TableCell className="text-white font-medium">{p.nombre}</TableCell>
                  <TableCell className="text-gray-300">{p.rut}</TableCell>
                  <TableCell>{p.certificado ? <Badge className="bg-emerald-500/20 text-emerald-400">Emitido</Badge> : <Badge className="bg-amber-500/20 text-amber-400">Pendiente</Badge>}</TableCell>
                  <TableCell className="text-gray-300 font-mono text-xs">{p.certificado?.codigo || "-"}</TableCell>
                  <TableCell>
                    {p.certificado ? (
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm" className="text-gray-400 hover:text-[#E8541A]" onClick={() => descargarPDF(p.certificado.id, p.certificado.codigo)}><Download className="h-4 w-4" /></Button>
                        <Link href={`/verificar/${p.certificado.codigo}`} target="_blank"><Button variant="ghost" size="sm" className="text-gray-400 hover:text-blue-400">Ver</Button></Link>
                      </div>
                    ) : (
                      <Button size="sm" variant="ghost" onClick={() => generar(p.id)} disabled={generatingId === p.id} className="text-[#E8541A] hover:text-[#E8541A]/80">{generatingId === p.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Award className="h-4 w-4 mr-1" />Generar</>}</Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
