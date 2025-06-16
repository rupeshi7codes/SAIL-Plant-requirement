"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { X } from "lucide-react"

interface RequirementFormProps {
  pos: any[]
  onSubmit: (requirement: any) => void
  onClose: () => void
}

export default function RequirementForm({ pos, onSubmit, onClose }: RequirementFormProps) {
  const [formData, setFormData] = useState({
    poNumber: "",
    deliveryDate: "",
    priority: "",
    notes: "",
  })

  const [selectedPO, setSelectedPO] = useState<any>(null)
  const [selectedItems, setSelectedItems] = useState<any[]>([])

  useEffect(() => {
    if (formData.poNumber) {
      const po = pos.find((p) => p.poNumber === formData.poNumber)
      setSelectedPO(po)
      setSelectedItems([])
    }
  }, [formData.poNumber, pos])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (selectedItems.length === 0) {
      alert("Please select at least one item from the PO")
      return
    }

    onSubmit({
      ...formData,
      areaOfApplication: selectedPO?.areaOfApplication,
      selectedItems: selectedItems.map((item) => ({
        materialName: item.materialName,
        quantityRequired: item.quantityRequired,
        quantitySupplied: 0,
        unit: item.unit,
      })),
    })
  }

  const handleItemSelection = (item: any, checked: boolean) => {
    if (checked) {
      setSelectedItems([...selectedItems, { ...item, quantityRequired: item.quantity }])
    } else {
      setSelectedItems(selectedItems.filter((selected) => selected.materialName !== item.materialName))
    }
  }

  const updateItemQuantity = (materialName: string, quantity: number) => {
    setSelectedItems(
      selectedItems.map((item) =>
        item.materialName === materialName ? { ...item, quantityRequired: quantity } : item,
      ),
    )
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>New Material Requirement</CardTitle>
            <CardDescription>Submit a new refractory material requirement from existing PO</CardDescription>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="poNumber">Select Purchase Order *</Label>
              <Select
                value={formData.poNumber}
                onValueChange={(value) => setFormData({ ...formData, poNumber: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select PO" />
                </SelectTrigger>
                <SelectContent>
                  {pos.map((po) => (
                    <SelectItem key={po.id} value={po.poNumber}>
                      {po.poNumber} - {po.areaOfApplication}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedPO && (
              <Card className="p-4 bg-gray-50">
                <h4 className="font-medium mb-3">Select Items from {selectedPO.poNumber}</h4>
                <div className="space-y-3">
                  {selectedPO.items.map((item: any, index: number) => {
                    const isSelected = selectedItems.some((selected) => selected.materialName === item.materialName)
                    const selectedItem = selectedItems.find((selected) => selected.materialName === item.materialName)

                    return (
                      <div key={index} className="flex items-center space-x-4 p-3 bg-white rounded border">
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={(checked) => handleItemSelection(item, checked as boolean)}
                        />
                        <div className="flex-1">
                          <p className="font-medium">{item.materialName}</p>
                          <p className="text-sm text-gray-600">
                            Available: {item.quantity} {item.unit}
                          </p>
                        </div>
                        {isSelected && (
                          <div className="flex items-center space-x-2">
                            <Label className="text-sm">Required:</Label>
                            <Input
                              type="number"
                              value={selectedItem?.quantityRequired || ""}
                              onChange={(e) =>
                                updateItemQuantity(item.materialName, Number.parseInt(e.target.value) || 0)
                              }
                              className="w-24"
                              max={item.quantity}
                              min={1}
                            />
                            <span className="text-sm text-gray-600">{item.unit}</span>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </Card>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="deliveryDate">Delivery Date *</Label>
                <Input
                  id="deliveryDate"
                  type="date"
                  value={formData.deliveryDate}
                  onChange={(e) => setFormData({ ...formData, deliveryDate: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="priority">Priority *</Label>
                <Select
                  value={formData.priority}
                  onValueChange={(value) => setFormData({ ...formData, priority: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Urgent">Urgent</SelectItem>
                    <SelectItem value="High">High</SelectItem>
                    <SelectItem value="Medium">Medium</SelectItem>
                    <SelectItem value="Low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Additional Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Any additional requirements or specifications..."
                rows={3}
              />
            </div>

            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={!selectedPO || selectedItems.length === 0}>
                Submit Requirement
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
