"use client"

import { useState } from "react"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, ShieldCheck } from "lucide-react"
import Image from "next/image"

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      })

      if (result?.error) {
        setError("Credenciales invalidas. Verifica tu email y contrasena.")
      } else {
        router.push("/dashboard")
        router.refresh()
      }
    } catch {
      setError("Error al iniciar sesion. Intenta nuevamente.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0F0F0F] relative overflow-hidden">
      {/* Background gradient accent */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-[#E8541A]/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-[#E8541A]/5 rounded-full blur-[100px] pointer-events-none" />

      <div className="relative z-10 w-full max-w-md px-4 animate-fade-in">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <Image
            src="/logo-formacap.png"
            alt="Formacap"
            width={200}
            height={67}
            className="h-16 w-auto"
            priority
          />
        </div>

        <Card className="glass-card border-white/10 bg-[#1A1A1A]/80">
          <CardHeader className="text-center space-y-2">
            <div className="flex justify-center mb-2">
              <div className="p-3 rounded-full bg-[#E8541A]/10 border border-[#E8541A]/20">
                <ShieldCheck className="h-6 w-6 text-[#E8541A]" />
              </div>
            </div>
            <CardTitle className="text-xl font-bold text-white">
              Acceso al Sistema
            </CardTitle>
            <CardDescription className="text-[#666666]">
              Sistema de Gestion de Certificados
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm text-gray-300">
                  Correo electronico
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@formacap.cl"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading}
                  className="bg-[#0F0F0F] border-white/10 text-white placeholder:text-gray-500 focus:border-[#E8541A]/50 focus:ring-[#E8541A]/20"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm text-gray-300">
                  Contrasena
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Ingresa tu contrasena"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={loading}
                  className="bg-[#0F0F0F] border-white/10 text-white placeholder:text-gray-500 focus:border-[#E8541A]/50 focus:ring-[#E8541A]/20"
                />
              </div>

              {error && (
                <div className="p-3 rounded-md bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                  {error}
                </div>
              )}

              <Button
                type="submit"
                className="w-full bg-[#E8541A] hover:bg-[#E8541A]/90 text-white font-medium h-11"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Iniciando sesion...
                  </>
                ) : (
                  "Iniciar Sesion"
                )}
              </Button>
            </form>

            <div className="mt-6 pt-4 border-t border-white/5 text-center">
              <p className="text-xs text-gray-500">
                OTEC Capacitaciones Q&C Spa - Formacap
              </p>
              <p className="text-xs text-gray-600 mt-1">
                Sistema privado. Acceso solo personal autorizado.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
