"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"

interface User {
  email: string
  name: string
}

interface UserData {
  requirements: any[]
  pos: any[]
  supplyHistory: any[]
}

interface AuthContextType {
  user: User | null
  userData: UserData
  login: (email: string) => void
  logout: () => void
  updateUserData: (data: Partial<UserData>) => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [userData, setUserData] = useState<UserData>({
    requirements: [],
    pos: [],
    supplyHistory: [],
  })

  // Load user data on mount
  useEffect(() => {
    const savedUser = localStorage.getItem("currentUser")
    if (savedUser) {
      const parsedUser = JSON.parse(savedUser)
      setUser(parsedUser)
      // Check if user data exists and load it, otherwise initialize with empty data
      const userDataKey = `userData_${parsedUser.email}`
      const savedData = localStorage.getItem(userDataKey)
      if (savedData) {
        const parsedData = JSON.parse(savedData)
        setUserData(parsedData)
      } else {
        // Initialize with default data for new users
        const defaultData = {
          requirements: [],
          pos: [],
          supplyHistory: [],
        }
        setUserData(defaultData)
        localStorage.setItem(userDataKey, JSON.stringify(defaultData))
      }
    }
  }, [])

  const login = (email: string) => {
    const name = email.split("@")[0]
    const userObj = {
      email,
      name: name.charAt(0).toUpperCase() + name.slice(1),
    }
    setUser(userObj)
    localStorage.setItem("currentUser", JSON.stringify(userObj))
    localStorage.setItem("isLoggedIn", "true")

    // Check if user data exists and load it, otherwise initialize with empty data
    const userDataKey = `userData_${email}`
    const savedData = localStorage.getItem(userDataKey)
    if (savedData) {
      const parsedData = JSON.parse(savedData)
      setUserData(parsedData)
    } else {
      // Initialize with default data for new users
      const defaultData = {
        requirements: [],
        pos: [],
        supplyHistory: [],
      }
      setUserData(defaultData)
      localStorage.setItem(userDataKey, JSON.stringify(defaultData))
    }
  }

  const logout = () => {
    if (user) {
      // Always save current data before logging out
      const userDataKey = `userData_${user.email}`
      localStorage.setItem(userDataKey, JSON.stringify(userData))
    }
    setUser(null)
    setUserData({ requirements: [], pos: [], supplyHistory: [] })
    localStorage.removeItem("currentUser")
    localStorage.removeItem("isLoggedIn")
  }

  const updateUserData = (newData: Partial<UserData>) => {
    const updatedData = { ...userData, ...newData }
    setUserData(updatedData)
    if (user) {
      const userDataKey = `userData_${user.email}`
      localStorage.setItem(userDataKey, JSON.stringify(updatedData))
    }
  }

  return (
    <AuthContext.Provider value={{ user, userData, login, logout, updateUserData }}>{children}</AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
