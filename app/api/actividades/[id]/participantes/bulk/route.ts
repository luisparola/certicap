import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    const tenantId = (session.user as any).tenantId
    const actividad = await prisma.actividad.findFirst({ where: { id: params.id, tenantId } })
    if (!actividad) return NextResponse.json({ error: "No encontrada" }, { status: 404 })
    const body = await request.json()
    const { participantes } = body
    if (!Array.isArray(participantes) || participantes.length === 0) {
      return NextResponse.json({ error: "No hay participantes" }, { status: 400 })
    }
    const created = await prisma.participante.createMany({
      data: participantes.map((p: any) => ({
        actividadId: params.id, nombre: p.nombre, rut: p.rut,
        nota_teoria: p.nota_teoria ? parseFloat(p.nota_teoria) : null,
        nota_practica: p.nota_practica ? parseFloat(p.nota_practica) : null,
        asistencia_pct: p.asistencia_pct ? parseFloat(p.asistencia_pct) : null,
        senales: p.senales || null, nro_registro: p.nro_registro || null,
        estado: p.estado || "PENDIENTE",
        marca_equipo: p.marca_equipo || null, modelo_equipo: p.modelo_equipo || null,
        capacidad_equipo: p.capacidad_equipo || null, campos_extra: p.campos_extra || null,
      })),
    })
    return NextResponse.json({ count: created.count }, { status: 201 })
  } catch (error) {
    console.error("Error bulk:", error)
    return NextResponse.json({ error: "Error al importar" }, { status: 500 })
  }
}
