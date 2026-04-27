import type { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email y contraseña son requeridos")
        }

        const usuario = await prisma.usuario.findUnique({
          where: { email: credentials.email },
          include: { tenant: true },
        })

        if (!usuario) {
          throw new Error("Credenciales inválidas")
        }

        const passwordMatch = await bcrypt.compare(credentials.password, usuario.password)
        if (!passwordMatch) {
          throw new Error("Credenciales inválidas")
        }

        return {
          id: usuario.id,
          email: usuario.email,
          name: usuario.nombre,
          rol: usuario.rol,
          tenantId: usuario.tenantId,
          tenantNombre: usuario.tenant.nombre,
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.rol = (user as any).rol
        token.tenantId = (user as any).tenantId
        token.tenantNombre = (user as any).tenantNombre
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id
        ;(session.user as any).rol = token.rol
        ;(session.user as any).tenantId = token.tenantId
        ;(session.user as any).tenantNombre = token.tenantNombre
      }
      return session
    },
  },
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 24 * 60 * 60, // 24 horas
  },
  secret: process.env.NEXTAUTH_SECRET,
}
