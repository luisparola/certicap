"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { useToast } from "@/components/ui/use-toast"
import { Plus, Search, Eye, BookOpen, Loader2, ChevronLeft, ChevronRight, Pencil, Trash2 } from "lucide-react"

const TIPO_LABELS: Record<string, string> = {
  COMPETENCIAS: "Competencias", PUENTE_GRUA: "Puente Grua", RIGGER: "Rigger", SOLDADURA: "Soldadura",
}
const TIPO_COLORS: Record<string, string> = {
  COMPETENCIAS: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  PUENTE_GRUA: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  RIGGER: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  SOLDADURA: "bg-amber-500/20 text-amber-400 border-amber-500/30",
}

interface Actividad {
  id: string
  nombre_curso: string
  tipo_certificado: string
  empresa_nombre: string
  fecha_inicio: string
  fecha_termino: string
  _count: { participantes: number }
}

export default function ActividadesPage() {
  const { toast } = useToast()
  const [actividades, setActividades] = useState<Actividad[]>([])
  const [loading, setLoading] = useState(true)
  const [busqueda, setBusqueda] = useState("")
  const [tipo, setTipo] = useState("TODOS")
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; actividad: Actividad | null }>({ open: false, actividad: null })
  const [deleting, setDeleting] = useState(false)

  const fetchActividades = async () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (tipo && tipo !== "TODOS") params.set("tipo", tipo)
    if (busqueda) params.set("busqueda", busqueda)
    params.set("page", String(page))
    try {
      const res = await fetch(`/api/actividades?${params}`)
      const data = await res.json()
      setActividades(data.actividades || [])
      setTotalPages(data.pages || 1)
    } catch (error) {
      console.error("Error:", error)
    } finally { setLoading(false) }
  }

  useEffect(() => { fetchActividades() }, [tipo, page])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault(); setPage(1); fetchActividades()
  }

  const handleDelete = async () => {
    if (!deleteDialog.actividad) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/actividades/${deleteDialog.actividad.id}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Error")
      toast({ title: "Actividad eliminada", description: "La actividad y sus datos han sido eliminados." })
      setDeleteDialog({ open: false, actividad: null })
      fetchActividades()
    } catch {
      toast({ variant: "destructive", title: "Error", description: "No se pudo eliminar la actividad." })
    } finally { setDeleting(false) }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Actividades</h1>
          <p className="text-gray-400 mt-1">Gestiona tus cursos y capacitaciones</p>
        </div>
        <Link href="/actividades/nueva">
          <Button className="bg-[#E8541A] hover:bg-[#E8541A]/90"><Plus className="h-4 w-4 mr-2" />Nueva Actividad</Button>
        </Link>
      </div>

      <Card className="glass-card border-white/10">
        <CardContent className="p-4">
          <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input placeholder="Buscar por nombre de curso o empresa..." value={busqueda} onChange={(e) => setBusqueda(e.target.value)} className="pl-10 bg-[#0F0F0F] border-white/10 text-white" />
            </div>
            <Select value={tipo} onValueChange={(v) => { setTipo(v); setPage(1) }}>
              <SelectTrigger className="w-full sm:w-48 bg-[#0F0F0F] border-white/10 text-white"><SelectValue placeholder="Tipo" /></SelectTrigger>
              <SelectContent className="bg-[#1A1A1A] border-white/10">
                <SelectItem value="TODOS">Todos los tipos</SelectItem>
                <SelectItem value="COMPETENCIAS">Competencias</SelectItem>
                <SelectItem value="PUENTE_GRUA">Puente Grua</SelectItem>
                <SelectItem value="RIGGER">Rigger</SelectItem>
                <SelectItem value="SOLDADURA">Soldadura</SelectItem>
              </SelectContent>
            </Select>
            <Button type="submit" variant="secondary" className="bg-white/5 hover:bg-white/10 text-white">Buscar</Button>
          </form>
        </CardContent>
      </Card>

      <Card className="glass-card border-white/10">
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-[#E8541A]" /></div>
          ) : actividades.length > 0 ? (
            <>
              <Table>
                <TableHeader>
                  <TableRow className="border-white/5 hover:bg-transparent">
                    <TableHead className="text-gray-400">Nombre del Curso</TableHead>
                    <TableHead className="text-gray-400">Tipo</TableHead>
                    <TableHead className="text-gray-400">Empresa</TableHead>
                    <TableHead className="text-gray-400">Fecha Inicio</TableHead>
                    <TableHead className="text-gray-400">Fecha Termino</TableHead>
                    <TableHead className="text-gray-400 text-center">Participantes</TableHead>
                    <TableHead className="text-gray-400">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {actividades.map((a) => (
                    <TableRow key={a.id} className="border-white/5">
                      <TableCell className="text-white font-medium">{a.nombre_curso}</TableCell>
                      <TableCell><Badge className={`${TIPO_COLORS[a.tipo_certificado]} border`}>{TIPO_LABELS[a.tipo_certificado]}</Badge></TableCell>
                      <TableCell className="text-gray-300">{a.empresa_nombre}</TableCell>
                      <TableCell className="text-gray-300">{new Date(a.fecha_inicio).toLocaleDateString("es-CL")}</TableCell>
                      <TableCell className="text-gray-300">{new Date(a.fecha_termino).toLocaleDateString("es-CL")}</TableCell>
                      <TableCell className="text-center text-gray-300">{a._count.participantes}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Link href={`/actividades/${a.id}`}><Button variant="ghost" size="sm" className="text-gray-400 hover:text-[#E8541A]"><Eye className="h-4 w-4" /></Button></Link>
                          <Link href={`/actividades/${a.id}/editar`}><Button variant="ghost" size="sm" className="text-gray-400 hover:text-white"><Pencil className="h-4 w-4" /></Button></Link>
                          <Button variant="ghost" size="sm" className="text-gray-400 hover:text-red-400" onClick={() => setDeleteDialog({ open: true, actividad: a })}><Trash2 className="h-4 w-4" /></Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 p-4 border-t border-white/5">
                  <Button variant="ghost" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)} className="text-gray-400"><ChevronLeft className="h-4 w-4" /></Button>
                  <span className="text-sm text-gray-400">Pagina {page} de {totalPages}</span>
                  <Button variant="ghost" size="sm" disabled={page >= totalPages} onClick={() => setPage(page + 1)} className="text-gray-400"><ChevronRight className="h-4 w-4" /></Button>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-16">
              <BookOpen className="h-12 w-12 mx-auto text-gray-600 mb-4" />
              <p className="text-gray-400">No se encontraron actividades</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={deleteDialog.open} onOpenChange={(open) => { if (!open) setDeleteDialog({ open: false, actividad: null }) }}>
        <DialogContent className="bg-[#1A1A1A] border-white/10 text-white max-w-md">
          <DialogHeader><DialogTitle className="text-white">Eliminar Actividad</DialogTitle></DialogHeader>
          <p className="text-gray-300 text-sm">
            ¿Eliminar <span className="font-semibold text-white">{deleteDialog.actividad?.nombre_curso}</span>? Se eliminarán todos sus participantes y certificados.
          </p>
          <DialogFooter className="gap-2">
            <Button variant="ghost" onClick={() => setDeleteDialog({ open: false, actividad: null })} disabled={deleting} className="text-gray-400">Cancelar</Button>
            <Button onClick={handleDelete} disabled={deleting} className="bg-red-600 hover:bg-red-700 text-white">
              {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Trash2 className="h-4 w-4 mr-2" />Eliminar</>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
