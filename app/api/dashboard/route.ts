import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

const MESES = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"]

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    const tenantId = (session.user as any).tenantId

    const [totalActividades, totalParticipantes, totalCertificados, certificadosProximosVencer] =
      await Promise.all([
        prisma.actividad.count({ where: { tenantId } }),
        prisma.participante.count({ where: { actividad: { tenantId } } }),
        prisma.certificado.count({ where: { participante: { actividad: { tenantId } } } }),
        prisma.certificado.count({
          where: {
            participante: { actividad: { tenantId } },
            fecha_vencimiento: { gte: new Date(), lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) },
          },
        }),
      ])

    // Certificados por mes — últimos 6 meses
    const sixMonthsAgo = new Date()
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5)
    sixMonthsAgo.setDate(1)
    sixMonthsAgo.setHours(0, 0, 0, 0)

    const certRecientes = await prisma.certificado.findMany({
      where: { participante: { actividad: { tenantId } }, fecha_emision: { gte: sixMonthsAgo } },
      select: { fecha_emision: true },
    })

    const now = new Date()
    const certificados_por_mes = Array.from({ length: 6 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1)
      const y = d.getFullYear()
      const m = d.getMonth()
      const cantidad = certRecientes.filter((c: { fecha_emision: Date }) => {
        const e = new Date(c.fecha_emision)
        return e.getFullYear() === y && e.getMonth() === m
      }).length
      return { mes: MESES[m], cantidad }
    })

    // Por tipo
    const tipoGroups = await prisma.actividad.groupBy({
      by: ["tipo_certificado"],
      where: { tenantId },
      _count: { id: true },
    })
    const por_tipo = tipoGroups.map((g: { tipo_certificado: string; _count: { id: number } }) => ({ tipo: g.tipo_certificado, cantidad: g._count.id }))

    // Actividades recientes (5)
    const actividadesRecientes = await prisma.actividad.findMany({
      where: { tenantId },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: {
        _count: { select: { participantes: true } },
        encuesta: { select: { activa: true } },
      },
    })

    // Satisfacción por actividad (últimas 5 con respuestas)
    const encuestasConResp = await prisma.encuesta.findMany({
      where: { actividad: { tenantId }, respuestas: { some: { completada: true } } },
      include: {
        actividad: { select: { nombre_curso: true } },
        respuestas: { where: { completada: true }, include: { respuestas: { select: { valor: true } } } },
      },
      orderBy: { createdAt: "desc" },
      take: 5,
    })

    const satisfaccion_por_actividad = encuestasConResp.map((e) => {
      const vals = e.respuestas.flatMap((r) => r.respuestas.map((rp: { valor: number }) => rp.valor))
      const promedio = vals.length ? Math.round((vals.reduce((a: number, b: number) => a + b, 0) / vals.length) * 10) / 10 : 0
      return { nombre: e.actividad.nombre_curso, promedio, total_respuestas: e.respuestas.length }
    })

    // Satisfacción general y mejor/peor pregunta
    const todasRespPregunta = await prisma.respuestaPregunta.findMany({
      where: { respuestaEncuesta: { encuesta: { actividad: { tenantId } }, completada: true } },
      include: { pregunta: { select: { texto: true } } },
    })

    const total_respuestas_encuestas = await prisma.respuestaEncuesta.count({
      where: { encuesta: { actividad: { tenantId } }, completada: true },
    })

    let satisfaccion_general = 0
    let mejor_pregunta: { texto: string; promedio: number } | null = null
    let peor_pregunta: { texto: string; promedio: number } | null = null

    if (todasRespPregunta.length > 0) {
      satisfaccion_general =
        Math.round((todasRespPregunta.reduce((a: number, r: { valor: number }) => a + r.valor, 0) / todasRespPregunta.length) * 10) / 10

      const byPregunta: Record<string, { texto: string; vals: number[] }> = {}
      for (const r of todasRespPregunta) {
        if (!byPregunta[r.preguntaId]) byPregunta[r.preguntaId] = { texto: r.pregunta.texto, vals: [] }
        byPregunta[r.preguntaId].vals.push(r.valor)
      }
      const promedios = Object.values(byPregunta)
        .map((p) => ({ texto: p.texto, promedio: Math.round((p.vals.reduce((a, b) => a + b, 0) / p.vals.length) * 10) / 10 }))
        .sort((a, b) => b.promedio - a.promedio)
      mejor_pregunta = promedios[0] ?? null
      peor_pregunta = promedios[promedios.length - 1] ?? null
    }

    return NextResponse.json({
      kpis: { totalActividades, totalParticipantes, totalCertificados, certificadosProximosVencer },
      certificados_por_mes,
      por_tipo,
      actividadesRecientes: actividadesRecientes.map((a) => ({
        id: a.id,
        nombre_curso: a.nombre_curso,
        tipo_certificado: a.tipo_certificado,
        empresa_nombre: a.empresa_nombre,
        participantes: a._count.participantes,
        encuesta_activa: a.encuesta ? a.encuesta.activa : null,
      })),
      satisfaccion_por_actividad,
      satisfaccion_general,
      total_respuestas_encuestas,
      total_participantes: totalParticipantes,
      mejor_pregunta,
      peor_pregunta,
    })
  } catch (error) {
    console.error("Error en dashboard:", error)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}
