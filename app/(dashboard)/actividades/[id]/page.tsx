"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { useToast } from "@/components/ui/use-toast"
import { ArrowLeft, Plus, Upload, Award, Loader2, Users, Pencil, Trash2 } from "lucide-react"

const TIPO_LABELS: Record<string, string> = { COMPETENCIAS: "Competencias", PUENTE_GRUA: "Puente Grua", RIGGER: "Rigger", SOLDADURA: "Soldadura" }
const TIPO_COLORS: Record<string, string> = { COMPETENCIAS: "bg-blue-500/20 text-blue-400 border-blue-500/30", PUENTE_GRUA: "bg-purple-500/20 text-purple-400 border-purple-500/30", RIGGER: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30", SOLDADURA: "bg-amber-500/20 text-amber-400 border-amber-500/30" }
const ESTADO_COLORS: Record<string, string> = { APROBADO: "bg-emerald-500/20 text-emerald-400", REPROBADO: "bg-red-500/20 text-red-400", PENDIENTE: "bg-yellow-500/20 text-yellow-400" }

export default function ActividadDetailPage() {
  const params = useParams()
  const { toast } = useToast()
  const [actividad, setActividad] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; part: any | null }>({ open: false, part: null })
  const [deleting, setDeleting] = useState(false)

  const fetchData = () => {
    fetch(`/api/actividades/${params.id}`)
      .then((r) => r.json())
      .then(setActividad)
      .catch(console.error)
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchData() }, [params.id])

  const handleDeletePart = async () => {
    if (!deleteDialog.part) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/actividades/${params.id}/participantes/${deleteDialog.part.id}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Error")
      toast({ title: "Participante eliminado" })
      setDeleteDialog({ open: false, part: null })
      fetchData()
    } catch {
      toast({ variant: "destructive", title: "Error", description: "No se pudo eliminar el participante." })
    } finally { setDeleting(false) }
  }

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-[#E8541A]" /></div>
  if (!actividad) return <div className="text-center py-20 text-gray-400">Actividad no encontrada</div>

  const participantes = actividad.participantes || []
  const conCert = participantes.filter((p: any) => p.certificado).length
  const sinCert = participantes.length - conCert

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-4">
        <Link href="/actividades"><Button variant="ghost" size="icon" className="text-gray-400 hover:text-white"><ArrowLeft className="h-5 w-5" /></Button></Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-white">{actividad.nombre_curso}</h1>
            <Badge className={`${TIPO_COLORS[actividad.tipo_certificado]} border`}>{TIPO_LABELS[actividad.tipo_certificado]}</Badge>
          </div>
          <p className="text-gray-400 mt-1">{actividad.empresa_nombre}</p>
        </div>
        <Link href={`/actividades/${params.id}/editar`}>
          <Button variant="outline" size="sm" className="border-white/10 text-gray-300 hover:text-white"><Pencil className="h-4 w-4 mr-2" />Editar</Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="glass-card border-white/10"><CardContent className="p-4"><p className="text-xs text-gray-400 uppercase tracking-wider">Periodo</p><p className="text-white mt-1">{new Date(actividad.fecha_inicio).toLocaleDateString("es-CL")} - {new Date(actividad.fecha_termino).toLocaleDateString("es-CL")}</p></CardContent></Card>
        <Card className="glass-card border-white/10"><CardContent className="p-4"><p className="text-xs text-gray-400 uppercase tracking-wider">Lugar</p><p className="text-white mt-1">{actividad.lugar}</p><p className="text-xs text-gray-400 uppercase tracking-wider mt-2">Instructor</p><p className="text-white mt-1">{actividad.instructor}</p></CardContent></Card>
        <Card className="glass-card border-white/10"><CardContent className="p-4"><p className="text-xs text-gray-400 uppercase tracking-wider">Empresa</p><p className="text-white mt-1">{actividad.empresa_nombre}</p><p className="text-sm text-gray-400">{actividad.empresa_rut}</p></CardContent></Card>
      </div>

      <Tabs defaultValue="participantes" className="space-y-4">
        <TabsList className="bg-[#1A1A1A] border border-white/10">
          <TabsTrigger value="participantes" className="data-[state=active]:bg-[#E8541A]/10 data-[state=active]:text-[#E8541A]"><Users className="h-4 w-4 mr-2" />Participantes ({participantes.length})</TabsTrigger>
          <TabsTrigger value="certificados" className="data-[state=active]:bg-[#E8541A]/10 data-[state=active]:text-[#E8541A]"><Award className="h-4 w-4 mr-2" />Certificados ({conCert})</TabsTrigger>
        </TabsList>

        <TabsContent value="participantes">
          <Card className="glass-card border-white/10">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg text-white">Participantes</CardTitle>
              <div className="flex gap-2">
                <Link href={`/actividades/${params.id}/participantes/carga-masiva`}><Button variant="outline" size="sm" className="border-white/10 text-gray-300"><Upload className="h-4 w-4 mr-2" />Carga Masiva</Button></Link>
                <Link href={`/actividades/${params.id}/participantes/nuevo`}><Button size="sm" className="bg-[#E8541A] hover:bg-[#E8541A]/90"><Plus className="h-4 w-4 mr-2" />Agregar</Button></Link>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {participantes.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow className="border-white/5">
                      <TableHead className="text-gray-400">Nombre</TableHead>
                      <TableHead className="text-gray-400">RUT</TableHead>
                      <TableHead className="text-gray-400">Teoria</TableHead>
                      <TableHead className="text-gray-400">Practica</TableHead>
                      <TableHead className="text-gray-400">Asistencia</TableHead>
                      <TableHead className="text-gray-400">Estado</TableHead>
                      <TableHead className="text-gray-400">Certificado</TableHead>
                      <TableHead className="text-gray-400">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {participantes.map((p: any) => (
                      <TableRow key={p.id} className="border-white/5">
                        <TableCell className="text-white font-medium">{p.nombre}</TableCell>
                        <TableCell className="text-gray-300">{p.rut}</TableCell>
                        <TableCell className="text-gray-300">{p.nota_teoria ?? "-"}</TableCell>
                        <TableCell className="text-gray-300">{p.nota_practica ?? "-"}</TableCell>
                        <TableCell className="text-gray-300">{p.asistencia_pct ? `${p.asistencia_pct}%` : "-"}</TableCell>
                        <TableCell><Badge className={ESTADO_COLORS[p.estado]}>{p.estado}</Badge></TableCell>
                        <TableCell>{p.certificado ? <Badge className="bg-emerald-500/20 text-emerald-400">Emitido</Badge> : <Badge className="bg-gray-500/20 text-gray-400">Pendiente</Badge>}</TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Link href={`/actividades/${params.id}/participantes/${p.id}/editar`}>
                              <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white"><Pencil className="h-4 w-4" /></Button>
                            </Link>
                            <Button variant="ghost" size="sm" className="text-gray-400 hover:text-red-400" onClick={() => setDeleteDialog({ open: true, part: p })}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-12"><Users className="h-10 w-10 mx-auto text-gray-600 mb-3" /><p className="text-gray-400">No hay participantes registrados</p></div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="certificados">
          <Card className="glass-card border-white/10">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg text-white">Certificados</CardTitle>
              <Link href={`/actividades/${params.id}/certificados`}><Button className="bg-[#E8541A] hover:bg-[#E8541A]/90"><Award className="h-4 w-4 mr-2" />Gestionar Certificados</Button></Link>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-lg bg-emerald-500/5 border border-emerald-500/10"><p className="text-xs text-gray-400">Emitidos</p><p className="text-2xl font-bold text-emerald-400">{conCert}</p></div>
                <div className="p-4 rounded-lg bg-amber-500/5 border border-amber-500/10"><p className="text-xs text-gray-400">Pendientes</p><p className="text-2xl font-bold text-amber-400">{sinCert}</p></div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={deleteDialog.open} onOpenChange={(open) => { if (!open) setDeleteDialog({ open: false, part: null }) }}>
        <DialogContent className="bg-[#1A1A1A] border-white/10 text-white max-w-md">
          <DialogHeader><DialogTitle className="text-white">Eliminar Participante</DialogTitle></DialogHeader>
          <p className="text-gray-300 text-sm">
            ¿Eliminar a <span className="font-semibold text-white">{deleteDialog.part?.nombre}</span>? Se eliminará también su certificado si tiene uno.
          </p>
          <DialogFooter className="gap-2">
            <Button variant="ghost" onClick={() => setDeleteDialog({ open: false, part: null })} disabled={deleting} className="text-gray-400">Cancelar</Button>
            <Button onClick={handleDeletePart} disabled={deleting} className="bg-red-600 hover:bg-red-700 text-white">
              {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Trash2 className="h-4 w-4 mr-2" />Eliminar</>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
