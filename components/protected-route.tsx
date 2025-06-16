"use client"

import type React from "react"
import { useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"

interface ProtectedRouteProps {
  children: React.ReactNode
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const router = useRouter()
  const pathname = usePathname()
  const { user } = useAuth()

  useEffect(() => {
    if (!user && pathname !== "/login") {
      router.push("/login")
    } else if (user && pathname === "/login") {
      router.push("/")
    }
  }, [user, pathname, router])

  // Show login page if not authenticated and on login route
  if (!user && pathname === "/login") {
    return <>{children}</>
  }

  // Show app if authenticated
  if (user && pathname !== "/login") {
    return <>{children}</>
  }

  // Show nothing while redirecting
  return null
}
