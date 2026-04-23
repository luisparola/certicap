import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(
  request: Request,
  { params }: { params: { actividadId: string } }
) {
  try {
    const encuesta = await prisma.encuesta.findUnique({
      where: { actividadId: params.actividadId },
      include: { preguntas: { orderBy: { orden: "asc" } } },
    })

    if (!encuesta || !encuesta.activa) {
      return NextResponse.json({ disponible: false })
    }

    return NextResponse.json({
      disponible: true,
      id: encuesta.id,
      titulo: encuesta.titulo,
      descripcion: encuesta.descripcion,
      preguntas: encuesta.preguntas.map((p) => ({ id: p.id, orden: p.orden, texto: p.texto })),
    })
  } catch (error) {
    console.error("Error obteniendo encuesta pública:", error)
    return NextResponse.json({ disponible: false })
  }
}
