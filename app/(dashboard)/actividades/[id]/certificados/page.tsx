"use client"

import { useEffect, useRef, useState } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { useToast } from "@/components/ui/use-toast"
import { ArrowLeft, Award, Download, Loader2, FileDown, Zap, Upload, X, Trash2 } from "lucide-react"

export default function CertificadosActividadPage() {
  const params = useParams()
  const { toast } = useToast()
  const [actividad, setActividad] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [generatingId, setGeneratingId] = useState("")
  const [progress, setProgress] = useState(0)

  // Multi-select
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [bulkDeleting, setBulkDeleting] = useState(false)
  const [bulkDownloading, setBulkDownloading] = useState(false)
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false)

  // Probetas dialog
  const [probetasOpen, setProbetasOpen] = useState(false)
  const [probetasPart, setProbetasPart] = useState<any>(null)
  const [foto1, setFoto1] = useState<File | null>(null)
  const [foto2, setFoto2] = useState<File | null>(null)
  const [preview1, setPreview1] = useState<string | null>(null)
  const [preview2, setPreview2] = useState<string | null>(null)
  const [generatingProbetas, setGeneratingProbetas] = useState(false)
  const input1Ref = useRef<HTMLInputElement>(null)
  const input2Ref = useRef<HTMLInputElement>(null)

  // Single delete dialog
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; cert: any | null; nombre: string }>({ open: false, cert: null, nombre: "" })
  const [deleting, setDeleting] = useState(false)

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
    a.href = url; a.download = filename; a.click()
    URL.revokeObjectURL(url)
  }

  // ── Selection helpers ──────────────────────────────────────────────────
  const certIds = (actividad?.participantes ?? [])
    .filter((p: any) => p.certificado)
    .map((p: any) => p.certificado.id as string)

  const allSelected = certIds.length > 0 && certIds.every((id: string) => selected.has(id))
  const someSelected = selected.size > 0

  const toggleAll = () => {
    if (allSelected) {
      setSelected(new Set())
    } else {
      setSelected(new Set(certIds))
    }
  }

  const toggleOne = (certId: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      next.has(certId) ? next.delete(certId) : next.add(certId)
      return next
    })
  }

  // ── Bulk download ──────────────────────────────────────────────────────
  const handleBulkDownload = async () => {
    setBulkDownloading(true)
    try {
      const res = await fetch("/api/certificados/zip/seleccionados", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ certificadoIds: Array.from(selected) }),
      })
      if (!res.ok) throw new Error("Error")
      downloadBlob(await res.blob(), `certificados_seleccionados_${new Date().toISOString().slice(0, 10)}.zip`)
      toast({ title: "ZIP descargado", description: `${selected.size} certificados incluidos.` })
    } catch {
      toast({ variant: "destructive", title: "Error", description: "No se pudo generar el ZIP." })
    } finally { setBulkDownloading(false) }
  }

  // ── Bulk delete ────────────────────────────────────────────────────────
  const handleBulkDelete = async () => {
    setBulkDeleting(true)
    try {
      await Promise.all(
        Array.from(selected).map((id) => fetch(`/api/certificados/${id}`, { method: "DELETE" }))
      )
      toast({ title: "Certificados eliminados", description: `${selected.size} certificados eliminados.` })
      setSelected(new Set())
      setBulkDeleteOpen(false)
      fetchData()
    } catch {
      toast({ variant: "destructive", title: "Error", description: "Error al eliminar certificados." })
    } finally { setBulkDeleting(false) }
  }

  // ── Foto helpers ───────────────────────────────────────────────────────
  const handleFotoChange = (file: File | null, setFoto: (f: File | null) => void, setPreview: (p: string | null) => void) => {
    if (!file) return
    if (!["image/jpeg", "image/png"].includes(file.type)) { toast({ variant: "destructive", title: "Formato inválido", description: "Solo JPG o PNG" }); return }
    if (file.size > 5 * 1024 * 1024) { toast({ variant: "destructive", title: "Archivo muy grande", description: "Max 5MB" }); return }
    setFoto(file); setPreview(URL.createObjectURL(file))
  }

  const openProbetasDialog = (participante: any) => { setProbetasPart(participante); setFoto1(null); setFoto2(null); setPreview1(null); setPreview2(null); setProbetasOpen(true) }
  const closeProbetasDialog = () => { setProbetasOpen(false); setProbetasPart(null) }

  const generar = async (participanteId: string) => {
    setGeneratingId(participanteId)
    try {
      const res = await fetch("/api/certificados/generar", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ participanteId }) })
      if (!res.ok) { const e = await res.json(); throw new Error(e.error) }
      const blob = await res.blob()
      downloadBlob(blob, `certificado-${res.headers.get("X-Certificado-Codigo") ?? "cert"}.pdf`)
      toast({ title: "Certificado generado", description: "PDF descargado exitosamente." })
      fetchData()
    } catch (err: any) {
      toast({ variant: "destructive", title: "Error", description: err.message || "Error al generar" })
    } finally { setGeneratingId("") }
  }

  const generarConFotos = async () => {
    if (!probetasPart || !foto1 || !foto2) return
    setGeneratingProbetas(true)
    try {
      const fd = new FormData()
      fd.append("participanteId", probetasPart.id); fd.append("foto_probeta_1", foto1); fd.append("foto_probeta_2", foto2)
      const res = await fetch("/api/certificados/generar", { method: "POST", body: fd })
      if (!res.ok) { const e = await res.json(); throw new Error(e.error) }
      downloadBlob(await res.blob(), `certificado-${res.headers.get("X-Certificado-Codigo") ?? "cert"}.pdf`)
      toast({ title: "Certificado generado", description: "PDF con fotos de probetas descargado." })
      closeProbetasDialog(); fetchData()
    } catch (err: any) {
      toast({ variant: "destructive", title: "Error", description: err.message || "Error al generar" })
    } finally { setGeneratingProbetas(false) }
  }

  const descargarPDF = async (certificadoId: string, codigo: string) => {
    const res = await fetch(`/api/certificados/${certificadoId}/pdf`)
    if (!res.ok) { toast({ variant: "destructive", title: "Error", description: "No se pudo descargar el PDF" }); return }
    downloadBlob(await res.blob(), `certificado-${codigo}.pdf`)
  }

  const handleDeleteCert = async () => {
    if (!deleteDialog.cert) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/certificados/${deleteDialog.cert.id}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Error")
      toast({ title: "Certificado eliminado", description: "El participante quedó en estado Pendiente." })
      setSelected((prev) => { const next = new Set(prev); next.delete(deleteDialog.cert.id); return next })
      setDeleteDialog({ open: false, cert: null, nombre: "" })
      fetchData()
    } catch {
      toast({ variant: "destructive", title: "Error", description: "No se pudo eliminar el certificado." })
    } finally { setDeleting(false) }
  }

  const generarMasivo = async () => {
    setGenerating(true); setProgress(0)
    try {
      const res = await fetch("/api/certificados/generar-masivo", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ actividadId: params.id }) })
      if (!res.ok) throw new Error("Error")
      const result = await res.json()
      setProgress(100)
      toast({ title: "Generación masiva completada", description: `${result.generated} certificados generados. ${result.errors} errores.` })
      fetchData()
    } catch {
      toast({ variant: "destructive", title: "Error", description: "Error en generación masiva" })
    } finally { setGenerating(false) }
  }

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-[#E8541A]" /></div>
  if (!actividad) return <div className="text-center py-20 text-gray-400">No encontrada</div>

  const esSoldadura = actividad.tipo_certificado === "SOLDADURA"
  const participantes = actividad.participantes || []
  const conCert = participantes.filter((p: any) => p.certificado)
  const sinCert = participantes.filter((p: any) => !p.certificado)

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href={`/actividades/${params.id}`}><Button variant="ghost" size="icon" className="text-gray-400 hover:text-white"><ArrowLeft className="h-5 w-5" /></Button></Link>
        <div className="flex-1"><h1 className="text-2xl font-bold text-white">Certificados</h1><p className="text-gray-400 mt-1">{actividad.nombre_curso}</p></div>
        <div className="flex gap-2">
          {sinCert.length > 0 && !esSoldadura && <Button onClick={generarMasivo} disabled={generating} className="bg-[#E8541A] hover:bg-[#E8541A]/90">{generating ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Generando...</> : <><Zap className="h-4 w-4 mr-2" />Generar Todos ({sinCert.length})</>}</Button>}
          {conCert.length > 0 && <a href={`/api/certificados/zip/${params.id}`}><Button variant="outline" className="border-white/10 text-gray-300"><FileDown className="h-4 w-4 mr-2" />Descargar ZIP</Button></a>}
        </div>
      </div>

      {generating && <Card className="glass-card border-white/10"><CardContent className="p-4"><p className="text-sm text-gray-400 mb-2">Generando certificados...</p><Progress value={progress} className="h-2" /></CardContent></Card>}

      {/* KPI cards */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="glass-card border-white/10"><CardContent className="p-4"><p className="text-xs text-gray-400">Emitidos</p><p className="text-2xl font-bold text-emerald-400">{conCert.length}</p></CardContent></Card>
        <Card className="glass-card border-white/10"><CardContent className="p-4"><p className="text-xs text-gray-400">Pendientes</p><p className="text-2xl font-bold text-amber-400">{sinCert.length}</p></CardContent></Card>
      </div>

      {/* Bulk action bar */}
      {someSelected && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-[#E8541A]/10 border border-[#E8541A]/20">
          <span className="text-sm text-[#E8541A] font-medium flex-1">{selected.size} seleccionado{selected.size !== 1 ? "s" : ""}</span>
          <Button size="sm" variant="outline" onClick={handleBulkDownload} disabled={bulkDownloading} className="border-white/20 text-gray-300 hover:text-white">
            {bulkDownloading ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <Download className="h-3.5 w-3.5 mr-1.5" />}
            Descargar seleccionados
          </Button>
          <Button size="sm" onClick={() => setBulkDeleteOpen(true)} className="bg-red-600 hover:bg-red-700 text-white">
            <Trash2 className="h-3.5 w-3.5 mr-1.5" />
            Eliminar seleccionados
          </Button>
        </div>
      )}

      {/* Main table */}
      <Card className="glass-card border-white/10">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-white/5">
                <TableHead className="w-10 pl-4">
                  {certIds.length > 0 && (
                    <input
                      type="checkbox"
                      checked={allSelected}
                      onChange={toggleAll}
                      className="h-4 w-4 rounded border-white/30 bg-transparent accent-[#E8541A] cursor-pointer"
                    />
                  )}
                </TableHead>
                <TableHead className="text-gray-400">Participante</TableHead>
                <TableHead className="text-gray-400">RUT</TableHead>
                <TableHead className="text-gray-400">Estado</TableHead>
                <TableHead className="text-gray-400">Código</TableHead>
                <TableHead className="text-gray-400">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {participantes.map((p: any) => {
                const certId = p.certificado?.id
                const isSelected = certId ? selected.has(certId) : false
                return (
                  <TableRow key={p.id} className={`border-white/5 transition-colors ${isSelected ? "bg-[#E8541A]/5" : ""}`}>
                    <TableCell className="pl-4">
                      {certId && (
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleOne(certId)}
                          className="h-4 w-4 rounded border-white/30 bg-transparent accent-[#E8541A] cursor-pointer"
                        />
                      )}
                    </TableCell>
                    <TableCell className="text-white font-medium">{p.nombre}</TableCell>
                    <TableCell className="text-gray-300">{p.rut}</TableCell>
                    <TableCell>{p.certificado ? <Badge className="bg-emerald-500/20 text-emerald-400">Emitido</Badge> : <Badge className="bg-amber-500/20 text-amber-400">Pendiente</Badge>}</TableCell>
                    <TableCell className="text-gray-300 font-mono text-xs">{p.certificado?.codigo || "-"}</TableCell>
                    <TableCell>
                      {p.certificado ? (
                        <div className="flex gap-1">
                          <Button variant="ghost" size="sm" className="text-gray-400 hover:text-[#E8541A]" onClick={() => descargarPDF(p.certificado.id, p.certificado.codigo)}><Download className="h-4 w-4" /></Button>
                          <Link href={`/verificar/${p.certificado.codigo}`} target="_blank"><Button variant="ghost" size="sm" className="text-gray-400 hover:text-blue-400">Ver</Button></Link>
                          <Button variant="ghost" size="sm" className="text-gray-400 hover:text-red-400" onClick={() => setDeleteDialog({ open: true, cert: p.certificado, nombre: p.nombre })}><Trash2 className="h-4 w-4" /></Button>
                        </div>
                      ) : (
                        <Button size="sm" variant="ghost" onClick={() => esSoldadura ? openProbetasDialog(p) : generar(p.id)} disabled={generatingId === p.id} className="text-[#E8541A] hover:text-[#E8541A]/80">
                          {generatingId === p.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Award className="h-4 w-4 mr-1" />Generar</>}
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Bulk delete dialog */}
      <Dialog open={bulkDeleteOpen} onOpenChange={(open) => { if (!open) setBulkDeleteOpen(false) }}>
        <DialogContent className="bg-[#1A1A1A] border-white/10 text-white max-w-md">
          <DialogHeader><DialogTitle className="text-white">Eliminar certificados</DialogTitle></DialogHeader>
          <p className="text-gray-300 text-sm">
            ¿Eliminar <span className="font-semibold text-white">{selected.size} certificado{selected.size !== 1 ? "s" : ""}</span>? Esta acción no se puede deshacer.
          </p>
          <DialogFooter className="gap-2">
            <Button variant="ghost" onClick={() => setBulkDeleteOpen(false)} disabled={bulkDeleting} className="text-gray-400">Cancelar</Button>
            <Button onClick={handleBulkDelete} disabled={bulkDeleting} className="bg-red-600 hover:bg-red-700 text-white">
              {bulkDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Trash2 className="h-4 w-4 mr-2" />Eliminar</>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Probetas dialog */}
      <Dialog open={probetasOpen} onOpenChange={(open) => { if (!open) closeProbetasDialog() }}>
        <DialogContent className="bg-[#1A1A1A] border-white/10 text-white max-w-md">
          <DialogHeader><DialogTitle className="text-white">Fotos de Probetas — {probetasPart?.nombre}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <p className="text-sm text-gray-400">Foto 1 <span className="text-red-400">*</span></p>
              <input ref={input1Ref} type="file" accept="image/jpeg,image/png" className="hidden" onChange={(e) => handleFotoChange(e.target.files?.[0] ?? null, setFoto1, setPreview1)} />
              {preview1 ? (
                <div className="relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={preview1} alt="Foto 1" className="w-full h-40 object-cover rounded-lg border border-white/10" />
                  <button onClick={() => { setFoto1(null); setPreview1(null) }} className="absolute top-2 right-2 p-1 bg-black/60 rounded-full hover:bg-black/80"><X className="h-4 w-4 text-white" /></button>
                </div>
              ) : (
                <button onClick={() => input1Ref.current?.click()} className="w-full h-32 border-2 border-dashed border-white/20 rounded-lg flex flex-col items-center justify-center gap-2 hover:border-[#E8541A]/50 hover:bg-[#E8541A]/5 transition-colors">
                  <Upload className="h-6 w-6 text-gray-400" /><span className="text-sm text-gray-400">Subir foto 1 (JPG/PNG, max 5MB)</span>
                </button>
              )}
            </div>
            <div className="space-y-2">
              <p className="text-sm text-gray-400">Foto 2 <span className="text-red-400">*</span></p>
              <input ref={input2Ref} type="file" accept="image/jpeg,image/png" className="hidden" onChange={(e) => handleFotoChange(e.target.files?.[0] ?? null, setFoto2, setPreview2)} />
              {preview2 ? (
                <div className="relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={preview2} alt="Foto 2" className="w-full h-40 object-cover rounded-lg border border-white/10" />
                  <button onClick={() => { setFoto2(null); setPreview2(null) }} className="absolute top-2 right-2 p-1 bg-black/60 rounded-full hover:bg-black/80"><X className="h-4 w-4 text-white" /></button>
                </div>
              ) : (
                <button onClick={() => input2Ref.current?.click()} className="w-full h-32 border-2 border-dashed border-white/20 rounded-lg flex flex-col items-center justify-center gap-2 hover:border-[#E8541A]/50 hover:bg-[#E8541A]/5 transition-colors">
                  <Upload className="h-6 w-6 text-gray-400" /><span className="text-sm text-gray-400">Subir foto 2 (JPG/PNG, max 5MB)</span>
                </button>
              )}
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="ghost" onClick={closeProbetasDialog} disabled={generatingProbetas} className="text-gray-400">Cancelar</Button>
            <Button onClick={generarConFotos} disabled={!foto1 || !foto2 || generatingProbetas} className="bg-[#E8541A] hover:bg-[#E8541A]/90">
              {generatingProbetas ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Generando...</> : "Generar Certificado"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Single delete dialog */}
      <Dialog open={deleteDialog.open} onOpenChange={(open) => { if (!open) setDeleteDialog({ open: false, cert: null, nombre: "" }) }}>
        <DialogContent className="bg-[#1A1A1A] border-white/10 text-white max-w-md">
          <DialogHeader><DialogTitle className="text-white">Eliminar Certificado</DialogTitle></DialogHeader>
          <p className="text-gray-300 text-sm">¿Eliminar el certificado de <span className="font-semibold text-white">{deleteDialog.nombre}</span>? El participante quedará en estado Pendiente.</p>
          <DialogFooter className="gap-2">
            <Button variant="ghost" onClick={() => setDeleteDialog({ open: false, cert: null, nombre: "" })} disabled={deleting} className="text-gray-400">Cancelar</Button>
            <Button onClick={handleDeleteCert} disabled={deleting} className="bg-red-600 hover:bg-red-700 text-white">
              {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Trash2 className="h-4 w-4 mr-2" />Eliminar</>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
