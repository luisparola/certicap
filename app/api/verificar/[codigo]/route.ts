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

    // Solo devolver datos publicos (sin RUT completo ni notas)
    const rut = certificado.participante.rut
    const rutParcial = rut.length > 4 ? "****" + rut.slice(-4) : "****"

    const ahora = new Date()
    const vencido = certificado.fecha_vencimiento
      ? new Date(certificado.fecha_vencimiento) < ahora
      : false

    return NextResponse.json({
      found: true,
      nombre: certificado.participante.nombre,
      rut_parcial: rutParcial,
      curso: certificado.participante.actividad.nombre_curso,
      tipo: certificado.participante.actividad.tipo_certificado,
      empresa: certificado.participante.actividad.empresa_nombre,
      fecha_emision: certificado.fecha_emision,
      fecha_vencimiento: certificado.fecha_vencimiento,
      codigo: certificado.codigo,
      estado_certificado: vencido ? "VENCIDO" : "VALIDO",
    })
  } catch (error) {
    console.error("Error verificando:", error)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}
