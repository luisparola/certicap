import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

async function main() {
  const acuerdos = await prisma.acuerdoParticipante.findMany({
    include: { participante: true },
  })

  let eliminados = 0
  for (const a of acuerdos) {
    if (!a.participante) {
      await prisma.acuerdoParticipante.delete({ where: { id: a.id } })
      console.log(`  Eliminado: ${a.nombre} — ${a.rut}`)
      eliminados++
    }
  }

  const sinParticipante = await prisma.acuerdoParticipante.deleteMany({
    where: { participanteId: null },
  })
  console.log(`Eliminados sin participanteId: ${sinParticipante.count}`)
  console.log(`Total eliminados con participante inválido: ${eliminados}`)
}

main().catch(console.error).finally(() => prisma.$disconnect())
