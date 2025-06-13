"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { X, Calendar, Package, AlertTriangle } from "lucide-react"
import { formatDate } from "@/utils/dateFormat"
import type { JSX } from "react"

interface SupplyDetailsModalProps {
  requirement: any
  supplyHistory: any[]
  onClose: () => void
  getPriorityColor: (priority: string) => string
  getStatusIcon: (status: string) => JSX.Element
}

export default function SupplyDetailsModal({
  requirement,
  supplyHistory,
  onClose,
  getPriorityColor,
  getStatusIcon,
}: SupplyDetailsModalProps) {
  const [selectedMaterial, setSelectedMaterial] = useState<string | null>(null)

  // Get supply history for this requirement
  const reqSupplyHistory = supplyHistory.filter((entry) => entry.reqId === requirement.id)

  // Get supply history for selected material
  const materialSupplyHistory = selectedMaterial
    ? reqSupplyHistory.filter((entry) => entry.materialName === selectedMaterial)
    : []

  // Calculate overall progress
  const totalRequired = requirement.selectedItems.reduce((sum: number, item: any) => sum + item.quantityRequired, 0)
  const totalSupplied = requirement.selectedItems.reduce((sum: number, item: any) => sum + item.quantitySupplied, 0)
  const overallProgress = totalRequired > 0 ? (totalSupplied / totalRequired) * 100 : 0

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-6xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-3">
              {getStatusIcon(requirement.status)}
              Supply Details - {requirement.poNumber}
            </CardTitle>
            <CardDescription>
              {requirement.areaOfApplication} • {requirement.selectedItems.length} items
            </CardDescription>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant={getPriorityColor(requirement.priority) as any}>{requirement.priority}</Badge>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Summary Section */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
            <div className="text-center">
              <div className="text-2xl font-bold">{totalRequired}</div>
              <div className="text-sm text-gray-600">Total Required</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{totalSupplied}</div>
              <div className="text-sm text-gray-600">Total Supplied</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{totalRequired - totalSupplied}</div>
              <div className="text-sm text-gray-600">Remaining</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{overallProgress.toFixed(1)}%</div>
              <div className="text-sm text-gray-600">Progress</div>
            </div>
          </div>

          {/* Progress Bar */}
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="font-medium">Overall Progress</span>
              <span>{overallProgress.toFixed(1)}%</span>
            </div>
            <Progress value={overallProgress} className="h-3" />
          </div>

          {/* Requirement Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 border rounded-lg">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-gray-500" />
              <span className="text-sm">
                <strong>Delivery Date:</strong> {formatDate(requirement.deliveryDate)}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Package className="h-4 w-4 text-gray-500" />
              <span className="text-sm">
                <strong>Created:</strong> {formatDate(requirement.createdDate)}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-gray-500" />
              <span className="text-sm">
                <strong>Priority:</strong> {requirement.priority}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Package className="h-4 w-4 text-gray-500" />
              <span className="text-sm">
                <strong>Status:</strong> {requirement.status}
              </span>
            </div>
          </div>

          {requirement.notes && (
            <div className="p-4 bg-blue-50 rounded-lg">
              <h4 className="font-medium mb-2">Notes:</h4>
              <p className="text-sm">{requirement.notes}</p>
            </div>
          )}

          {/* Materials Table */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Material Items</h3>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>#</TableHead>
                    <TableHead>Material Name</TableHead>
                    <TableHead>Required</TableHead>
                    <TableHead>Supplied</TableHead>
                    <TableHead>Remaining</TableHead>
                    <TableHead>Progress</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {requirement.selectedItems.map((item: any, index: number) => {
                    const itemProgress = (item.quantitySupplied / item.quantityRequired) * 100
                    const remaining = item.quantityRequired - item.quantitySupplied

                    return (
                      <TableRow key={index} className={selectedMaterial === item.materialName ? "bg-blue-50" : ""}>
                        <TableCell>
                          <span className="bg-blue-100 text-blue-800 text-sm font-medium px-2 py-1 rounded">
                            {index + 1}
                          </span>
                        </TableCell>
                        <TableCell className="font-medium">{item.materialName}</TableCell>
                        <TableCell>
                          {item.quantityRequired} {item.unit}
                        </TableCell>
                        <TableCell className="text-green-600 font-medium">
                          {item.quantitySupplied} {item.unit}
                        </TableCell>
                        <TableCell className="text-orange-600 font-medium">
                          {remaining} {item.unit}
                        </TableCell>
                        <TableCell>
                          <div className="w-20">
                            <Progress value={itemProgress} className="h-2" />
                            <div className="text-xs text-gray-500 mt-1 text-center">{itemProgress.toFixed(0)}%</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              setSelectedMaterial(selectedMaterial === item.materialName ? null : item.materialName)
                            }
                          >
                            {selectedMaterial === item.materialName ? "Hide History" : "View History"}
                          </Button>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          </div>

          {/* Supply History for Selected Material */}
          {selectedMaterial && (
            <div>
              <h3 className="text-lg font-semibold mb-4">Supply History - {selectedMaterial}</h3>
              {materialSupplyHistory.length > 0 ? (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Quantity</TableHead>
                        <TableHead>Notes</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {materialSupplyHistory
                        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                        .map((entry) => (
                          <TableRow key={entry.id}>
                            <TableCell>{formatDate(entry.date)}</TableCell>
                            <TableCell className="font-medium">{entry.quantity}</TableCell>
                            <TableCell>{entry.notes || "-"}</TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No supply history found for this material.</p>
                </div>
              )}
            </div>
          )}

          {/* Overall Supply History Summary */}
          {reqSupplyHistory.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-4">Recent Supply Activities</h3>
              <div className="space-y-2">
                {reqSupplyHistory
                  .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                  .slice(0, 5)
                  .map((entry) => (
                    <div key={entry.id} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                      <div>
                        <span className="font-medium">{entry.materialName}</span>
                        <span className="text-sm text-gray-600 ml-2">• {entry.quantity} units</span>
                      </div>
                      <div className="text-sm text-gray-600">{formatDate(entry.date)}</div>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
