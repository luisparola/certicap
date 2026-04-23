"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Search, Download, Eye, Loader2, ChevronLeft, ChevronRight, Filter, X } from "lucide-react"
import Link from "next/link"

const TIPO_LABELS: Record<string, string> = { COMPETENCIAS: "Competencias", PUENTE_GRUA: "Puente Grua", RIGGER: "Rigger", SOLDADURA: "Soldadura" }
const TIPO_COLORS: Record<string, string> = { COMPETENCIAS: "bg-blue-500/20 text-blue-400 border-blue-500/30", PUENTE_GRUA: "bg-purple-500/20 text-purple-400 border-purple-500/30", RIGGER: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30", SOLDADURA: "bg-amber-500/20 text-amber-400 border-amber-500/30" }

export default function BuscarCertificadosPage() {
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<any[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [showFilters, setShowFilters] = useState(true)
  const [filters, setFilters] = useState({
    nombre: "", rut: "", empresa: "", empresa_rut: "", curso: "",
    tipo: "", estado: "", anio: "", mes: "", codigo: "", nro_registro: "",
  })

  const handleSearch = async (p = 1) => {
    setLoading(true); setPage(p)
    const params = new URLSearchParams()
    params.set("page", String(p))
    Object.entries(filters).forEach(([k, v]) => { if (v) params.set(k, v) })
    try {
      const res = await fetch(`/api/certificados/buscar?${params}`)
      const data = await res.json()
      setResults(data.certificados || [])
      setTotal(data.total || 0)
      setTotalPages(data.pages || 1)
    } catch { } finally { setLoading(false) }
  }

  const clearFilters = () => {
    setFilters({ nombre: "", rut: "", empresa: "", empresa_rut: "", curso: "", tipo: "", estado: "", anio: "", mes: "", codigo: "", nro_registro: "" })
  }

  const currentYear = new Date().getFullYear()
  const years = Array.from({ length: 5 }, (_, i) => String(currentYear - i))
  const months = ["01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11", "12"]

  const inputCls = "bg-[#0F0F0F] border-white/10 text-white text-sm h-9"

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold text-white">Buscar Certificados</h1><p className="text-gray-400 mt-1">Busqueda avanzada con filtros combinables</p></div>
        <Button variant="ghost" onClick={() => setShowFilters(!showFilters)} className="text-gray-400"><Filter className="h-4 w-4 mr-2" />{showFilters ? "Ocultar" : "Mostrar"} Filtros</Button>
      </div>

      {showFilters && (
        <Card className="glass-card border-white/10">
          <CardContent className="p-4 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div><Label className="text-xs text-gray-400">Participante</Label><Input value={filters.nombre} onChange={(e) => setFilters(f => ({...f, nombre: e.target.value}))} placeholder="Nombre..." className={inputCls} /></div>
              <div><Label className="text-xs text-gray-400">RUT</Label><Input value={filters.rut} onChange={(e) => setFilters(f => ({...f, rut: e.target.value}))} placeholder="RUT..." className={inputCls} /></div>
              <div><Label className="text-xs text-gray-400">Empresa</Label><Input value={filters.empresa} onChange={(e) => setFilters(f => ({...f, empresa: e.target.value}))} placeholder="Empresa..." className={inputCls} /></div>
              <div><Label className="text-xs text-gray-400">RUT Empresa</Label><Input value={filters.empresa_rut} onChange={(e) => setFilters(f => ({...f, empresa_rut: e.target.value}))} placeholder="RUT empresa..." className={inputCls} /></div>
              <div><Label className="text-xs text-gray-400">Curso</Label><Input value={filters.curso} onChange={(e) => setFilters(f => ({...f, curso: e.target.value}))} placeholder="Curso..." className={inputCls} /></div>
              <div><Label className="text-xs text-gray-400">Tipo</Label><Select value={filters.tipo} onValueChange={(v) => setFilters(f => ({...f, tipo: v === "TODOS" ? "" : v}))}><SelectTrigger className={inputCls}><SelectValue placeholder="Todos" /></SelectTrigger><SelectContent className="bg-[#1A1A1A] border-white/10"><SelectItem value="TODOS">Todos</SelectItem><SelectItem value="COMPETENCIAS">Competencias</SelectItem><SelectItem value="PUENTE_GRUA">Puente Grua</SelectItem><SelectItem value="RIGGER">Rigger</SelectItem><SelectItem value="SOLDADURA">Soldadura</SelectItem></SelectContent></Select></div>
              <div><Label className="text-xs text-gray-400">Anio</Label><Select value={filters.anio} onValueChange={(v) => setFilters(f => ({...f, anio: v === "TODOS" ? "" : v}))}><SelectTrigger className={inputCls}><SelectValue placeholder="Todos" /></SelectTrigger><SelectContent className="bg-[#1A1A1A] border-white/10"><SelectItem value="TODOS">Todos</SelectItem>{years.map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}</SelectContent></Select></div>
              <div><Label className="text-xs text-gray-400">Codigo</Label><Input value={filters.codigo} onChange={(e) => setFilters(f => ({...f, codigo: e.target.value}))} placeholder="XXXX-YYYY-ZZZZ" className={inputCls} /></div>
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="ghost" onClick={clearFilters} className="text-gray-400"><X className="h-4 w-4 mr-1" />Limpiar</Button>
              <Button onClick={() => handleSearch(1)} className="bg-[#E8541A] hover:bg-[#E8541A]/90"><Search className="h-4 w-4 mr-2" />Buscar</Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="glass-card border-white/10">
        <CardHeader><CardTitle className="text-lg text-white">Resultados {total > 0 && <span className="text-sm font-normal text-gray-400">({total} encontrados)</span>}</CardTitle></CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-[#E8541A]" /></div>
          ) : results.length > 0 ? (
            <>
              <Table>
                <TableHeader><TableRow className="border-white/5"><TableHead className="text-gray-400">Participante</TableHead><TableHead className="text-gray-400">RUT</TableHead><TableHead className="text-gray-400">Empresa</TableHead><TableHead className="text-gray-400">Curso</TableHead><TableHead className="text-gray-400">Tipo</TableHead><TableHead className="text-gray-400">Emision</TableHead><TableHead className="text-gray-400">Vencimiento</TableHead><TableHead className="text-gray-400">Acciones</TableHead></TableRow></TableHeader>
                <TableBody>
                  {results.map((c: any) => (
                    <TableRow key={c.id} className="border-white/5">
                      <TableCell className="text-white font-medium">{c.participante.nombre}</TableCell>
                      <TableCell className="text-gray-300">{c.participante.rut}</TableCell>
                      <TableCell className="text-gray-300">{c.participante.actividad.empresa_nombre}</TableCell>
                      <TableCell className="text-gray-300">{c.participante.actividad.nombre_curso}</TableCell>
                      <TableCell><Badge className={`${TIPO_COLORS[c.participante.actividad.tipo_certificado]} border text-xs`}>{TIPO_LABELS[c.participante.actividad.tipo_certificado]}</Badge></TableCell>
                      <TableCell className="text-gray-300">{new Date(c.fecha_emision).toLocaleDateString("es-CL")}</TableCell>
                      <TableCell className="text-gray-300">{c.fecha_vencimiento ? new Date(c.fecha_vencimiento).toLocaleDateString("es-CL") : "-"}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {c.pdf_url && <a href={c.pdf_url} target="_blank"><Button variant="ghost" size="sm" className="text-gray-400 hover:text-[#E8541A]"><Download className="h-4 w-4" /></Button></a>}
                          <Link href={`/verificar/${c.codigo}`} target="_blank"><Button variant="ghost" size="sm" className="text-gray-400 hover:text-blue-400"><Eye className="h-4 w-4" /></Button></Link>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 p-4 border-t border-white/5">
                  <Button variant="ghost" size="sm" disabled={page <= 1} onClick={() => handleSearch(page - 1)} className="text-gray-400"><ChevronLeft className="h-4 w-4" /></Button>
                  <span className="text-sm text-gray-400">Pagina {page} de {totalPages}</span>
                  <Button variant="ghost" size="sm" disabled={page >= totalPages} onClick={() => handleSearch(page + 1)} className="text-gray-400"><ChevronRight className="h-4 w-4" /></Button>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-16"><Search className="h-10 w-10 mx-auto text-gray-600 mb-3" /><p className="text-gray-400">Usa los filtros para buscar certificados</p></div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
