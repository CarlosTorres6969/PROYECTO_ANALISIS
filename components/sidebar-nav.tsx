"use client"

import type React from "react"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar"
import { LayoutDashboard, Bus, MapPin, Route, CalendarDays, Users, DollarSign, Ticket } from "lucide-react"

interface SidebarNavProps extends React.HTMLAttributes<HTMLElement> {
  items: {
    href: string
    title: string
    icon: React.ElementType
  }[]
}

export function SidebarNav({ items, className, ...props }: SidebarNavProps) {
  const pathname = usePathname()

  return (
    <nav className={cn("flex space-x-2 lg:flex-col lg:space-x-0 lg:space-y-1", className)} {...props}>
      <SidebarMenu>
        {items.map((item) => (
          <SidebarMenuItem key={item.href}>
            <SidebarMenuButton asChild isActive={pathname === item.href}>
              <Link href={item.href}>
                <item.icon className="h-4 w-4" />
                <span>{item.title}</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    </nav>
  )
}

export const dashboardNavItems = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Autobuses",
    href: "/dashboard/buses",
    icon: Bus,
  },
  {
    title: "Estaciones",
    href: "/dashboard/stations",
    icon: MapPin,
  },
  {
    title: "Rutas",
    href: "/dashboard/routes",
    icon: Route,
  },
  {
    title: "Viajes",
    href: "/dashboard/trips",
    icon: CalendarDays,
  },
  {
    title: "Usuarios",
    href: "/dashboard/users",
    icon: Users,
  },
  {
    title: "Pagos",
    href: "/dashboard/payments",
    icon: DollarSign,
  },
  {
    title: "Boletos",
    href: "/dashboard/tickets",
    icon: Ticket,
  },
]
