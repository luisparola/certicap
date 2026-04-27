"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { signOut, useSession } from "next-auth/react"
import Image from "next/image"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard,
  BookOpen,
  Search,
  LogOut,
  Menu,
  X,
  ChevronLeft,
  ClipboardList,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { ThemeToggle } from "@/components/theme-toggle"
import { useState } from "react"

const navItems = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "Actividades",
    href: "/actividades",
    icon: BookOpen,
  },
  {
    label: "Certificados",
    href: "/certificados/buscar",
    icon: Search,
  },
  {
    label: "Encuestas",
    href: "/encuestas",
    icon: ClipboardList,
  },
]

export function Sidebar() {
  const pathname = usePathname()
  const { data: session } = useSession()
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 flex items-center gap-3">
        <Image
          src="/logo-formacap.png"
          alt="Formacap"
          width={140}
          height={47}
          className={cn("h-10 w-auto transition-all duration-300", collapsed && "h-8")}
        />
        {!collapsed && (
          <Button
            variant="ghost"
            size="icon"
            className="ml-auto hidden lg:flex text-gray-400 hover:text-white"
            onClick={() => setCollapsed(true)}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
        )}
      </div>

      <Separator className="bg-white/5" />

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                isActive
                  ? "bg-[#E8541A]/10 text-[#E8541A] border border-[#E8541A]/20"
                  : "text-gray-400 hover:text-white hover:bg-white/5"
              )}
            >
              <item.icon className={cn("h-5 w-5 flex-shrink-0", isActive && "text-[#E8541A]")} />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          )
        })}
      </nav>

      <Separator className="bg-white/5" />

      {/* User section */}
      <div className="p-4">
        {!collapsed && session?.user && (
          <div className="mb-3 px-1 flex items-center justify-between">
            <div className="min-w-0">
              <p className="text-sm font-medium text-white truncate">{session.user.name}</p>
              <p className="text-xs text-gray-500 truncate">{session.user.email}</p>
            </div>
            <ThemeToggle />
          </div>
        )}
        <Button
          variant="ghost"
          className={cn(
            "w-full justify-start text-gray-400 hover:text-red-400 hover:bg-red-500/10",
            collapsed && "justify-center"
          )}
          onClick={() => signOut({ callbackUrl: "/login" })}
        >
          <LogOut className="h-4 w-4 mr-2" />
          {!collapsed && "Cerrar Sesión"}
        </Button>
      </div>
    </div>
  )

  return (
    <>
      {/* Mobile toggle */}
      <Button
        variant="ghost"
        size="icon"
        className="fixed top-4 left-4 z-50 lg:hidden text-white bg-[#1A1A1A] border border-white/10"
        onClick={() => setMobileOpen(!mobileOpen)}
      >
        {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </Button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 w-64 bg-[#1A1A1A] border-r border-white/5 transform transition-transform duration-300 lg:hidden",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {sidebarContent}
      </aside>

      {/* Desktop sidebar */}
      <aside
        className={cn(
          "hidden lg:flex flex-col h-screen bg-[#1A1A1A] border-r border-white/5 transition-all duration-300 sticky top-0",
          collapsed ? "w-[70px]" : "w-64"
        )}
      >
        {collapsed && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute -right-3 top-6 z-10 h-6 w-6 rounded-full bg-[#1A1A1A] border border-white/10 text-gray-400 hover:text-white"
            onClick={() => setCollapsed(false)}
          >
            <ChevronLeft className="h-3 w-3 rotate-180" />
          </Button>
        )}
        {sidebarContent}
      </aside>
    </>
  )
}
