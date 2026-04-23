import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import * as XLSX from "xlsx"

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    const tenantId = (session.user as any).tenantId
    const actividad = await prisma.actividad.findFirst({ where: { id: params.id, tenantId } })
    if (!actividad) return NextResponse.json({ error: "No encontrada" }, { status: 404 })

    const baseColumns = ["nombre_participante", "rut_participante", "nota_teoria", "nota_practica", "asistencia_pct", "nro_registro", "estado"]
    let columns = [...baseColumns]
    if (actividad.tipo_certificado === "PUENTE_GRUA") {
      columns = [...columns, "marca_equipo", "modelo_equipo", "capacidad_equipo", "senales"]
    }

    const wb = XLSX.utils.book_new()
    const ws = XLSX.utils.aoa_to_sheet([columns, ["Juan Perez", "12.345.678-9", 6.5, 7.0, 100, "R-001", "APROBADO"]])
    XLSX.utils.book_append_sheet(wb, ws, "Participantes")
    const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" })

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename=plantilla_${actividad.tipo_certificado.toLowerCase()}.xlsx`,
      },
    })
  } catch (error) {
    return NextResponse.json({ error: "Error generando plantilla" }, { status: 500 })
  }
}
