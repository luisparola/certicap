import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(
  request: Request,
  { params }: { params: { codigo: string } }
) {
  try {
    const certificado = await prisma.certificado.findUnique({
      where: { codigo: params.codigo },
      include: {
        participante: {
          include: {
            actividad: {
              select: {
                nombre_curso: true,
                tipo_certificado: true,
                empresa_nombre: true,
                fecha_inicio: true,
                fecha_termino: true,
              },
            },
          },
        },
      },
    })

    if (!certificado) {
      return NextResponse.json({ found: false }, { status: 404 })
    }

    const rut = certificado.participante.rut
    const rutParcial = rut.length > 4 ? "****" + rut.slice(-4) : "****"

    const ahora = new Date()
    const vencido = certificado.fecha_vencimiento
      ? new Date(certificado.fecha_vencimiento) < ahora
      : false

    const p = certificado.participante
    const tipo = p.actividad.tipo_certificado

    return NextResponse.json({
      found: true,
      certificado_id: certificado.id,
      codigo: certificado.codigo,
      nombre: p.nombre,
      rut_parcial: rutParcial,
      curso: p.actividad.nombre_curso,
      tipo,
      empresa: p.actividad.empresa_nombre,
      fecha_emision: certificado.fecha_emision,
      fecha_vencimiento: certificado.fecha_vencimiento,
      estado_certificado: vencido ? "VENCIDO" : "VALIDO",
      nota_teoria: p.nota_teoria,
      nota_practica: p.nota_practica,
      asistencia_pct: p.asistencia_pct,
      nro_registro: p.nro_registro,
      estado: p.estado,
      ...(tipo === "PUENTE_GRUA" && {
        marca_equipo: p.marca_equipo,
        modelo_equipo: p.modelo_equipo,
        capacidad_equipo: p.capacidad_equipo,
      }),
    })
  } catch (error) {
    console.error("Error verificando:", error)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}
