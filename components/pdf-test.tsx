"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { uploadPDF, downloadPDF } from "@/lib/storage"

export default function PDFTest() {
  const [file, setFile] = useState<File | null>(null)
  const [uploadResult, setUploadResult] = useState<string>("")
  const [downloadUrl, setDownloadUrl] = useState<string>("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string>("")

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile && selectedFile.type === "application/pdf") {
      setFile(selectedFile)
      setError("")
    } else {
      setError("Please select a PDF file")
      setFile(null)
    }
  }

  const handleUpload = async () => {
    if (!file) {
      setError("Please select a file first")
      return
    }

    setLoading(true)
    setError("")

    try {
      const result = await uploadPDF(file, `test-${Date.now()}.pdf`)
      setUploadResult(result)
      console.log("Upload successful:", result)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Upload failed"
      setError(errorMessage)
      console.error("Upload error:", err)
    } finally {
      setLoading(false)
    }
  }

  const handleDownload = async () => {
    if (!uploadResult) {
      setError("No file uploaded yet")
      return
    }

    setLoading(true)
    setError("")

    try {
      const url = await downloadPDF(uploadResult)
      setDownloadUrl(url)
      console.log("Download URL generated:", url)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Download failed"
      setError(errorMessage)
      console.error("Download error:", err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>PDF Storage Test</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="pdf-file">Select PDF File</Label>
          <Input id="pdf-file" type="file" accept=".pdf" onChange={handleFileChange} disabled={loading} />
        </div>

        <div className="flex gap-2">
          <Button onClick={handleUpload} disabled={!file || loading}>
            {loading ? "Uploading..." : "Upload PDF"}
          </Button>

          <Button onClick={handleDownload} disabled={!uploadResult || loading} variant="outline">
            {loading ? "Generating..." : "Get Download URL"}
          </Button>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {uploadResult && (
          <Alert>
            <AlertDescription>
              <strong>Upload Success:</strong> {uploadResult}
            </AlertDescription>
          </Alert>
        )}

        {downloadUrl && (
          <Alert>
            <AlertDescription>
              <strong>Download URL:</strong>{" "}
              <a href={downloadUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                Open PDF
              </a>
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  )
}
