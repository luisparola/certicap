"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Plus, Search, Eye, BookOpen, Loader2, ChevronLeft, ChevronRight } from "lucide-react"

const TIPO_LABELS: Record<string, string> = {
  COMPETENCIAS: "Competencias",
  PUENTE_GRUA: "Puente Grua",
  RIGGER: "Rigger",
  SOLDADURA: "Soldadura",
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
  const [actividades, setActividades] = useState<Actividad[]>([])
  const [loading, setLoading] = useState(true)
  const [busqueda, setBusqueda] = useState("")
  const [tipo, setTipo] = useState("TODOS")
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

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
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchActividades()
  }, [tipo, page])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setPage(1)
    fetchActividades()
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Actividades</h1>
          <p className="text-gray-400 mt-1">Gestiona tus cursos y capacitaciones</p>
        </div>
        <Link href="/actividades/nueva">
          <Button className="bg-[#E8541A] hover:bg-[#E8541A]/90">
            <Plus className="h-4 w-4 mr-2" />
            Nueva Actividad
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <Card className="glass-card border-white/10">
        <CardContent className="p-4">
          <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar por nombre de curso o empresa..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="pl-10 bg-[#0F0F0F] border-white/10 text-white"
              />
            </div>
            <Select value={tipo} onValueChange={(v) => { setTipo(v); setPage(1) }}>
              <SelectTrigger className="w-full sm:w-48 bg-[#0F0F0F] border-white/10 text-white">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent className="bg-[#1A1A1A] border-white/10">
                <SelectItem value="TODOS">Todos los tipos</SelectItem>
                <SelectItem value="COMPETENCIAS">Competencias</SelectItem>
                <SelectItem value="PUENTE_GRUA">Puente Grua</SelectItem>
                <SelectItem value="RIGGER">Rigger</SelectItem>
                <SelectItem value="SOLDADURA">Soldadura</SelectItem>
              </SelectContent>
            </Select>
            <Button type="submit" variant="secondary" className="bg-white/5 hover:bg-white/10 text-white">
              Buscar
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="glass-card border-white/10">
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-[#E8541A]" />
            </div>
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
                      <TableCell>
                        <Badge className={`${TIPO_COLORS[a.tipo_certificado]} border`}>
                          {TIPO_LABELS[a.tipo_certificado]}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-gray-300">{a.empresa_nombre}</TableCell>
                      <TableCell className="text-gray-300">
                        {new Date(a.fecha_inicio).toLocaleDateString("es-CL")}
                      </TableCell>
                      <TableCell className="text-gray-300">
                        {new Date(a.fecha_termino).toLocaleDateString("es-CL")}
                      </TableCell>
                      <TableCell className="text-center text-gray-300">
                        {a._count.participantes}
                      </TableCell>
                      <TableCell>
                        <Link href={`/actividades/${a.id}`}>
                          <Button variant="ghost" size="sm" className="text-gray-400 hover:text-[#E8541A]">
                            <Eye className="h-4 w-4 mr-1" />
                            Ver
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 p-4 border-t border-white/5">
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={page <= 1}
                    onClick={() => setPage(page - 1)}
                    className="text-gray-400"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-sm text-gray-400">
                    Pagina {page} de {totalPages}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={page >= totalPages}
                    onClick={() => setPage(page + 1)}
                    className="text-gray-400"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
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
    </div>
  )
}
