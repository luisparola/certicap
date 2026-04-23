"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import * as XLSX from "xlsx"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useToast } from "@/components/ui/use-toast"
import { validarRut } from "@/lib/rut"
import { ArrowLeft, Download, Upload, Loader2, CheckCircle, XCircle, FileSpreadsheet } from "lucide-react"

interface ParsedRow {
  data: Record<string, any>
  valid: boolean
  errors: string[]
}

export default function CargaMasivaPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [importing, setImporting] = useState(false)
  const [rows, setRows] = useState<ParsedRow[]>([])
  const [tipoActividad, setTipoActividad] = useState("")

  useEffect(() => {
    fetch(`/api/actividades/${params.id}`)
      .then((r) => r.json())
      .then((d) => setTipoActividad(d.tipo_certificado))
      .catch(console.error)
  }, [params.id])

  const downloadTemplate = () => {
    window.open(`/api/actividades/${params.id}/participantes/plantilla`, "_blank")
  }

  const get = (row: Record<string, any>, key: string): any => {
    const found = Object.keys(row).find((k) => k.trim().toLowerCase() === key.toLowerCase())
    return found ? row[found] : undefined
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (evt) => {
      const data = new Uint8Array(evt.target?.result as ArrayBuffer)
      const wb = XLSX.read(data, { type: "array" })
      const ws = wb.Sheets[wb.SheetNames[0]]
      const json = XLSX.utils.sheet_to_json<Record<string, any>>(ws)
      if (json.length > 0) console.log("Headers encontrados:", Object.keys(json[0]))
      const validEstados = ["APROBADO", "REPROBADO", "PENDIENTE"]
      const parsed: ParsedRow[] = json.map((row) => {
        const errors: string[] = []
        if (!get(row, "NOMBRE")) errors.push("Nombre requerido")
        if (!get(row, "RUT")) errors.push("RUT requerido")
        else if (!validarRut(String(get(row, "RUT")))) errors.push("RUT invalido")
        const estado = get(row, "ESTADO")
        if (estado && !validEstados.includes(String(estado).toUpperCase())) errors.push("Estado invalido")
        return { data: row, valid: errors.length === 0, errors }
      })
      setRows(parsed)
    }
    reader.readAsArrayBuffer(file)
  }

  const validRows = rows.filter((r) => r.valid)
  const invalidRows = rows.filter((r) => !r.valid)

  const handleImport = async () => {
    if (validRows.length === 0) return
    setImporting(true)
    try {
      const participantes = validRows.map((r) => ({
        nombre: get(r.data, "NOMBRE"), rut: String(get(r.data, "RUT")),
        nota_teoria: get(r.data, "NOTA_TEORIA") || null,
        nota_practica: get(r.data, "NOTA_PRACTICA") || null,
        asistencia_pct: get(r.data, "ASISTENCIA_PCT") || null,
        nro_registro: get(r.data, "NRO_REGISTRO") ? String(get(r.data, "NRO_REGISTRO")) : null,
        estado: String(get(r.data, "ESTADO") || "PENDIENTE").toUpperCase(),
        marca_equipo: get(r.data, "MARCA_EQUIPO") || null,
        modelo_equipo: get(r.data, "MODELO_EQUIPO") || null,
        capacidad_equipo: get(r.data, "CAPACIDAD_EQUIPO") || null,
        senales: get(r.data, "SENALES") || null,
      }))
      const res = await fetch(`/api/actividades/${params.id}/participantes/bulk`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ participantes }),
      })
      if (!res.ok) throw new Error("Error")
      const result = await res.json()
      toast({ title: "Importacion exitosa", description: `${result.count} participantes importados.` })
      router.push(`/actividades/${params.id}`)
    } catch {
      toast({ variant: "destructive", title: "Error", description: "No se pudo importar." })
    } finally { setImporting(false) }
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-fade-in">
      <div className="flex items-center gap-4">
        <Link href={`/actividades/${params.id}`}><Button variant="ghost" size="icon" className="text-gray-400 hover:text-white"><ArrowLeft className="h-5 w-5" /></Button></Link>
        <div><h1 className="text-2xl font-bold text-white">Carga Masiva</h1><p className="text-gray-400 mt-1">Importar participantes desde Excel</p></div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="glass-card border-white/10">
          <CardContent className="p-6 text-center">
            <FileSpreadsheet className="h-10 w-10 mx-auto text-emerald-400 mb-3" />
            <h3 className="text-white font-medium mb-2">1. Descargar Plantilla</h3>
            <p className="text-gray-400 text-sm mb-4">Descarga la plantilla con las columnas correctas</p>
            <Button variant="outline" onClick={downloadTemplate} className="border-white/10 text-gray-300"><Download className="h-4 w-4 mr-2" />Descargar Plantilla</Button>
          </CardContent>
        </Card>
        <Card className="glass-card border-white/10">
          <CardContent className="p-6 text-center">
            <Upload className="h-10 w-10 mx-auto text-blue-400 mb-3" />
            <h3 className="text-white font-medium mb-2">2. Subir Excel</h3>
            <p className="text-gray-400 text-sm mb-4">Sube el archivo completado con los datos</p>
            <label className="cursor-pointer"><input type="file" accept=".xlsx,.xls" onChange={handleFileUpload} className="hidden" /><span className="inline-flex items-center justify-center h-10 px-4 rounded-md border border-white/10 text-gray-300 text-sm hover:bg-white/5 transition-colors"><Upload className="h-4 w-4 mr-2" />Seleccionar Archivo</span></label>
          </CardContent>
        </Card>
      </div>

      {rows.length > 0 && (
        <>
          <div className="flex items-center gap-4">
            <Badge className="bg-emerald-500/20 text-emerald-400"><CheckCircle className="h-3 w-3 mr-1" />{validRows.length} validas</Badge>
            {invalidRows.length > 0 && <Badge className="bg-red-500/20 text-red-400"><XCircle className="h-3 w-3 mr-1" />{invalidRows.length} con errores</Badge>}
          </div>
          <Card className="glass-card border-white/10">
            <CardContent className="p-0">
              <Table>
                <TableHeader><TableRow className="border-white/5"><TableHead className="text-gray-400">#</TableHead><TableHead className="text-gray-400">Nombre</TableHead><TableHead className="text-gray-400">RUT</TableHead><TableHead className="text-gray-400">Estado</TableHead><TableHead className="text-gray-400">Validacion</TableHead></TableRow></TableHeader>
                <TableBody>
                  {rows.map((row, i) => (
                    <TableRow key={i} className={`border-white/5 ${row.valid ? "" : "bg-red-500/5"}`}>
                      <TableCell className="text-gray-400">{i + 1}</TableCell>
                      <TableCell className="text-white">{get(row.data, "NOMBRE") || "-"}</TableCell>
                      <TableCell className="text-gray-300">{get(row.data, "RUT") || "-"}</TableCell>
                      <TableCell className="text-gray-300">{get(row.data, "ESTADO") || "PENDIENTE"}</TableCell>
                      <TableCell>{row.valid ? <Badge className="bg-emerald-500/20 text-emerald-400">OK</Badge> : <span className="text-xs text-red-400">{row.errors.join(", ")}</span>}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
          <div className="flex justify-end">
            <Button onClick={handleImport} className="bg-[#E8541A] hover:bg-[#E8541A]/90" disabled={importing || validRows.length === 0}>{importing ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Importando...</> : <>Importar {validRows.length} filas validas</>}</Button>
          </div>
        </>
      )}
    </div>
  )
}
