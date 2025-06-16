"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Download, FileText, Loader2 } from "lucide-react"
import { StorageService } from "@/lib/storage"

interface PDFDownloadButtonProps {
  pdfFileUrl?: string
  pdfFileName?: string
  poNumber: string
}

export default function PDFDownloadButton({ pdfFileUrl, pdfFileName, poNumber }: PDFDownloadButtonProps) {
  const [downloading, setDownloading] = useState(false)

  const handleDownload = async () => {
    if (!pdfFileUrl) return

    try {
      setDownloading(true)
      const fileName = pdfFileName || `${poNumber}.pdf`
      await StorageService.downloadPDF(pdfFileUrl, fileName)
    } catch (error) {
      console.error("Download error:", error)
      alert("Error downloading file. Please try again.")
    } finally {
      setDownloading(false)
    }
  }

  if (!pdfFileUrl) {
    return (
      <Button variant="outline" size="sm" disabled>
        <FileText className="h-4 w-4 mr-2" />
        No PDF
      </Button>
    )
  }

  return (
    <Button variant="outline" size="sm" onClick={handleDownload} disabled={downloading}>
      {downloading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Download className="h-4 w-4 mr-2" />}
      {downloading ? "Downloading..." : "Download PDF"}
    </Button>
  )
}
