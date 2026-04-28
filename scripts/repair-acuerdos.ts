import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

async function main() {
  const acuerdos = await prisma.acuerdoParticipante.findMany({
    where: { participanteId: null },
  })

  console.log(`Acuerdos sin participante vinculado: ${acuerdos.length}`)

  let reparados = 0
  let vinculados = 0

  for (const acuerdo of acuerdos) {
    const existente = await prisma.participante.findFirst({
      where: { actividadId: acuerdo.actividadId, rut: acuerdo.rut },
    })

    if (!existente) {
      const p = await prisma.participante.create({
        data: {
          actividadId: acuerdo.actividadId,
          nombre: acuerdo.nombre,
          rut: acuerdo.rut,
          estado: "PENDIENTE",
        },
      })
      await prisma.acuerdoParticipante.update({
        where: { id: acuerdo.id },
        data: { participanteId: p.id },
      })
      console.log(`  Reparado (creado): ${acuerdo.nombre} — ${acuerdo.rut}`)
      reparados++
    } else {
      await prisma.acuerdoParticipante.update({
        where: { id: acuerdo.id },
        data: { participanteId: existente.id },
      })
      console.log(`  Vinculado (existente): ${acuerdo.nombre} — ${acuerdo.rut}`)
      vinculados++
    }
  }

  console.log(`\nReparación completada: ${reparados} creados, ${vinculados} vinculados.`)
}

main().catch(console.error).finally(() => prisma.$disconnect())
