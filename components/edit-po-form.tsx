"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { X, Plus, Trash2, Upload, FileText, Download } from "lucide-react"

interface EditPOFormProps {
  po: any
  onSubmit: (po: any) => void
  onClose: () => void
}

export default function EditPOForm({ po, onSubmit, onClose }: EditPOFormProps) {
  const [formData, setFormData] = useState({
    ...po,
    items: po.items.map((item: any) => ({ ...item })),
  })
  const [pdfFile, setPdfFile] = useState<File | null>(null)
  const [fileUrl, setFileUrl] = useState<string | null>(po.fileUrl || null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const validItems = formData.items.filter((item: any) => item.materialName && item.quantity)
      if (validItems.length === 0) {
        alert("Please add at least one item with material name and quantity")
        setIsSubmitting(false)
        return
      }

      onSubmit({
        ...formData,
        items: validItems.map((item: any) => ({
          ...item,
          quantity: Number.parseInt(item.quantity.toString()),
          balanceQty: Number.parseInt(item.balanceQty.toString()),
        })),
        pdfFile: pdfFile,
        fileUrl: fileUrl,
        // Keep the existing filePath if we're not uploading a new file
        filePath: pdfFile ? null : po.filePath,
      })
    } catch (error) {
      console.error("Error submitting form:", error)
      alert("An error occurred while updating the PO. Please try again.")
      setIsSubmitting(false)
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
        // If quantity is updated, update balance accordingly
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
      setPdfFile(file)
      setFileUrl(null) // Clear the existing URL since we're uploading a new file
    } else {
      alert("Please select a PDF file")
    }
  }

  const handleFileRemove = () => {
    setPdfFile(null)
    setFileUrl(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const handleFileDownload = () => {
    if (pdfFile) {
      const url = URL.createObjectURL(pdfFile)
      const a = document.createElement("a")
      a.href = url
      a.download = pdfFile.name
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } else if (fileUrl) {
      window.open(fileUrl, "_blank")
    }
  }

  const units = ["pcs", "kgs", "set"]

  // Determine if we have a file to display (either a new upload or an existing URL)
  const hasFile = pdfFile || fileUrl

  // Get the file name to display
  const getFileName = () => {
    if (pdfFile) return pdfFile.name
    if (po.fileName) return po.fileName
    return "PO Document"
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-5xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Edit Purchase Order</CardTitle>
            <CardDescription>Modify PO details and items</CardDescription>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} disabled={isSubmitting}>
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
                  disabled={isSubmitting}
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
                  disabled={isSubmitting}
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
                  disabled={isSubmitting}
                />
              </div>
            </div>

            {/* PDF Upload Section */}
            <div className="space-y-4">
              <Label className="text-lg font-medium">PO Document (Optional)</Label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
                {!hasFile ? (
                  <div className="text-center">
                    <Upload className="mx-auto h-12 w-12 text-gray-400" />
                    <div className="mt-4">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => fileInputRef.current?.click()}
                        className="flex items-center gap-2"
                        disabled={isSubmitting}
                      >
                        <Upload className="h-4 w-4" />
                        Upload PO PDF
                      </Button>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".pdf"
                        onChange={handleFileUpload}
                        className="hidden"
                        disabled={isSubmitting}
                      />
                    </div>
                    <p className="mt-2 text-sm text-gray-600">Upload the original PO document (PDF only)</p>
                  </div>
                ) : (
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded">
                    <div className="flex items-center gap-3">
                      <FileText className="h-8 w-8 text-red-600" />
                      <div>
                        <p className="font-medium">{getFileName()}</p>
                        {pdfFile && (
                          <p className="text-sm text-gray-600">{(pdfFile.size / 1024 / 1024).toFixed(2)} MB</p>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleFileDownload}
                        disabled={isSubmitting || (!pdfFile && !fileUrl)}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleFileRemove}
                        disabled={isSubmitting}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-lg font-medium">PO Items</Label>
                <Button type="button" onClick={addItem} variant="outline" size="sm" disabled={isSubmitting}>
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
                          disabled={isSubmitting}
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
                          disabled={isSubmitting}
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
                          disabled={isSubmitting}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Unit *</Label>
                        <Select
                          value={item.unit}
                          onValueChange={(value) => updateItem(index, "unit", value)}
                          disabled={isSubmitting}
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
                          disabled={isSubmitting}
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
              <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Updating...
                  </div>
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
