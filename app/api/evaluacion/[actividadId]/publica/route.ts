import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(request: Request, { params }: { params: { actividadId: string } }) {
  try {
    const evaluacion = await prisma.evaluacion.findUnique({
      where: { actividadId: params.actividadId },
      include: { preguntas: { orderBy: { orden: "asc" } } },
    })

    if (!evaluacion || !evaluacion.activa) {
      return NextResponse.json({ disponible: false })
    }

    return NextResponse.json({
      disponible: true,
      id: evaluacion.id,
      titulo: evaluacion.titulo,
      preguntas: evaluacion.preguntas.map((p) => ({
        id: p.id,
        orden: p.orden,
        texto: p.texto,
        alternativas: p.alternativas,
        // correcta is NOT sent to client
      })),
    })
  } catch (error) {
    console.error("Error evaluacion publica GET:", error)
    return NextResponse.json({ disponible: false })
  }
}
