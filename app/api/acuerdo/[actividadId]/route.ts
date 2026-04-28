import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(
  request: Request,
  { params }: { params: { actividadId: string } }
) {
  try {
    const { searchParams } = new URL(request.url)
    const rutCheck = searchParams.get("rut")

    const actividad = await prisma.actividad.findUnique({
      where: { id: params.actividadId },
      select: { id: true, nombre_curso: true, empresa_nombre: true, empresa_rut: true, fecha_inicio: true, fecha_termino: true },
    })
    if (!actividad) return NextResponse.json({ error: "No encontrada" }, { status: 404 })

    const totalParticipantes = await prisma.participante.count({ where: { actividadId: params.actividadId } })
    const totalFirmados = await prisma.acuerdoParticipante.count({ where: { actividadId: params.actividadId } })

    if (rutCheck) {
      const acuerdo = await prisma.acuerdoParticipante.findUnique({
        where: { actividadId_rut: { actividadId: params.actividadId, rut: rutCheck } },
      })
      const participante = await prisma.participante.findFirst({
        where: { actividadId: params.actividadId, rut: rutCheck },
      })
      return NextResponse.json({ actividad, totalParticipantes, totalFirmados, yaFirmo: !!acuerdo, yaMatriculado: !!participante, nombre: acuerdo?.nombre ?? participante?.nombre ?? null, fecha: acuerdo?.fecha ?? null })
    }

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

    const actividad = await prisma.actividad.findUnique({
      where: { id: params.actividadId },
      select: { id: true, nombre_curso: true, empresa_nombre: true },
    })
    if (!actividad) return NextResponse.json({ error: "Actividad no encontrada" }, { status: 404 })

    // Check if already signed
    const existingAcuerdo = await prisma.acuerdoParticipante.findUnique({
      where: { actividadId_rut: { actividadId: params.actividadId, rut } },
    })
    if (existingAcuerdo) {
      return NextResponse.json({ error: "Ya firmaste este acuerdo", yaFirmo: true }, { status: 400 })
    }

    const ip_address = request.headers.get("x-forwarded-for") ?? request.headers.get("x-real-ip") ?? null

    // Auto-enroll: find or create participant
    let participante = await prisma.participante.findFirst({
      where: { actividadId: params.actividadId, rut },
    })

    const yaExistia = !!participante

    if (!participante) {
      participante = await prisma.participante.create({
        data: {
          actividadId: params.actividadId,
          nombre,
          rut,
          estado: "PENDIENTE",
        },
      })
    }

    const acuerdo = await prisma.acuerdoParticipante.create({
      data: {
        actividadId: params.actividadId,
        participanteId: participante.id,
        nombre,
        rut,
        acepta_datos,
        acepta_deberes,
        ip_address,
      },
    })

    return NextResponse.json({
      success: true,
      nombre: participante.nombre,
      rut,
      curso: actividad.nombre_curso,
      empresa: actividad.empresa_nombre,
      fecha: acuerdo.fecha,
      yaExistia,
    })
  } catch (error: any) {
    if (error?.code === "P2002") return NextResponse.json({ error: "Ya firmaste este acuerdo", yaFirmo: true }, { status: 400 })
    console.error("Error acuerdo POST:", error)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}
