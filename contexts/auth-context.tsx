"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
} from "firebase/auth"
import { doc, setDoc, getDoc, updateDoc, serverTimestamp } from "firebase/firestore"
import { auth, db } from "@/lib/firebase"

interface User {
  uid: string
  email: string | null
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
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  googleLogin: () => Promise<void>
  signup: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  updateUserData: (data: Partial<UserData>) => Promise<void>
}

const defaultUserData: UserData = {
  requirements: [],
  pos: [],
  supplyHistory: [],
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [userData, setUserData] = useState<UserData>(defaultUserData)
  const [loading, setLoading] = useState(true)

  // Listen for auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // User is signed in
        const userProfile: User = {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          name: firebaseUser.displayName || firebaseUser.email?.split("@")[0] || "User",
        }
        setUser(userProfile)

        // Fetch user data from Firestore
        await fetchUserData(firebaseUser.uid)
      } else {
        // User is signed out
        setUser(null)
        setUserData(defaultUserData)
      }
      setLoading(false)
    })

    // Cleanup subscription
    return () => unsubscribe()
  }, [])

  // Fetch user data from Firestore
  const fetchUserData = async (uid: string) => {
    try {
      const userDocRef = doc(db, "users", uid)
      const userDocSnap = await getDoc(userDocRef)

      if (userDocSnap.exists()) {
        const data = userDocSnap.data() as UserData
        setUserData(data)
      } else {
        // Create a new document for the user if it doesn't exist
        await setDoc(userDocRef, {
          ...defaultUserData,
          createdAt: serverTimestamp(),
          lastUpdated: serverTimestamp(),
        })
        setUserData(defaultUserData)
      }
    } catch (error) {
      console.error("Error fetching user data:", error)
    }
  }

  // Sign up with email and password
  const signup = async (email: string, password: string) => {
    try {
      setLoading(true)
      const userCredential = await createUserWithEmailAndPassword(auth, email, password)
      const firebaseUser = userCredential.user

      // Create user document in Firestore
      const userDocRef = doc(db, "users", firebaseUser.uid)
      await setDoc(userDocRef, {
        ...defaultUserData,
        email: firebaseUser.email,
        createdAt: serverTimestamp(),
        lastUpdated: serverTimestamp(),
      })
    } catch (error) {
      console.error("Error signing up:", error)
      throw error
    } finally {
      setLoading(false)
    }
  }

  // Sign in with email and password
  const login = async (email: string, password: string) => {
    try {
      setLoading(true)
      await signInWithEmailAndPassword(auth, email, password)
    } catch (error) {
      console.error("Error signing in:", error)
      throw error
    } finally {
      setLoading(false)
    }
  }

  // Sign in with Google
  const googleLogin = async () => {
    try {
      setLoading(true)
      const provider = new GoogleAuthProvider()
      const userCredential = await signInWithPopup(auth, provider)
      const firebaseUser = userCredential.user

      // Check if user document exists, create if not
      const userDocRef = doc(db, "users", firebaseUser.uid)
      const userDocSnap = await getDoc(userDocRef)

      if (!userDocSnap.exists()) {
        await setDoc(userDocRef, {
          ...defaultUserData,
          email: firebaseUser.email,
          createdAt: serverTimestamp(),
          lastUpdated: serverTimestamp(),
        })
      }
    } catch (error) {
      console.error("Error signing in with Google:", error)
      throw error
    } finally {
      setLoading(false)
    }
  }

  // Sign out
  const logout = async () => {
    try {
      await signOut(auth)
    } catch (error) {
      console.error("Error signing out:", error)
      throw error
    }
  }

  // Update user data in Firestore
  const updateUserData = async (newData: Partial<UserData>) => {
    if (!user) return

    try {
      const updatedData = { ...userData, ...newData }
      setUserData(updatedData)

      const userDocRef = doc(db, "users", user.uid)
      await updateDoc(userDocRef, {
        ...newData,
        lastUpdated: serverTimestamp(),
      })
    } catch (error) {
      console.error("Error updating user data:", error)
      throw error
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        userData,
        loading,
        login,
        googleLogin,
        signup,
        logout,
        updateUserData,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
