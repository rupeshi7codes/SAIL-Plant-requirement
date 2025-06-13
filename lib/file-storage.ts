import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage"
import { storage } from "./firebase"
import { debugLog } from "./debug-logger"

// Upload a file to Firebase Storage
export const uploadFile = async (file: File, path: string): Promise<{ url: string; path: string }> => {
  try {
    debugLog(`Uploading file ${file.name} to ${path}`)
    const storageRef = ref(storage, path)
    const snapshot = await uploadBytes(storageRef, file)
    const url = await getDownloadURL(snapshot.ref)

    debugLog(`File uploaded successfully to ${path}`)
    return { url, path }
  } catch (error) {
    console.error("Error uploading file:", error)
    throw error
  }
}

// Delete a file from Firebase Storage
export const deleteFile = async (path: string): Promise<void> => {
  try {
    debugLog(`Deleting file at ${path}`)
    const storageRef = ref(storage, path)
    await deleteObject(storageRef)
    debugLog(`File deleted successfully from ${path}`)
  } catch (error) {
    console.error("Error deleting file:", error)
    throw error
  }
}

// Get download URL for a file
export const getFileUrl = async (path: string): Promise<string> => {
  try {
    debugLog(`Getting download URL for ${path}`)
    const storageRef = ref(storage, path)
    const url = await getDownloadURL(storageRef)
    return url
  } catch (error) {
    console.error("Error getting file URL:", error)
    throw error
  }
}
