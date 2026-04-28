import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { corsHeaders, handleOptions } from "@/lib/cors"

export async function OPTIONS(request: Request) {
  return handleOptions(request)
}

export async function GET(
  request: Request,
  { params }: { params: { actividadId: string } }
) {
  const origin = request.headers.get("origin")
  const headers = corsHeaders(origin)

  try {
    const encuesta = await prisma.encuesta.findUnique({
      where: { actividadId: params.actividadId },
      include: {
        preguntas: { orderBy: { orden: "asc" } },
        actividad: {
          select: {
            nombre_curso: true,
            empresa_nombre: true,
            instructor: true,
            fecha_inicio: true,
            fecha_termino: true,
          },
        },
      },
    })

    if (!encuesta || !encuesta.activa) {
      return NextResponse.json({ disponible: false }, { headers })
    }

    return NextResponse.json({
      disponible: true,
      id: encuesta.id,
      titulo: encuesta.titulo,
      descripcion: encuesta.descripcion,
      actividad: encuesta.actividad,
      preguntas: encuesta.preguntas.map((p) => ({
        id: p.id,
        orden: p.orden,
        texto: p.texto,
        tipo: p.tipo,
      })),
    }, { headers })
  } catch (error) {
    console.error("Error obteniendo encuesta pública:", error)
    return NextResponse.json({ disponible: false }, { headers })
  }
}
