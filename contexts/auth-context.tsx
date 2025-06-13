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
import { validateUserData } from "@/lib/data-validator"
import { debugLog } from "@/lib/debug-logger"

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

// Helper function to remove File objects from data
const removeFileObjects = (data: any): any => {
  if (!data) return data

  if (Array.isArray(data)) {
    return data.map((item) => removeFileObjects(item))
  }

  if (typeof data === "object" && data !== null) {
    if (data instanceof File) {
      // Return a placeholder for File objects
      return {
        _fileMetadata: {
          name: data.name,
          type: data.type,
          size: data.size,
          lastModified: data.lastModified,
        },
      }
    }

    const result: Record<string, any> = {}
    for (const key in data) {
      if (Object.prototype.hasOwnProperty.call(data, key)) {
        result[key] = removeFileObjects(data[key])
      }
    }
    return result
  }

  return data
}

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
      debugLog("Fetching user data for:", uid)
      const userDocRef = doc(db, "users", uid)
      const userDocSnap = await getDoc(userDocRef)

      if (userDocSnap.exists()) {
        const rawData = userDocSnap.data()
        debugLog("Raw data from Firestore:", rawData)

        // Validate and fix data structure if needed
        const validatedData = validateUserData(rawData)

        // Restore File objects from local storage if available
        const localPOFiles = JSON.parse(localStorage.getItem(`poFiles_${uid}`) || "{}")

        if (validatedData.pos && validatedData.pos.length > 0) {
          validatedData.pos = validatedData.pos.map((po: any) => {
            if (po._fileMetadata && localPOFiles[po.id]) {
              // Try to restore the file from local storage
              try {
                const fileData = localPOFiles[po.id]
                // We can't recreate the actual File object, but we can store the metadata
                po.pdfFile = fileData
              } catch (e) {
                console.error("Failed to restore file from local storage", e)
              }
            }
            return po
          })
        }

        setUserData(validatedData)
        debugLog("User data set after validation:", validatedData)
      } else {
        debugLog("No user document found, creating new one")
        // Create a new document for the user if it doesn't exist
        const newUserData = {
          requirements: [],
          pos: [],
          supplyHistory: [],
          createdAt: serverTimestamp(),
          lastUpdated: serverTimestamp(),
        }

        await setDoc(userDocRef, newUserData)
        setUserData(defaultUserData)
      }
    } catch (error) {
      console.error("Error fetching user data:", error)
      debugLog("Error in fetchUserData:", error)
      // Set default data on error to prevent undefined errors
      setUserData(defaultUserData)
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
      // Update local state first
      const updatedData = { ...userData, ...newData }
      setUserData(updatedData)

      // Store PDF files in local storage
      if (newData.pos) {
        const localPOFiles: Record<string, any> = JSON.parse(localStorage.getItem(`poFiles_${user.uid}`) || "{}")

        newData.pos.forEach((po: any) => {
          if (po.pdfFile instanceof File) {
            // Store file metadata in local storage
            localPOFiles[po.id] = {
              name: po.pdfFile.name,
              type: po.pdfFile.type,
              size: po.pdfFile.size,
              lastModified: po.pdfFile.lastModified,
            }
          }
        })

        localStorage.setItem(`poFiles_${user.uid}`, JSON.stringify(localPOFiles))
      }

      // Remove File objects before saving to Firestore
      const cleanData = removeFileObjects(newData)
      debugLog("Cleaned data for Firestore:", cleanData)

      const userDocRef = doc(db, "users", user.uid)

      // Check if document exists first
      const docSnap = await getDoc(userDocRef)

      if (docSnap.exists()) {
        // Update existing document
        await updateDoc(userDocRef, {
          ...cleanData,
          lastUpdated: serverTimestamp(),
        })
      } else {
        // Create new document with all data
        const cleanFullData = removeFileObjects(updatedData)
        await setDoc(userDocRef, {
          ...cleanFullData,
          createdAt: serverTimestamp(),
          lastUpdated: serverTimestamp(),
        })
      }
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
