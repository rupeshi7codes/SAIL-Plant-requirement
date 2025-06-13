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
import { uploadFile, deleteFile } from "@/lib/file-storage"

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
      // Return null for File objects - we'll handle them separately
      return null
    }

    const result: Record<string, any> = {}
    for (const key in data) {
      if (Object.prototype.hasOwnProperty.call(data, key) && key !== "pdfFile") {
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
      // Handle file uploads for POs
      if (newData.pos) {
        const updatedPOs = [...newData.pos]

        for (let i = 0; i < updatedPOs.length; i++) {
          const po = updatedPOs[i]

          // If this PO has a new file to upload
          if (po.pdfFile instanceof File) {
            // Delete the old file if it exists
            if (po.filePath) {
              try {
                await deleteFile(po.filePath)
              } catch (error) {
                console.error("Error deleting old file:", error)
              }
            }

            // Upload the new file
            const filePath = `users/${user.uid}/pos/${po.id}/${po.pdfFile.name}`
            const { url, path } = await uploadFile(po.pdfFile, filePath)

            // Update the PO with the file info
            updatedPOs[i] = {
              ...po,
              fileUrl: url,
              filePath: path,
              fileName: po.pdfFile.name,
              pdfFile: null, // Remove the File object
            }
          }
        }

        // Update newData with the updated POs
        newData.pos = updatedPOs
      }

      // Update local state first
      const updatedData = { ...userData, ...newData }
      setUserData(updatedData)

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
