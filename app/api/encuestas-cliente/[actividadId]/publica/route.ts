import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(request: Request, { params }: { params: { actividadId: string } }) {
  try {
    const encuesta = await prisma.encuestaCliente.findUnique({
      where: { actividadId: params.actividadId },
      include: {
        preguntas: { orderBy: { orden: "asc" } },
        actividad: { select: { nombre_curso: true, empresa_nombre: true, instructor: true, fecha_inicio: true } },
      },
    })

    if (!encuesta || !encuesta.activa) return NextResponse.json({ disponible: false })

    return NextResponse.json({
      disponible: true,
      id: encuesta.id,
      titulo: encuesta.titulo,
      actividad: encuesta.actividad,
      preguntas: encuesta.preguntas.map((p) => ({ id: p.id, orden: p.orden, texto: p.texto, tipo: p.tipo })),
    })
  } catch (error) {
    console.error("Error encuesta-cliente publica:", error)
    return NextResponse.json({ disponible: false })
  }
}
