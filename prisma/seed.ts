import { PrismaClient } from "@prisma/client"
import * as bcrypt from "bcryptjs"

const prisma = new PrismaClient()

async function main() {
  console.log("Iniciando seed...")

  // Crear tenant Formacap
  const tenant = await prisma.tenant.upsert({
    where: { id: "formacap-tenant-001" },
    update: {},
    create: {
      id: "formacap-tenant-001",
      nombre: "OTEC Capacitaciones Q&C Spa (Formacap)",
      rut: "77.520.118-5",
      logo_url: "/logo-formacap.png",
      color_primary: "#E8541A",
    },
  })

  console.log("Tenant creado:", tenant.nombre)

  // Crear usuario admin
  const hashedPassword = await bcrypt.hash("Formacap2026!", 12)

  const admin = await prisma.usuario.upsert({
    where: { email: "admin@formacap.cl" },
    update: {},
    create: {
      email: "admin@formacap.cl",
      password: hashedPassword,
      nombre: "Administrador Formacap",
      rol: "ADMIN",
      tenantId: tenant.id,
    },
  })

  console.log("Usuario admin creado:", admin.email)
  console.log("Seed completado exitosamente.")
}

main()
  .catch((e) => {
    console.error("Error en seed:", e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
