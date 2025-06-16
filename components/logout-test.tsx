"use client"

import { Button } from "@/components/ui/button"
import { useAuth } from "@/contexts/auth-context"
import { useRouter } from "next/navigation"
import { useState } from "react"

export default function LogoutTest() {
  const { logout, user } = useAuth()
  const router = useRouter()
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  const handleTestLogout = async () => {
    try {
      setIsLoggingOut(true)
      console.log("Test logout started...")
      console.log("Current user:", user)

      await logout()
      console.log("Logout completed successfully")

      // Force redirect
      router.push("/login")
    } catch (error) {
      console.error("Test logout error:", error)
      // Force redirect even on error
      router.push("/login")
    } finally {
      setIsLoggingOut(false)
    }
  }

  return (
    <div className="p-4 border rounded-lg">
      <h3 className="text-lg font-semibold mb-2">Logout Test</h3>
      <p className="text-sm text-gray-600 mb-4">Current user: {user?.email || "Not logged in"}</p>
      <Button onClick={handleTestLogout} disabled={isLoggingOut} variant="destructive">
        {isLoggingOut ? "Logging out..." : "Test Logout"}
      </Button>
    </div>
  )
}
