"use client"

import React from "react"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Package, Calendar, Edit, Check, X, Search, Trash2, FileText, ChevronDown, ChevronRight } from "lucide-react"
import { formatDate } from "@/utils/dateFormat"

interface POManagementProps {
  pos: any[]
  onUpdateBalance: (poId: string, materialName: string, newBalance: number) => void
  onEditPO: (po: any) => void
  onDeletePO: (poId: string) => void
}

export default function POManagement({ pos, onUpdateBalance, onEditPO, onDeletePO }: POManagementProps) {
  const [editingCell, setEditingCell] = useState<string | null>(null)
  const [editValue, setEditValue] = useState("")
  const [searchPO, setSearchPO] = useState("")
  const [filteredPOs, setFilteredPOs] = useState(pos)
  const [expandedPOs, setExpandedPOs] = useState<Set<string>>(new Set())

  const handleSearch = () => {
    if (searchPO.trim()) {
      const filtered = pos.filter((po) => po.poNumber.toLowerCase().includes(searchPO.toLowerCase()))
      setFilteredPOs(filtered)
    } else {
      setFilteredPOs(pos)
    }
  }

  const togglePOExpanded = (poId: string) => {
    const newExpanded = new Set(expandedPOs)
    if (newExpanded.has(poId)) {
      newExpanded.delete(poId)
    } else {
      newExpanded.add(poId)
    }
    setExpandedPOs(newExpanded)
  }

  const handleEditStart = (poId: string, materialName: string, currentBalance: number) => {
    const cellId = `${poId}-${materialName}`
    setEditingCell(cellId)
    setEditValue(currentBalance.toString())
  }

  const handleEditSave = (poId: string, materialName: string) => {
    const newBalance = Number.parseInt(editValue)
    if (!isNaN(newBalance) && newBalance >= 0) {
      onUpdateBalance(poId, materialName, newBalance)
    }
    setEditingCell(null)
    setEditValue("")
  }

  const handleEditCancel = () => {
    setEditingCell(null)
    setEditValue("")
  }

  const handleDeletePO = (poId: string) => {
    if (window.confirm("Are you sure you want to delete this PO?")) {
      onDeletePO(poId)
      setFilteredPOs(filteredPOs.filter((po) => po.id !== poId))
    }
  }

  const handleFileDownload = (pdfFile: File) => {
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

  // Update filtered POs when pos prop changes
  React.useEffect(() => {
    if (searchPO.trim()) {
      const filtered = pos.filter((po) => po.poNumber.toLowerCase().includes(searchPO.toLowerCase()))
      setFilteredPOs(filtered)
    } else {
      setFilteredPOs(pos)
    }
  }, [pos, searchPO])

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Purchase Orders</CardTitle>
          <CardDescription>Manage all purchase orders with their material items</CardDescription>

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
                setFilteredPOs(pos)
              }}
            >
              Clear
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6">
            {filteredPOs.map((po) => {
              const isExpanded = expandedPOs.has(po.id)

              return (
                <Card key={po.id} className="overflow-hidden">
                  {/* Header Section - Always Visible */}
                  <div
                    className="p-6 cursor-pointer hover:bg-gray-50 transition-colors"
                    onClick={() => togglePOExpanded(po.id)}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <Package className="h-6 w-6 text-blue-600" />
                        <div>
                          <div className="flex items-center gap-3 mb-1">
                            <h3 className="font-semibold text-lg">PO-{po.poNumber}</h3>
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <Calendar className="h-4 w-4" />
                              {formatDate(po.poDate)}
                            </div>
                          </div>
                          <p className="text-sm text-gray-600">{po.areaOfApplication}</p>
                          <div className="flex items-center gap-4 mt-2">
                            <span className="text-sm text-gray-600">{po.items.length} items</span>
                            {po.pdfFile && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleFileDownload(po.pdfFile)
                                }}
                                className="flex items-center gap-2 h-7"
                              >
                                <FileText className="h-3 w-3" />
                                PDF
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Calendar className="h-4 w-4" />
                          Created: {formatDate(po.createdDate)}
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation()
                              onEditPO(po)
                            }}
                            className="flex items-center gap-2"
                          >
                            <Edit className="h-4 w-4" />
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDeletePO(po.id)
                            }}
                            className="flex items-center gap-2 text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                            Delete
                          </Button>
                        </div>
                        {isExpanded ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
                      </div>
                    </div>
                  </div>

                  {/* Expandable Content - PO Items */}
                  {isExpanded && (
                    <div className="px-6 pb-6 border-t bg-gray-50">
                      <div className="space-y-4 pt-6">
                        <h4 className="font-medium text-lg">PO Items ({po.items.length})</h4>
                        <div className="rounded-md border bg-white">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>#</TableHead>
                                <TableHead>Material Name</TableHead>
                                <TableHead>Total Quantity</TableHead>
                                <TableHead>PO Balance Qty</TableHead>
                                <TableHead>Unit</TableHead>
                                <TableHead>Actions</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {po.items.map((item: any, index: number) => {
                                const cellId = `${po.id}-${item.materialName}`
                                const isEditing = editingCell === cellId

                                return (
                                  <TableRow key={index}>
                                    <TableCell>
                                      <span className="bg-blue-100 text-blue-800 text-sm font-medium px-2 py-1 rounded">
                                        {index + 1}
                                      </span>
                                    </TableCell>
                                    <TableCell className="font-medium">{item.materialName}</TableCell>
                                    <TableCell>{item.quantity}</TableCell>
                                    <TableCell>
                                      {isEditing ? (
                                        <div className="flex items-center gap-2">
                                          <Input
                                            type="number"
                                            value={editValue}
                                            onChange={(e) => setEditValue(e.target.value)}
                                            className="w-20"
                                            min="0"
                                            max={item.quantity}
                                            onClick={(e) => e.stopPropagation()}
                                          />
                                          <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={(e) => {
                                              e.stopPropagation()
                                              handleEditSave(po.id, item.materialName)
                                            }}
                                          >
                                            <Check className="h-4 w-4 text-green-600" />
                                          </Button>
                                          <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={(e) => {
                                              e.stopPropagation()
                                              handleEditCancel()
                                            }}
                                          >
                                            <X className="h-4 w-4 text-red-600" />
                                          </Button>
                                        </div>
                                      ) : (
                                        <div className="flex items-center gap-2">
                                          <span>{item.balanceQty}</span>
                                          <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={(e) => {
                                              e.stopPropagation()
                                              handleEditStart(po.id, item.materialName, item.balanceQty)
                                            }}
                                          >
                                            <Edit className="h-4 w-4" />
                                          </Button>
                                        </div>
                                      )}
                                    </TableCell>
                                    <TableCell>{item.unit}</TableCell>
                                    <TableCell>
                                      <div className="flex items-center gap-2">
                                        <span className="text-sm text-gray-600">
                                          {(((item.quantity - item.balanceQty) / item.quantity) * 100).toFixed(0)}% used
                                        </span>
                                      </div>
                                    </TableCell>
                                  </TableRow>
                                )
                              })}
                            </TableBody>
                          </Table>
                        </div>
                      </div>
                    </div>
                  )}
                </Card>
              )
            })}
          </div>

          {filteredPOs.length === 0 && searchPO && (
            <div className="text-center py-12">
              <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No POs Found</h3>
              <p className="text-gray-600">No purchase orders match your search criteria.</p>
            </div>
          )}

          {pos.length === 0 && (
            <div className="text-center py-12">
              <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Purchase Orders</h3>
              <p className="text-gray-600">Create your first PO to get started.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
