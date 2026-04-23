"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  BookOpen,
  Award,
  AlertTriangle,
  XCircle,
  Plus,
  Eye,
  Loader2,
} from "lucide-react"

interface DashboardData {
  kpis: {
    totalActividades: number
    totalCertificados: number
    certificadosProximosVencer: number
    certificadosVencidos: number
  }
  actividadesRecientes: Array<{
    id: string
    nombre_curso: string
    tipo_certificado: string
    empresa_nombre: string
    fecha_inicio: string
    participantes: number
  }>
}

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

export default function DashboardPage() {
  const { data: session } = useSession()
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/dashboard")
      .then((res) => res.json())
      .then((d) => setData(d))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-[#E8541A]" />
      </div>
    )
  }

  const kpis = data?.kpis || {
    totalActividades: 0,
    totalCertificados: 0,
    certificadosProximosVencer: 0,
    certificadosVencidos: 0,
  }

  const kpiCards = [
    {
      title: "Total Actividades",
      value: kpis.totalActividades,
      icon: BookOpen,
      color: "text-blue-400",
      bgColor: "bg-blue-500/10",
      borderColor: "border-blue-500/20",
    },
    {
      title: "Certificados Emitidos",
      value: kpis.totalCertificados,
      icon: Award,
      color: "text-emerald-400",
      bgColor: "bg-emerald-500/10",
      borderColor: "border-emerald-500/20",
    },
    {
      title: "Proximos a Vencer",
      value: kpis.certificadosProximosVencer,
      icon: AlertTriangle,
      color: "text-amber-400",
      bgColor: "bg-amber-500/10",
      borderColor: "border-amber-500/20",
    },
    {
      title: "Vencidos",
      value: kpis.certificadosVencidos,
      icon: XCircle,
      color: "text-red-400",
      bgColor: "bg-red-500/10",
      borderColor: "border-red-500/20",
    },
  ]

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <p className="text-gray-400 mt-1">
            Bienvenido, {session?.user?.name || "Administrador"}
          </p>
        </div>
        <Link href="/actividades/nueva">
          <Button className="bg-[#E8541A] hover:bg-[#E8541A]/90">
            <Plus className="h-4 w-4 mr-2" />
            Nueva Actividad
          </Button>
        </Link>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiCards.map((kpi, i) => (
          <Card
            key={kpi.title}
            className={`glass-card border-white/10 hover:border-white/20 transition-all duration-300`}
            style={{ animationDelay: `${i * 100}ms` }}
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">{kpi.title}</p>
                  <p className="text-3xl font-bold text-white mt-1">{kpi.value}</p>
                </div>
                <div className={`p-3 rounded-xl ${kpi.bgColor} ${kpi.borderColor} border`}>
                  <kpi.icon className={`h-6 w-6 ${kpi.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Activities */}
      <Card className="glass-card border-white/10">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg text-white">Actividades Recientes</CardTitle>
          <Link href="/actividades">
            <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white">
              Ver todas
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          {data?.actividadesRecientes && data.actividadesRecientes.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow className="border-white/5 hover:bg-transparent">
                  <TableHead className="text-gray-400">Nombre</TableHead>
                  <TableHead className="text-gray-400">Tipo</TableHead>
                  <TableHead className="text-gray-400">Empresa</TableHead>
                  <TableHead className="text-gray-400">Fecha Inicio</TableHead>
                  <TableHead className="text-gray-400 text-center">Participantes</TableHead>
                  <TableHead className="text-gray-400">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.actividadesRecientes.map((actividad) => (
                  <TableRow key={actividad.id} className="border-white/5">
                    <TableCell className="text-white font-medium">
                      {actividad.nombre_curso}
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={`${TIPO_COLORS[actividad.tipo_certificado]} border`}
                      >
                        {TIPO_LABELS[actividad.tipo_certificado]}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-gray-300">
                      {actividad.empresa_nombre}
                    </TableCell>
                    <TableCell className="text-gray-300">
                      {new Date(actividad.fecha_inicio).toLocaleDateString("es-CL")}
                    </TableCell>
                    <TableCell className="text-center text-gray-300">
                      {actividad.participantes}
                    </TableCell>
                    <TableCell>
                      <Link href={`/actividades/${actividad.id}`}>
                        <Button variant="ghost" size="sm" className="text-gray-400 hover:text-[#E8541A]">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-12">
              <BookOpen className="h-12 w-12 mx-auto text-gray-600 mb-4" />
              <p className="text-gray-400">No hay actividades registradas</p>
              <Link href="/actividades/nueva" className="mt-4 inline-block">
                <Button variant="outline" className="border-white/10 text-gray-300 hover:text-white">
                  <Plus className="h-4 w-4 mr-2" />
                  Crear primera actividad
                </Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
