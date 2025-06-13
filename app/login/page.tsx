"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AuthForm } from "@/components/auth-form"
import { useAuth } from "@/contexts/auth-context"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"

export default function LoginPage() {
  const router = useRouter()
  const { login, signup, googleLogin, loading } = useAuth()
  const [activeTab, setActiveTab] = useState("login")
  const [error, setError] = useState<string | null>(null)

  const handleLogin = async (email: string, password: string) => {
    try {
      setError(null)
      await login(email, password)
      router.push("/")
    } catch (err: any) {
      setError(err.message || "Failed to login. Please check your credentials.")
    }
  }

  const handleSignup = async (email: string, password: string) => {
    try {
      setError(null)
      await signup(email, password)
      router.push("/")
    } catch (err: any) {
      setError(err.message || "Failed to create account. Please try again.")
    }
  }

  const handleGoogleLogin = async () => {
    try {
      setError(null)
      await googleLogin()
      router.push("/")
    } catch (err: any) {
      setError(err.message || "Failed to login with Google. Please try again.")
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">SRU Material Management</h1>
          <p className="text-gray-600 mt-2">Durgapur Steel Plant</p>
        </div>

        <Card className="border-none shadow-lg">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <CardHeader className="pb-2">
              <TabsList className="grid w-full grid-cols-2 mb-4">
                <TabsTrigger value="login">Login</TabsTrigger>
                <TabsTrigger value="signup">Sign Up</TabsTrigger>
              </TabsList>
            </CardHeader>

            <CardContent className="space-y-4 pt-4">
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <TabsContent value="login" className="mt-0">
                <AuthForm type="login" onSubmit={handleLogin} onGoogleAuth={handleGoogleLogin} isLoading={loading} />
              </TabsContent>
              <TabsContent value="signup" className="mt-0">
                <AuthForm type="signup" onSubmit={handleSignup} onGoogleAuth={handleGoogleLogin} isLoading={loading} />
              </TabsContent>
            </CardContent>

            <CardFooter className="flex flex-col space-y-4 border-t pt-6">
              <div className="text-center text-sm text-gray-600">
                By continuing, you agree to our{" "}
                <a href="#" className="underline hover:text-blue-600">
                  Terms of Service
                </a>{" "}
                and{" "}
                <a href="#" className="underline hover:text-blue-600">
                  Privacy Policy
                </a>
                .
              </div>
            </CardFooter>
          </Tabs>
        </Card>
      </div>

      {/* Decorative elements */}
      <div className="hidden lg:block fixed top-0 left-0 w-1/2 h-full bg-gradient-to-br from-blue-50 to-blue-100 -z-10 rounded-r-3xl" />
      <div className="hidden lg:block fixed bottom-0 right-0 w-96 h-96 bg-gradient-to-br from-blue-100 to-blue-200 -z-10 rounded-tl-full opacity-70" />
    </div>
  )
}
