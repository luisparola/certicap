import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    const tenantId = (session.user as any).tenantId
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get("page") || "1")
    const limit = 20

    const where: any = { participante: { actividad: { tenantId } } }
    const nombre = searchParams.get("nombre")
    const rut = searchParams.get("rut")
    const empresa = searchParams.get("empresa")
    const empresaRut = searchParams.get("empresa_rut")
    const curso = searchParams.get("curso")
    const tipo = searchParams.get("tipo")
    const estado = searchParams.get("estado")
    const anio = searchParams.get("anio")
    const mes = searchParams.get("mes")
    const codigo = searchParams.get("codigo")
    const nroRegistro = searchParams.get("nro_registro")

    if (nombre) where.participante = { ...where.participante, nombre: { contains: nombre, mode: "insensitive" } }
    if (rut) where.participante = { ...where.participante, rut: { contains: rut } }
    if (empresa) where.participante = { ...where.participante, actividad: { ...where.participante.actividad, empresa_nombre: { contains: empresa, mode: "insensitive" } } }
    if (empresaRut) where.participante = { ...where.participante, actividad: { ...where.participante.actividad, empresa_rut: { contains: empresaRut } } }
    if (curso) where.participante = { ...where.participante, actividad: { ...where.participante.actividad, nombre_curso: { contains: curso, mode: "insensitive" } } }
    if (tipo) where.participante = { ...where.participante, actividad: { ...where.participante.actividad, tipo_certificado: tipo } }
    if (estado) where.participante = { ...where.participante, estado }
    if (codigo) where.codigo = codigo
    if (nroRegistro) where.participante = { ...where.participante, nro_registro: { contains: nroRegistro } }
    if (anio) {
      const y = parseInt(anio)
      where.fecha_emision = { ...where.fecha_emision, gte: new Date(y, 0, 1), lt: new Date(y + 1, 0, 1) }
    }
    if (mes && anio) {
      const y = parseInt(anio), m = parseInt(mes) - 1
      where.fecha_emision = { gte: new Date(y, m, 1), lt: new Date(y, m + 1, 1) }
    }

    const [certificados, total] = await Promise.all([
      prisma.certificado.findMany({
        where, orderBy: { fecha_emision: "desc" }, skip: (page - 1) * limit, take: limit,
        include: { participante: { include: { actividad: { select: { nombre_curso: true, tipo_certificado: true, empresa_nombre: true, empresa_rut: true } } } } },
      }),
      prisma.certificado.count({ where }),
    ])

    return NextResponse.json({ certificados, total, pages: Math.ceil(total / limit), page })
  } catch (error) {
    console.error("Error buscando:", error)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}
