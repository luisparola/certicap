import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

function isNonEmptyString(value: unknown, maxLength: number): value is string {
  return typeof value === "string" && value.trim().length > 0 && value.length <= maxLength
}

function parseOptionalNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null
  const parsed = typeof value === "number" ? value : parseFloat(String(value))
  return Number.isFinite(parsed) ? parsed : Number.NaN
}

function isInRange(value: number | null, min: number, max: number): boolean {
  return value === null || (Number.isFinite(value) && value >= min && value <= max)
}

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
    const notaTeoria = parseOptionalNumber(body.nota_teoria)
    const notaPractica = parseOptionalNumber(body.nota_practica)
    const asistenciaPct = parseOptionalNumber(body.asistencia_pct)

    if (!isNonEmptyString(body.nombre, 200)) {
      return NextResponse.json({ error: "Nombre invalido" }, { status: 400 })
    }
    if (!isNonEmptyString(body.rut, 20)) {
      return NextResponse.json({ error: "RUT invalido" }, { status: 400 })
    }
    if (!isInRange(notaTeoria, 1, 100) || !isInRange(notaPractica, 1, 100)) {
      return NextResponse.json({ error: "Nota invalida" }, { status: 400 })
    }
    if (!isInRange(asistenciaPct, 0, 100)) {
      return NextResponse.json({ error: "Asistencia invalida" }, { status: 400 })
    }

    const participante = await prisma.participante.create({
      data: {
        actividadId: params.id, nombre: body.nombre, rut: body.rut,
        nota_teoria: notaTeoria,
        nota_practica: notaPractica,
        asistencia_pct: asistenciaPct,
        senales: body.senales || null, nro_registro: body.nro_registro || null,
        estado: body.estado || "PENDIENTE",
        marca_equipo: body.marca_equipo || null, modelo_equipo: body.modelo_equipo || null,
        capacidad_equipo: body.capacidad_equipo || null,
        espesor_diametro: body.espesor_diametro || null,
        aplicacion_soldadura: body.aplicacion_soldadura || null,
        observaciones: body.observaciones || null,
        campos_extra: body.campos_extra || null,
      },
    })
    return NextResponse.json(participante, { status: 201 })
  } catch (error) {
    console.error("Error creando participante:", error)
    return NextResponse.json({ error: "Error al crear" }, { status: 500 })
  }
}
