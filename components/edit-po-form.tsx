"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { X, Plus, Trash2, Upload, FileText, Download, Loader2 } from "lucide-react"
import { StorageService } from "@/lib/storage"
import { useAuth } from "@/contexts/auth-context"

interface EditPOFormProps {
  po: any
  onSubmit: (po: any) => void
  onClose: () => void
}

export default function EditPOForm({ po, onSubmit, onClose }: EditPOFormProps) {
  const { user } = useAuth()
  const [formData, setFormData] = useState({
    ...po,
    items: po.items.map((item: any) => ({ ...item })),
  })
  const [pdfFile, setPdfFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const validItems = formData.items.filter((item: any) => item.materialName && item.quantity)
    if (validItems.length === 0) {
      alert("Please add at least one item with material name and quantity")
      return
    }

    try {
      setUploading(true)

      let pdfFileUrl = formData.pdfFileUrl
      let pdfFileName = formData.pdfFileName

      // Upload new PDF if provided
      if (pdfFile && user) {
        try {
          // Delete old PDF if exists
          if (formData.pdfFileUrl) {
            try {
              await StorageService.deletePDF(formData.pdfFileUrl)
            } catch (error) {
              console.warn("Could not delete old PDF:", error)
            }
          }

          const uploadResult = await StorageService.uploadPDF(pdfFile, user.uid, formData.id)
          pdfFileUrl = uploadResult.path
          pdfFileName = pdfFile.name
        } catch (error) {
          console.error("PDF upload error:", error)
          // Continue with existing PDF if upload fails
        }
      }

      const updatedPO = {
        ...formData,
        items: validItems.map((item: any) => ({
          ...item,
          quantity: Number.parseInt(item.quantity.toString()),
          balanceQty: Number.parseInt(item.balanceQty.toString()),
        })),
        pdfFileUrl,
        pdfFileName,
      }

      onSubmit(updatedPO)
    } catch (error) {
      console.error("Error updating PO:", error)
      alert("Error uploading PDF file. Please try again.")
    } finally {
      setUploading(false)
    }
  }

  const addItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { materialName: "", quantity: "", balanceQty: "", unit: "pcs" }],
    })
  }

  const removeItem = (index: number) => {
    setFormData({
      ...formData,
      items: formData.items.filter((_: any, i: number) => i !== index),
    })
  }

  const updateItem = (index: number, field: string, value: string) => {
    const updatedItems = formData.items.map((item: any, i: number) => {
      if (i === index) {
        const updatedItem = { ...item, [field]: value }
        if (field === "quantity") {
          updatedItem.balanceQty = value
        }
        return updatedItem
      }
      return item
    })
    setFormData({ ...formData, items: updatedItems })
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && file.type === "application/pdf") {
      if (file.size > 10 * 1024 * 1024) {
        alert("File size must be less than 10MB")
        return
      }
      setPdfFile(file)
    } else {
      alert("Please select a PDF file")
    }
  }

  const handleFileRemove = () => {
    setPdfFile(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const handleExistingFileDownload = async () => {
    if (formData.pdfFileUrl && formData.pdfFileName) {
      try {
        await StorageService.downloadPDF(formData.pdfFileUrl, formData.pdfFileName)
      } catch (error) {
        console.error("Error downloading file:", error)
        alert("Error downloading file. Please try again.")
      }
    }
  }

  const handleNewFileDownload = () => {
    if (pdfFile) {
      const url = URL.createObjectURL(pdfFile)
      const a = document.createElement("a")
      a.href = url
      a.download = pdfFile.name
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    }
  }

  const units = ["pcs", "kgs", "set"]

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-5xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Edit Purchase Order</CardTitle>
            <CardDescription>Modify PO details and items</CardDescription>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} disabled={uploading}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="poNumber">PO Number *</Label>
                <Input
                  id="poNumber"
                  value={formData.poNumber}
                  onChange={(e) => setFormData({ ...formData, poNumber: e.target.value })}
                  placeholder="PO-2024-XXX"
                  required
                  disabled={uploading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="poDate">PO Date *</Label>
                <Input
                  id="poDate"
                  type="date"
                  value={formData.poDate}
                  onChange={(e) => setFormData({ ...formData, poDate: e.target.value })}
                  required
                  disabled={uploading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="areaOfApplication">Area of Application *</Label>
                <Input
                  id="areaOfApplication"
                  value={formData.areaOfApplication}
                  onChange={(e) => setFormData({ ...formData, areaOfApplication: e.target.value })}
                  placeholder="e.g., Blast Furnace - Hearth Lining"
                  required
                  disabled={uploading}
                />
              </div>
            </div>

            {/* PDF Upload Section */}
            <div className="space-y-4">
              <Label className="text-lg font-medium">PO Document</Label>

              {/* Existing PDF */}
              {formData.pdfFileUrl && !pdfFile && (
                <div className="border-2 border-gray-300 rounded-lg p-4">
                  <div className="flex items-center justify-between p-4 bg-blue-50 rounded">
                    <div className="flex items-center gap-3">
                      <FileText className="h-8 w-8 text-blue-600" />
                      <div>
                        <p className="font-medium text-blue-900">Current Document</p>
                        <p className="text-sm text-blue-700">{formData.pdfFileName || "PO Document"}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleExistingFileDownload}
                        disabled={uploading}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => fileInputRef.current?.click()}
                        className="flex items-center gap-2"
                        disabled={uploading}
                      >
                        <Upload className="h-4 w-4" />
                        Replace
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* New PDF Upload */}
              {(!formData.pdfFileUrl || pdfFile) && (
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
                  {!pdfFile ? (
                    <div className="text-center">
                      <Upload className="mx-auto h-12 w-12 text-gray-400" />
                      <div className="mt-4">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => fileInputRef.current?.click()}
                          className="flex items-center gap-2"
                          disabled={uploading}
                        >
                          <Upload className="h-4 w-4" />
                          Upload PO PDF
                        </Button>
                        <p className="mt-2 text-sm text-gray-600">
                          Upload the original PO document (PDF only, max 10MB)
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded">
                      <div className="flex items-center gap-3">
                        <FileText className="h-8 w-8 text-red-600" />
                        <div>
                          <p className="font-medium">{pdfFile.name}</p>
                          <p className="text-sm text-gray-600">{(pdfFile.size / 1024 / 1024).toFixed(2)} MB</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={handleNewFileDownload}
                          disabled={uploading}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={handleFileRemove}
                          disabled={uploading}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf"
                onChange={handleFileUpload}
                className="hidden"
                disabled={uploading}
              />
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-lg font-medium">PO Items</Label>
                <Button type="button" onClick={addItem} variant="outline" size="sm" disabled={uploading}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Item
                </Button>
              </div>

              <div className="space-y-4">
                {formData.items.map((item: any, index: number) => (
                  <Card key={index} className="p-4">
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
                      <div className="space-y-2">
                        <Label>Material Name *</Label>
                        <Input
                          value={item.materialName}
                          onChange={(e) => updateItem(index, "materialName", e.target.value)}
                          placeholder="Enter custom material name"
                          required
                          disabled={uploading}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Total Quantity *</Label>
                        <Input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => updateItem(index, "quantity", e.target.value)}
                          placeholder="Enter quantity"
                          required
                          disabled={uploading}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Balance Quantity *</Label>
                        <Input
                          type="number"
                          value={item.balanceQty}
                          onChange={(e) => updateItem(index, "balanceQty", e.target.value)}
                          placeholder="Enter balance"
                          required
                          disabled={uploading}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Unit *</Label>
                        <Select
                          value={item.unit}
                          onValueChange={(value) => updateItem(index, "unit", value)}
                          disabled={uploading}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {units.map((unit) => (
                              <SelectItem key={unit} value={unit}>
                                {unit}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeItem(index)}
                          className="text-red-600 hover:text-red-700"
                          disabled={uploading}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={onClose} disabled={uploading}>
                Cancel
              </Button>
              <Button type="submit" disabled={uploading}>
                {uploading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Updating PO...
                  </>
                ) : (
                  "Update PO"
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
