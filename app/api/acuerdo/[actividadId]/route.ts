import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getClientIp, rateLimit } from "@/lib/ratelimit"

function normalizarRut(rut: string): string {
  return rut.trim().toUpperCase()
}

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

    // Admin: return full list (requires authentication + tenantId check)
    if (searchParams.get("lista") === "1") {
      const session = await getServerSession(authOptions)
      if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })
      const tenantId = (session.user as any).tenantId
      const actCheck = await prisma.actividad.findFirst({ where: { id: params.actividadId, tenantId } })
      if (!actCheck) return NextResponse.json({ error: "No autorizado" }, { status: 403 })
      const lista = await prisma.acuerdoParticipante.findMany({
        where: { actividadId: params.actividadId },
        include: { participante: { select: { nombre: true, rut: true, estado: true } } },
        orderBy: { fecha: "desc" },
      })
      return NextResponse.json({ actividad, totalParticipantes, totalFirmados, lista })
    }

    if (rutCheck) {
      const rutNorm = normalizarRut(rutCheck)
      const acuerdo = await prisma.acuerdoParticipante.findUnique({
        where: { actividadId_rut: { actividadId: params.actividadId, rut: rutNorm } },
      })
      return NextResponse.json({
        actividad, totalParticipantes, totalFirmados,
        yaFirmo: !!acuerdo,
        fecha: acuerdo?.fecha ?? null,
      })
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
    const ip = getClientIp(request)
    const { allowed } = rateLimit(`acuerdo:${ip}`, 5, 60_000)
    if (!allowed) {
      return NextResponse.json({ error: "Demasiadas solicitudes." }, { status: 429 })
    }

    const { rut, nombre, acepta_datos, acepta_deberes } = await request.json()
    if (!rut || !nombre || !acepta_datos || !acepta_deberes) {
      return NextResponse.json({ error: "Faltan campos obligatorios" }, { status: 400 })
    }

    // Normalize inputs for consistent DB storage
    const rutNormalizado = normalizarRut(rut)
    const nombreNormalizado = nombre.trim().toUpperCase()

    const actividad = await prisma.actividad.findUnique({
      where: { id: params.actividadId },
      select: { id: true, nombre_curso: true, empresa_nombre: true },
    })
    if (!actividad) return NextResponse.json({ error: "Actividad no encontrada" }, { status: 404 })

    const ip_address = request.headers.get("x-forwarded-for") ?? request.headers.get("x-real-ip") ?? null

    // 1. Find existing participant by normalized RUT
    let participante = await prisma.participante.findFirst({
      where: { actividadId: params.actividadId, rut: rutNormalizado },
    })

    const yaExistia = !!participante

    // 2. Create participant if not found (auto-matricula)
    if (!participante) {
      participante = await prisma.participante.create({
        data: {
          actividadId: params.actividadId,
          nombre: nombreNormalizado,
          rut: rutNormalizado,
          estado: "PENDIENTE",
        },
      })
    }

    // 3. Upsert acuerdo — also fixes legacy records with participanteId: null
    const acuerdo = await prisma.acuerdoParticipante.upsert({
      where: { actividadId_rut: { actividadId: params.actividadId, rut: rutNormalizado } },
      create: {
        actividadId: params.actividadId,
        participanteId: participante.id,
        nombre: nombreNormalizado,
        rut: rutNormalizado,
        acepta_datos,
        acepta_deberes,
        ip_address,
      },
      update: {
        participanteId: participante.id,
        nombre: nombreNormalizado,
        acepta_datos,
        acepta_deberes,
        ip_address,
      },
    })

    return NextResponse.json({
      success: true,
      nombre: participante.nombre,
      rut: rutNormalizado,
      curso: actividad.nombre_curso,
      empresa: actividad.empresa_nombre,
      fecha: acuerdo.fecha,
      yaExistia,
    })
  } catch (error) {
    console.error("Error acuerdo POST:", error)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}
