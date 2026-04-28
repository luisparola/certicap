import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(
  request: Request,
  { params }: { params: { actividadId: string } }
) {
  try {
    const actividad = await prisma.actividad.findUnique({
      where: { id: params.actividadId },
      select: { id: true, nombre_curso: true, empresa_nombre: true, empresa_rut: true, fecha_inicio: true, fecha_termino: true },
    })
    if (!actividad) return NextResponse.json({ error: "No encontrada" }, { status: 404 })

    const totalParticipantes = await prisma.participante.count({ where: { actividadId: params.actividadId } })
    const totalFirmados = await prisma.acuerdoParticipante.count({ where: { actividadId: params.actividadId } })

    return NextResponse.json({ actividad, totalParticipantes, totalFirmados })
  } catch (error) {
    console.error("Error acuerdo GET:", error)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}

export async function POST(
  request: Request,
  { params }: { params: { actividadId: string } }
) {
  try {
    const { rut, nombre, acepta_datos, acepta_deberes } = await request.json()
    if (!rut || !nombre || !acepta_datos || !acepta_deberes) {
      return NextResponse.json({ error: "Faltan campos obligatorios" }, { status: 400 })
    }

    const actividad = await prisma.actividad.findUnique({ where: { id: params.actividadId } })
    if (!actividad) return NextResponse.json({ error: "No encontrada" }, { status: 404 })

    // Check if already signed
    const existing = await prisma.acuerdoParticipante.findUnique({
      where: { actividadId_rut: { actividadId: params.actividadId, rut } },
    })
    if (existing) return NextResponse.json({ error: "Ya firmaste este acuerdo" }, { status: 400 })

    // Try to find matching participant
    const participante = await prisma.participante.findFirst({
      where: { actividadId: params.actividadId, rut },
    })

    const ip_address = request.headers.get("x-forwarded-for") ?? request.headers.get("x-real-ip") ?? null

    const acuerdo = await prisma.acuerdoParticipante.create({
      data: {
        actividadId: params.actividadId,
        participanteId: participante?.id ?? null,
        nombre,
        rut,
        acepta_datos,
        acepta_deberes,
        ip_address,
      },
    })

    return NextResponse.json({ ok: true, fecha: acuerdo.fecha })
  } catch (error: any) {
    if (error?.code === "P2002") return NextResponse.json({ error: "Ya firmaste este acuerdo" }, { status: 400 })
    console.error("Error acuerdo POST:", error)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}
