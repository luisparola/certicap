import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    const tenantId = (session.user as any).tenantId
    const actividad = await prisma.actividad.findFirst({ where: { id: params.id, tenantId } })
    if (!actividad) return NextResponse.json({ error: "No encontrada" }, { status: 404 })
    const participantes = await prisma.participante.findMany({
      where: { actividadId: params.id }, include: { certificado: true }, orderBy: { createdAt: "desc" },
    })
    return NextResponse.json(participantes)
  } catch (error) {
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    const tenantId = (session.user as any).tenantId
    const actividad = await prisma.actividad.findFirst({ where: { id: params.id, tenantId } })
    if (!actividad) return NextResponse.json({ error: "No encontrada" }, { status: 404 })
    const body = await request.json()
    const participante = await prisma.participante.create({
      data: {
        actividadId: params.id, nombre: body.nombre, rut: body.rut,
        nota_teoria: body.nota_teoria ? parseFloat(body.nota_teoria) : null,
        nota_practica: body.nota_practica ? parseFloat(body.nota_practica) : null,
        asistencia_pct: body.asistencia_pct ? parseFloat(body.asistencia_pct) : null,
        senales: body.senales || null, nro_registro: body.nro_registro || null,
        estado: body.estado || "PENDIENTE",
        marca_equipo: body.marca_equipo || null, modelo_equipo: body.modelo_equipo || null,
        capacidad_equipo: body.capacidad_equipo || null, campos_extra: body.campos_extra || null,
      },
    })
    return NextResponse.json(participante, { status: 201 })
  } catch (error) {
    console.error("Error creando participante:", error)
    return NextResponse.json({ error: "Error al crear" }, { status: 500 })
  }
}
