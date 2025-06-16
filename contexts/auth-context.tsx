"use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import type { User } from "@supabase/supabase-js"
import { supabase } from "@/lib/supabase"

interface AuthContextType {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  signup: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  pos: any[]
  requirements: any[]
  supplyHistory: any[]
  setPOs: (pos: any[]) => void
  setRequirements: (requirements: any[]) => void
  setSupplyHistory: (history: any[]) => void
  loadUserData: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Helper function to convert UTC date to local date string
const convertToLocalDate = (utcDateString: string): string => {
  try {
    const date = new Date(utcDateString)
    const day = date.getDate().toString().padStart(2, "0")
    const month = (date.getMonth() + 1).toString().padStart(2, "0")
    const year = date.getFullYear()
    return `${day}/${month}/${year}`
  } catch (error) {
    console.error("Error converting date:", error)
    // Fallback to current date
    const now = new Date()
    const day = now.getDate().toString().padStart(2, "0")
    const month = (now.getMonth() + 1).toString().padStart(2, "0")
    const year = now.getFullYear()
    return `${day}/${month}/${year}`
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [pos, setPOs] = useState<any[]>([])
  const [requirements, setRequirements] = useState<any[]>([])
  const [supplyHistory, setSupplyHistory] = useState<any[]>([])

  const loadUserData = async () => {
    if (!user) return

    try {
      console.log("Loading user data for:", user.id)

      // Load POs with PDF information
      const { data: posData, error: posError } = await supabase
        .from("purchase_orders")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })

      if (posError) {
        console.error("Error loading POs:", posError)
      } else {
        const transformedPOs = (posData || []).map((po) => ({
          id: po.id,
          poNumber: po.po_number,
          poDate: po.po_date,
          areaOfApplication: po.area_of_application,
          items: po.items || [],
          pdfFileUrl: po.pdf_file_url,
          pdfFileName: po.pdf_file_name,
          createdDate: convertToLocalDate(po.created_at), // Convert to local date
          created_at: po.created_at, // Keep original for sorting
        }))
        console.log("Loaded POs with local dates:", transformedPOs)
        setPOs(transformedPOs)
      }

      // Load Supply History first
      const { data: supplyData, error: supplyError } = await supabase
        .from("supply_history")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })

      let transformedSupply: any[] = []
      if (supplyError) {
        console.error("Error loading supply history:", supplyError)
      } else {
        transformedSupply = (supplyData || []).map((supply) => ({
          id: supply.id,
          reqId: supply.req_id,
          poNumber: supply.po_number,
          materialName: supply.material_name,
          quantity: supply.quantity,
          date: supply.date, // This should already be in DD/MM/YYYY format
          notes: supply.notes,
        }))
        console.log("Loaded supply history:", transformedSupply)
        setSupplyHistory(transformedSupply)
      }

      // Load Requirements and recalculate supply quantities
      const { data: reqData, error: reqError } = await supabase
        .from("requirements")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })

      if (reqError) {
        console.error("Error loading requirements:", reqError)
      } else {
        const transformedReqs = (reqData || []).map((req) => {
          // Get supply history for this requirement
          const reqSupplyEntries = transformedSupply.filter((entry) => entry.reqId === req.id)

          // Recalculate supply quantities for each item
          const updatedItems = (req.selected_items || []).map((item: any) => {
            const itemSupplies = reqSupplyEntries.filter((entry) => entry.materialName === item.materialName)
            const totalSupplied = itemSupplies.reduce((sum, entry) => sum + entry.quantity, 0)

            return {
              ...item,
              quantitySupplied: totalSupplied,
            }
          })

          // Recalculate status based on supply quantities
          const allCompleted = updatedItems.every((item: any) => (item.quantitySupplied || 0) >= item.quantityRequired)
          const hasPartialSupply = updatedItems.some((item: any) => (item.quantitySupplied || 0) > 0)

          let status = req.status
          if (allCompleted) {
            status = "Completed"
          } else if (hasPartialSupply) {
            status = "In Progress"
          } else {
            status = "Pending"
          }

          const transformedReq = {
            id: req.id,
            poNumber: req.po_number,
            areaOfApplication: req.area_of_application,
            deliveryDate: req.delivery_date,
            priority: req.priority,
            status: status,
            notes: req.notes,
            selectedItems: updatedItems,
            createdDate: convertToLocalDate(req.created_at), // Convert to local date
            created_at: req.created_at, // Keep original for sorting
          }

          // Update the requirement in database if status changed
          if (status !== req.status) {
            console.log(`Updating requirement ${req.id} status from ${req.status} to ${status}`)
            supabase
              .from("requirements")
              .update({
                selected_items: updatedItems,
                status: status,
              })
              .eq("id", req.id)
              .then(({ error }) => {
                if (error) {
                  console.error("Error updating requirement status:", error)
                } else {
                  console.log("Successfully updated requirement status")
                }
              })
          }

          return transformedReq
        })

        console.log("Loaded and recalculated requirements with local dates:", transformedReqs)
        setRequirements(transformedReqs)
      }
    } catch (error) {
      console.error("Error loading user data:", error)
    }
  }

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log("Initial session:", session?.user?.email)
      setUser(session?.user ?? null)
      setLoading(false)
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("Auth state changed:", event, session?.user?.email)
      setUser(session?.user ?? null)
      setLoading(false)

      if (session?.user) {
        // Load user data when user logs in
        setTimeout(() => {
          loadUserData()
        }, 100)
      } else {
        // Clear data on logout
        setPOs([])
        setRequirements([])
        setSupplyHistory([])
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  // Load data when user changes
  useEffect(() => {
    if (user && !loading) {
      loadUserData()
    }
  }, [user, loading])

  const login = async (email: string, password: string) => {
    try {
      console.log("Attempting login for:", email)
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      if (error) throw error
      console.log("Login successful")
    } catch (error) {
      console.error("Login error:", error)
      throw error
    }
  }

  const signup = async (email: string, password: string) => {
    try {
      console.log("Attempting signup for:", email)
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: email.split("@")[0],
          },
        },
      })
      if (error) throw error

      if (data.user && !data.session) {
        throw new Error("Please check your email for verification link")
      }
      console.log("Signup successful")
    } catch (error) {
      console.error("Signup error:", error)
      throw error
    }
  }

  const logout = async () => {
    try {
      console.log("Logging out...")
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      console.log("Logout successful")
    } catch (error) {
      console.error("Logout error:", error)
      throw error
    }
  }

  const value = {
    user,
    loading,
    login,
    signup,
    logout,
    pos,
    requirements,
    supplyHistory,
    setPOs,
    setRequirements,
    setSupplyHistory,
    loadUserData,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
