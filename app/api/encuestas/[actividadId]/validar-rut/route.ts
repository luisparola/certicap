import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { corsHeaders, handleOptions } from "@/lib/cors"

export async function OPTIONS(request: Request) {
  return handleOptions(request)
}

export async function POST(
  request: Request,
  { params }: { params: { actividadId: string } }
) {
  const origin = request.headers.get("origin")
  const headers = corsHeaders(origin)

  try {
    const { rut } = await request.json()
    if (!rut) return NextResponse.json({ valido: false, nombre: null, yaRespondio: false }, { headers })

    const encuesta = await prisma.encuesta.findUnique({
      where: { actividadId: params.actividadId },
      select: { id: true, activa: true },
    })
    if (!encuesta || !encuesta.activa) {
      return NextResponse.json({ valido: false, nombre: null, yaRespondio: false }, { headers })
    }

    const participante = await prisma.participante.findFirst({
      where: { actividadId: params.actividadId, rut },
    })
    if (!participante) return NextResponse.json({ valido: false, nombre: null, yaRespondio: false }, { headers })

    const yaRespondio = await prisma.respuestaEncuesta.findFirst({
      where: { encuestaId: encuesta.id, participanteId: participante.id, completada: true },
    })

    return NextResponse.json(
      { valido: true, nombre: participante.nombre, yaRespondio: !!yaRespondio },
      { headers }
    )
  } catch (error) {
    console.error("Error validando RUT:", error)
    return NextResponse.json({ error: "Error interno" }, { status: 500, headers })
  }
}
