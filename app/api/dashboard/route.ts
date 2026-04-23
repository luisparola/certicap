import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const tenantId = (session.user as any).tenantId

    // KPIs
    const [
      totalActividades,
      totalCertificados,
      certificadosProximosVencer,
      certificadosVencidos,
    ] = await Promise.all([
      prisma.actividad.count({ where: { tenantId } }),
      prisma.certificado.count({
        where: { participante: { actividad: { tenantId } } },
      }),
      prisma.certificado.count({
        where: {
          participante: { actividad: { tenantId } },
          fecha_vencimiento: {
            gte: new Date(),
            lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          },
        },
      }),
      prisma.certificado.count({
        where: {
          participante: { actividad: { tenantId } },
          fecha_vencimiento: { lt: new Date() },
        },
      }),
    ])

    // Actividades recientes
    const actividadesRecientes = await prisma.actividad.findMany({
      where: { tenantId },
      orderBy: { createdAt: "desc" },
      take: 10,
      include: {
        _count: { select: { participantes: true } },
      },
    })

    return NextResponse.json({
      kpis: {
        totalActividades,
        totalCertificados,
        certificadosProximosVencer,
        certificadosVencidos,
      },
      actividadesRecientes: actividadesRecientes.map((a) => ({
        id: a.id,
        nombre_curso: a.nombre_curso,
        tipo_certificado: a.tipo_certificado,
        empresa_nombre: a.empresa_nombre,
        fecha_inicio: a.fecha_inicio,
        participantes: a._count.participantes,
      })),
    })
  } catch (error) {
    console.error("Error en dashboard:", error)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}
