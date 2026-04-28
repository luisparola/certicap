"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { useToast } from "@/components/ui/use-toast"
import { Loader2, ClipboardList, Settings, Trash2 } from "lucide-react"

const TIPO_LABELS: Record<string, string> = {
  COMPETENCIAS: "Competencias", PUENTE_GRUA: "Puente Grua", RIGGER: "Rigger", SOLDADURA: "Soldadura",
}

export default function EncuestasPage() {
  const { toast } = useToast()
  const [actividades, setActividades] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; actividadId: string; nombre: string }>({ open: false, actividadId: "", nombre: "" })
  const [deleting, setDeleting] = useState(false)

  const load = async () => {
    let all: any[] = []
    let page = 1
    while (true) {
      const res = await fetch(`/api/actividades?page=${page}&limit=100`)
      const data = await res.json()
      all = all.concat(data.actividades || [])
      if (page >= (data.pages || 1)) break
      page++
    }
    const withEncuesta = await Promise.all(
      all.map(async (a) => {
        const res = await fetch(`/api/encuestas/${a.id}`)
        const data = await res.json()
        return { ...a, encuesta: data.encuesta, stats: data.stats }
      })
    )
    setActividades(withEncuesta)
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const handleDelete = async () => {
    setDeleting(true)
    try {
      const res = await fetch(`/api/encuestas/${deleteDialog.actividadId}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Error")
      toast({ title: "Encuesta eliminada" })
      setDeleteDialog({ open: false, actividadId: "", nombre: "" })
      setLoading(true)
      load()
    } catch {
      toast({ variant: "destructive", title: "Error", description: "No se pudo eliminar la encuesta." })
    } finally { setDeleting(false) }
  }

  const estadoBadge = (a: any) => {
    if (!a.encuesta) return <Badge className="bg-[#DC2626] text-white">Sin crear</Badge>
    if (a.encuesta.activa) return <Badge className="bg-[#16A34A] text-white">Activa</Badge>
    return <Badge className="bg-[#6B7280] text-white">Inactiva</Badge>
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-white">Encuestas de Satisfacción</h1>
        <p className="text-gray-400 mt-1">Gestiona las encuestas de cada actividad</p>
      </div>

      <Card className="glass-card border-white/10">
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-[#E8541A]" /></div>
          ) : actividades.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow className="border-white/5 hover:bg-transparent">
                  <TableHead className="text-gray-400">Actividad</TableHead>
                  <TableHead className="text-gray-400">Tipo</TableHead>
                  <TableHead className="text-gray-400">Empresa</TableHead>
                  <TableHead className="text-gray-400">Estado Encuesta</TableHead>
                  <TableHead className="text-gray-400 text-center">Respuestas</TableHead>
                  <TableHead className="text-gray-400">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {actividades.map((a) => (
                  <TableRow key={a.id} className="border-white/5">
                    <TableCell className="text-white font-medium">{a.nombre_curso}</TableCell>
                    <TableCell className="text-gray-300 text-sm">{TIPO_LABELS[a.tipo_certificado]}</TableCell>
                    <TableCell className="text-gray-300 text-sm">{a.empresa_nombre}</TableCell>
                    <TableCell>{estadoBadge(a)}</TableCell>
                    <TableCell className="text-center text-gray-300">
                      {a.encuesta ? `${a.stats?.totalRespuestas ?? 0} / ${a.stats?.totalParticipantes ?? 0}` : "-"}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Link href={`/actividades/${a.id}/encuesta`}>
                          <Button variant="ghost" size="sm" className="text-gray-400 hover:text-[#E8541A]">
                            <Settings className="h-4 w-4 mr-1" />Gestionar
                          </Button>
                        </Link>
                        {a.encuesta && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-gray-400 hover:text-red-400"
                            onClick={() => setDeleteDialog({ open: true, actividadId: a.id, nombre: a.nombre_curso })}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-16">
              <ClipboardList className="h-12 w-12 mx-auto text-gray-600 mb-4" />
              <p className="text-gray-400">No hay actividades registradas</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={deleteDialog.open} onOpenChange={(open) => { if (!open) setDeleteDialog({ open: false, actividadId: "", nombre: "" }) }}>
        <DialogContent className="bg-[#1A1A1A] border-white/10 text-white max-w-md">
          <DialogHeader><DialogTitle className="text-white">Eliminar Encuesta</DialogTitle></DialogHeader>
          <p className="text-gray-300 text-sm">
            ¿Eliminar la encuesta de <span className="font-semibold text-white">{deleteDialog.nombre}</span>? Se eliminarán todas las respuestas.
          </p>
          <DialogFooter className="gap-2">
            <Button variant="ghost" onClick={() => setDeleteDialog({ open: false, actividadId: "", nombre: "" })} disabled={deleting} className="text-gray-400">Cancelar</Button>
            <Button onClick={handleDelete} disabled={deleting} className="bg-red-600 hover:bg-red-700 text-white">
              {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Trash2 className="h-4 w-4 mr-2" />Eliminar</>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
