import "next-auth"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      email: string
      name: string
      rol: string
      tenantId: string
      tenantNombre: string
    }
  }

  interface User {
    id: string
    email: string
    name: string
    rol: string
    tenantId: string
    tenantNombre: string
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string
    rol: string
    tenantId: string
    tenantNombre: string
  }
}
