import { createClient } from "@supabase/supabase-js"

// Create a separate client for storage operations
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const storageClient = createClient(supabaseUrl, supabaseKey)

export class StorageService {
  private static bucketName = "po-documents"

  static async createBucketIfNotExists(): Promise<void> {
    try {
      // Check if bucket exists
      const { data: buckets, error: listError } = await storageClient.storage.listBuckets()

      if (listError) {
        console.warn("Could not list buckets:", listError.message)
        return
      }

      const bucketExists = buckets?.some((bucket) => bucket.name === this.bucketName)

      if (!bucketExists) {
        const { error: createError } = await storageClient.storage.createBucket(this.bucketName, {
          public: true,
          allowedMimeTypes: ["application/pdf"],
          fileSizeLimit: 10485760, // 10MB
        })

        if (createError) {
          console.warn("Could not create bucket:", createError.message)
        } else {
          console.log("Storage bucket created successfully")
        }
      }
    } catch (error) {
      console.warn("Storage setup error:", error)
    }
  }

  static async uploadPDF(file: File, userId: string, poId: string): Promise<{ path: string; url: string }> {
    try {
      if (!file) {
        throw new Error("No file provided")
      }

      if (!userId) {
        throw new Error("User ID is required")
      }

      await this.createBucketIfNotExists()

      const fileExt = file.name.split(".").pop()
      const fileName = `${poId}_${Date.now()}.${fileExt}`
      const filePath = `${userId}/${fileName}`

      console.log("Uploading file to path:", filePath)

      const { data, error } = await storageClient.storage.from(this.bucketName).upload(filePath, file, {
        cacheControl: "3600",
        upsert: false,
      })

      if (error) {
        console.error("Upload error:", error)
        throw new Error(`Upload failed: ${error.message}`)
      }

      if (!data?.path) {
        throw new Error("Upload succeeded but no path returned")
      }

      // Get public URL
      const { data: urlData } = storageClient.storage.from(this.bucketName).getPublicUrl(filePath)

      console.log("File uploaded successfully:", data.path)

      return {
        path: filePath,
        url: urlData.publicUrl,
      }
    } catch (error) {
      console.error("Error uploading PDF:", error)
      throw error
    }
  }

  static async downloadPDF(filePath: string, fileName: string): Promise<void> {
    try {
      if (!filePath) {
        throw new Error("File path is required")
      }

      if (!fileName) {
        throw new Error("File name is required")
      }

      console.log("Downloading file from path:", filePath)

      const { data, error } = await storageClient.storage.from(this.bucketName).download(filePath)

      if (error) {
        console.error("Download error:", error)
        throw new Error(`Download failed: ${error.message}`)
      }

      if (!data) {
        throw new Error("No file data received")
      }

      // Create download link
      const url = URL.createObjectURL(data)
      const a = document.createElement("a")
      a.href = url
      a.download = fileName
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      console.log("File downloaded successfully")
    } catch (error) {
      console.error("Error downloading PDF:", error)
      throw error
    }
  }

  static async deletePDF(filePath: string): Promise<void> {
    try {
      if (!filePath) {
        throw new Error("File path is required")
      }

      console.log("Deleting file from path:", filePath)

      const { error } = await storageClient.storage.from(this.bucketName).remove([filePath])

      if (error) {
        console.error("Delete error:", error)
        throw new Error(`Delete failed: ${error.message}`)
      }

      console.log("File deleted successfully")
    } catch (error) {
      console.error("Error deleting PDF:", error)
      throw error
    }
  }

  static getPublicUrl(filePath: string): string {
    if (!filePath) {
      return ""
    }

    const { data } = storageClient.storage.from(this.bucketName).getPublicUrl(filePath)
    return data.publicUrl
  }
}

// Export individual functions for easier importing
export const uploadPDF = StorageService.uploadPDF.bind(StorageService)
export const downloadPDF = StorageService.downloadPDF.bind(StorageService)
export const deletePDF = StorageService.deletePDF.bind(StorageService)
export const getPublicUrl = StorageService.getPublicUrl.bind(StorageService)
export const createBucketIfNotExists = StorageService.createBucketIfNotExists.bind(StorageService)

// Default export
export default StorageService
