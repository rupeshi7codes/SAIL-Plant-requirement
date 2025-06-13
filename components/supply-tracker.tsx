"use client"

import { CardContent } from "@/components/ui/card"

import { useState, useEffect } from "react"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Plus, Package, Search, Edit2, Trash2, Save, X, ChevronDown, ChevronRight, Edit } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import type { JSX } from "react/jsx-runtime"
import { formatDate } from "@/utils/dateFormat"

interface SupplyTrackerProps {
  requirements: any[]
  supplyHistory: any[]
  onUpdateSupply: (id: string, materialName: string, quantity: number, notes?: string) => void
  onUpdateSupplyHistory: (updatedHistory: any[]) => void
  getPriorityColor: (priority: string) => string
  getStatusIcon: (status: string) => JSX.Element
}

export default function SupplyTracker({
  requirements,
  supplyHistory,
  onUpdateSupply,
  onUpdateSupplyHistory,
  getPriorityColor,
  getStatusIcon,
}: SupplyTrackerProps) {
  const [supplyQuantities, setSupplyQuantities] = useState<{ [key: string]: string }>({})
  const [supplyNotes, setSupplyNotes] = useState<{ [key: string]: string }>({})
  const [searchPO, setSearchPO] = useState("")
  const [filteredRequirements, setFilteredRequirements] = useState(requirements)
  const [showHistoryModal, setShowHistoryModal] = useState(false)
  const [selectedReqHistory, setSelectedReqHistory] = useState<any[]>([])
  const [selectedReqId, setSelectedReqId] = useState("")
  const [editingHistoryId, setEditingHistoryId] = useState<string | null>(null)
  const [editHistoryData, setEditHistoryData] = useState<any>({})
  const [expandedRequirements, setExpandedRequirements] = useState<Set<string>>(new Set())

  const handleSearch = () => {
    if (searchPO.trim()) {
      const filtered = requirements.filter((req) => req.poNumber.toLowerCase().includes(searchPO.toLowerCase()))
      setFilteredRequirements(filtered)
    } else {
      setFilteredRequirements(requirements)
    }
  }

  const toggleRequirementExpanded = (reqId: string) => {
    const newExpanded = new Set(expandedRequirements)
    if (newExpanded.has(reqId)) {
      newExpanded.delete(reqId)
    } else {
      newExpanded.add(reqId)
    }
    setExpandedRequirements(newExpanded)
  }

  const handleSupplyUpdate = (reqId: string, materialName: string) => {
    const supplyKey = `${reqId}-${materialName}`
    const quantity = Number.parseInt(supplyQuantities[supplyKey] || "0")
    const notes = supplyNotes[supplyKey] || ""

    if (quantity > 0) {
      onUpdateSupply(reqId, materialName, quantity, notes)

      // Clear the input fields after successful update
      setSupplyQuantities((prev) => ({ ...prev, [supplyKey]: "" }))
      setSupplyNotes((prev) => ({ ...prev, [supplyKey]: "" }))
    }
  }

  const handleViewHistory = (reqId: string, materialName: string) => {
    const reqHistory = supplyHistory.filter((entry) => entry.reqId === reqId && entry.materialName === materialName)
    setSelectedReqHistory(reqHistory)
    setSelectedReqId(reqId)
    setShowHistoryModal(true)
  }

  const handleEditHistory = (historyId: string) => {
    const entry = selectedReqHistory.find((h) => h.id === historyId)
    if (entry) {
      setEditingHistoryId(historyId)
      setEditHistoryData({ ...entry })
    }
  }

  const handleSaveHistory = () => {
    const updatedHistory = supplyHistory.map((entry) => (entry.id === editingHistoryId ? editHistoryData : entry))
    onUpdateSupplyHistory(updatedHistory)
    setSelectedReqHistory(selectedReqHistory.map((entry) => (entry.id === editingHistoryId ? editHistoryData : entry)))
    setEditingHistoryId(null)
    setEditHistoryData({})
  }

  const handleDeleteHistory = (historyId: string) => {
    if (window.confirm("Are you sure you want to delete this supply entry?")) {
      const updatedHistory = supplyHistory.filter((entry) => entry.id !== historyId)
      onUpdateSupplyHistory(updatedHistory)
      setSelectedReqHistory(selectedReqHistory.filter((entry) => entry.id !== historyId))
    }
  }

  const activeRequirements = filteredRequirements
    .filter((req) => req.status !== "Completed")
    .sort((a, b) => {
      // Priority ranking: Urgent = 1, High = 2, Medium = 3, Low = 4
      const priorityOrder = { Urgent: 1, High: 2, Medium: 3, Low: 4 }
      const aPriority = priorityOrder[a.priority as keyof typeof priorityOrder] || 5
      const bPriority = priorityOrder[b.priority as keyof typeof priorityOrder] || 5

      // First sort by priority (urgent first)
      if (aPriority !== bPriority) {
        return aPriority - bPriority
      }

      // Then sort by delivery date (earlier dates first)
      return new Date(a.deliveryDate).getTime() - new Date(b.deliveryDate).getTime()
    })

  // Update filtered requirements when requirements prop changes
  useEffect(() => {
    if (searchPO.trim()) {
      const filtered = requirements.filter((req) => req.poNumber.toLowerCase().includes(searchPO.toLowerCase()))
      setFilteredRequirements(filtered)
    } else {
      setFilteredRequirements(requirements)
    }
  }, [requirements, searchPO])

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Supply Tracking</CardTitle>
          <CardDescription>Update material supply quantities for active requirements</CardDescription>

          {/* Search Section */}
          <div className="flex gap-4 items-end pt-4">
            <div className="flex-1">
              <label className="text-sm font-medium">Search by PO Number</label>
              <Input
                placeholder="Enter PO number..."
                value={searchPO}
                onChange={(e) => setSearchPO(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleSearch()}
              />
            </div>
            <Button onClick={handleSearch} className="flex items-center gap-2">
              <Search className="h-4 w-4" />
              Search
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setSearchPO("")
                setFilteredRequirements(requirements)
              }}
            >
              Clear
            </Button>
          </div>
        </CardHeader>
      </Card>

      <div className="grid gap-6">
        {activeRequirements.map((req) => {
          const totalRequired = req.selectedItems.reduce((sum: number, item: any) => sum + item.quantityRequired, 0)
          const totalSupplied = req.selectedItems.reduce((sum: number, item: any) => sum + item.quantitySupplied, 0)
          const progress = totalRequired > 0 ? (totalSupplied / totalRequired) * 100 : 0
          const totalRemaining = totalRequired - totalSupplied
          const isExpanded = expandedRequirements.has(req.id)

          return (
            <Card key={req.id} className="overflow-hidden">
              {/* Header Section - Always Visible */}
              <div
                className="p-6 cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => toggleRequirementExpanded(req.id)}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(req.status)}
                    <div>
                      <h3 className="font-semibold text-lg">{req.poNumber}</h3>
                      <p className="text-sm text-gray-600">
                        {req.areaOfApplication} - {req.selectedItems.length} items
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant={getPriorityColor(req.priority) as any}>{req.priority}</Badge>
                    {isExpanded ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Total Required</Label>
                    <div className="text-2xl font-bold">{totalRequired}</div>
                    <p className="text-sm text-gray-600">units</p>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Total Supplied</Label>
                    <div className="text-2xl font-bold text-green-600">{totalSupplied}</div>
                    <p className="text-sm text-gray-600">units</p>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Total Remaining</Label>
                    <div className="text-2xl font-bold text-orange-600">{totalRemaining}</div>
                    <p className="text-sm text-gray-600">units</p>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Overall Progress</span>
                    <span>{progress.toFixed(1)}%</span>
                  </div>
                  <Progress value={progress} className="h-3" />
                </div>
              </div>

              {/* Expandable Content - Individual Items */}
              {isExpanded && (
                <div className="px-6 pb-6 border-t bg-gray-50">
                  <div className="space-y-4 pt-6">
                    <h4 className="font-medium text-lg">Individual Items</h4>
                    {req.selectedItems.map((item: any, index: number) => {
                      const itemProgress = (item.quantitySupplied / item.quantityRequired) * 100
                      const itemRemaining = item.quantityRequired - item.quantitySupplied
                      const supplyKey = `${req.id}-${item.materialName}`

                      return (
                        <div key={index} className="p-4 bg-white rounded-lg border space-y-3">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <span className="bg-blue-100 text-blue-800 text-sm font-medium px-2 py-1 rounded">
                                  #{index + 1}
                                </span>
                                <h5 className="font-semibold text-lg">{item.materialName}</h5>
                              </div>
                              <p className="text-sm text-gray-600">
                                {item.quantitySupplied}/{item.quantityRequired} {item.unit}
                              </p>
                            </div>
                            <div className="text-right flex items-center gap-3">
                              <div>
                                <div className="relative">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      handleViewHistory(req.id, item.materialName)
                                    }}
                                    className="bg-green-50 border-green-200 text-green-700 hover:bg-green-100 relative pr-8"
                                  >
                                    Supplied: {item.quantitySupplied}
                                    <Edit className="h-3 w-3 absolute top-1 right-1" />
                                  </Button>
                                </div>
                                <p className="text-sm text-gray-600 mt-1">Remaining: {itemRemaining}</p>
                              </div>
                              <div className="w-20">
                                <Progress value={itemProgress} className="h-2" />
                                <div className="text-xs text-gray-500 mt-1 text-center">{itemProgress.toFixed(0)}%</div>
                              </div>
                            </div>
                          </div>

                          {itemRemaining > 0 && (
                            <div className="space-y-3 pt-3 border-t">
                              <div className="flex items-end gap-4">
                                <div className="flex-1">
                                  <Label className="text-sm font-medium">Add Supply Quantity</Label>
                                  <Input
                                    type="number"
                                    placeholder="Enter quantity"
                                    value={supplyQuantities[supplyKey] || ""}
                                    onChange={(e) =>
                                      setSupplyQuantities({
                                        ...supplyQuantities,
                                        [supplyKey]: e.target.value,
                                      })
                                    }
                                    max={itemRemaining}
                                    min={1}
                                    onClick={(e) => e.stopPropagation()}
                                  />
                                </div>
                                <Button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleSupplyUpdate(req.id, item.materialName)
                                  }}
                                  disabled={
                                    !supplyQuantities[supplyKey] ||
                                    Number.parseInt(supplyQuantities[supplyKey]) <= 0 ||
                                    Number.parseInt(supplyQuantities[supplyKey]) > itemRemaining
                                  }
                                  size="sm"
                                >
                                  <Plus className="h-4 w-4 mr-1" />
                                  Update
                                </Button>
                              </div>
                              <div>
                                <Label className="text-sm font-medium">Notes (Optional)</Label>
                                <Textarea
                                  placeholder="Add notes for this supply entry..."
                                  value={supplyNotes[supplyKey] || ""}
                                  onChange={(e) =>
                                    setSupplyNotes({
                                      ...supplyNotes,
                                      [supplyKey]: e.target.value,
                                    })
                                  }
                                  rows={2}
                                  onClick={(e) => e.stopPropagation()}
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>

                  <div className="flex justify-between text-sm text-gray-600 pt-4 border-t mt-6">
                    <span>Delivery Due: {formatDate(req.deliveryDate)}</span>
                    <span>Created: {formatDate(req.createdDate)}</span>
                  </div>

                  {req.notes && (
                    <div className="p-3 bg-blue-50 rounded text-sm mt-4">
                      <strong>Notes:</strong> {req.notes}
                    </div>
                  )}
                </div>
              )}
            </Card>
          )
        })}
      </div>

      {activeRequirements.length === 0 && searchPO && (
        <Card className="p-12 text-center">
          <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Requirements Found</h3>
          <p className="text-gray-600">No requirements match your search criteria.</p>
        </Card>
      )}

      {requirements.filter((req) => req.status !== "Completed").length === 0 && !searchPO && (
        <Card className="p-12 text-center">
          <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Active Requirements</h3>
          <p className="text-gray-600">All current requirements have been completed.</p>
        </Card>
      )}

      {/* Supply History Modal */}
      {showHistoryModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-4xl max-h-[80vh] overflow-y-auto">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Supply History</CardTitle>
                <CardDescription>View and edit supply entries</CardDescription>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setShowHistoryModal(false)}>
                <X className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Material</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Notes</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {selectedReqHistory.map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell>
                        {editingHistoryId === entry.id ? (
                          <Input
                            type="date"
                            value={editHistoryData.date}
                            onChange={(e) => setEditHistoryData({ ...editHistoryData, date: e.target.value })}
                          />
                        ) : (
                          formatDate(entry.date)
                        )}
                      </TableCell>
                      <TableCell>{entry.materialName}</TableCell>
                      <TableCell>
                        {editingHistoryId === entry.id ? (
                          <Input
                            type="number"
                            value={editHistoryData.quantity}
                            onChange={(e) =>
                              setEditHistoryData({ ...editHistoryData, quantity: Number.parseInt(e.target.value) })
                            }
                          />
                        ) : (
                          entry.quantity
                        )}
                      </TableCell>
                      <TableCell>
                        {editingHistoryId === entry.id ? (
                          <Textarea
                            value={editHistoryData.notes}
                            onChange={(e) => setEditHistoryData({ ...editHistoryData, notes: e.target.value })}
                            rows={2}
                          />
                        ) : (
                          entry.notes || "-"
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          {editingHistoryId === entry.id ? (
                            <>
                              <Button size="sm" onClick={handleSaveHistory}>
                                <Save className="h-4 w-4" />
                              </Button>
                              <Button size="sm" variant="outline" onClick={() => setEditingHistoryId(null)}>
                                <X className="h-4 w-4" />
                              </Button>
                            </>
                          ) : (
                            <>
                              <Button size="sm" variant="ghost" onClick={() => handleEditHistory(entry.id)}>
                                <Edit2 className="h-4 w-4" />
                              </Button>
                              <Button size="sm" variant="ghost" onClick={() => handleDeleteHistory(entry.id)}>
                                <Trash2 className="h-4 w-4 text-red-600" />
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {selectedReqHistory.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-gray-600">No supply entries found.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
