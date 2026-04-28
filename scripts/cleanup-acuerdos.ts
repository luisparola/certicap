import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

async function main() {
  const acuerdos = await prisma.acuerdoParticipante.findMany()
  let eliminados = 0

  for (const a of acuerdos) {
    if (a.participanteId) {
      const p = await prisma.participante.findUnique({ where: { id: a.participanteId } })
      if (!p) {
        await prisma.acuerdoParticipante.delete({ where: { id: a.id } })
        console.log(`  Eliminado acuerdo huérfano: ${a.nombre} — ${a.rut}`)
        eliminados++
      }
    }
  }

  console.log(`\nLimpieza completada: ${eliminados} acuerdo(s) huérfano(s) eliminado(s).`)
}

main().catch(console.error).finally(() => prisma.$disconnect())
