"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Progress } from "@/components/ui/progress"
import { Eye, Edit, ChevronDown, ChevronRight, Trash2 } from "lucide-react"
import { useState } from "react"
import { formatDate } from "@/utils/dateFormat"
import type { JSX } from "react"

interface RequirementsTableProps {
  requirements: any[]
  getPriorityColor: (priority: string) => string
  getStatusIcon: (status: string) => JSX.Element
  onEditRequirement?: (requirement: any) => void
  onDeleteRequirement?: (requirementId: string) => void
  onViewSupplyDetails?: (requirement: any) => void
}

export default function RequirementsTable({
  requirements,
  getPriorityColor,
  getStatusIcon,
  onEditRequirement,
  onDeleteRequirement,
  onViewSupplyDetails,
}: RequirementsTableProps) {
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())

  const toggleRow = (reqId: string) => {
    const newExpanded = new Set(expandedRows)
    if (newExpanded.has(reqId)) {
      newExpanded.delete(reqId)
    } else {
      newExpanded.add(reqId)
    }
    setExpandedRows(newExpanded)
  }

  const calculateOverallProgress = (selectedItems: any[]) => {
    const totalRequired = selectedItems.reduce((sum, item) => sum + item.quantityRequired, 0)
    const totalSupplied = selectedItems.reduce((sum, item) => sum + item.quantitySupplied, 0)
    return totalRequired > 0 ? (totalSupplied / totalRequired) * 100 : 0
  }

  const handleDelete = (requirement: any) => {
    if (window.confirm(`Are you sure you want to delete requirement ${requirement.poNumber}?`)) {
      onDeleteRequirement?.(requirement.id)
    }
  }

  // Update the sorting logic to prioritize by completion status and then by priority
  const sortedRequirements = [...requirements].sort((a, b) => {
    // First, separate completed from non-completed
    if (a.status === "Completed" && b.status !== "Completed") return 1
    if (a.status !== "Completed" && b.status === "Completed") return -1

    // For non-completed requirements, sort by priority
    if (a.status !== "Completed" && b.status !== "Completed") {
      const priorityOrder = { Urgent: 1, High: 2, Medium: 3, Low: 4 }
      const aPriority = priorityOrder[a.priority as keyof typeof priorityOrder] || 5
      const bPriority = priorityOrder[b.priority as keyof typeof priorityOrder] || 5

      if (aPriority !== bPriority) {
        return aPriority - bPriority
      }

      // Then sort by delivery date (earlier dates first)
      return new Date(a.deliveryDate).getTime() - new Date(b.deliveryDate).getTime()
    }

    // For completed requirements, sort by completion date (most recent first)
    return new Date(b.createdDate).getTime() - new Date(a.createdDate).getTime()
  })

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead></TableHead>
            <TableHead>PO Number</TableHead>
            <TableHead>Area of Application</TableHead>
            <TableHead>Items Count</TableHead>
            <TableHead>Overall Progress</TableHead>
            <TableHead>Delivery Date</TableHead>
            <TableHead>Priority</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedRequirements.map((req) => {
            const progress = calculateOverallProgress(req.selectedItems)
            const isExpanded = expandedRows.has(req.id)

            return (
              <>
                <TableRow key={req.id}>
                  <TableCell>
                    <Button variant="ghost" size="sm" onClick={() => toggleRow(req.id)}>
                      {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                    </Button>
                  </TableCell>
                  <TableCell className="font-medium">{req.poNumber}</TableCell>
                  <TableCell>{req.areaOfApplication}</TableCell>
                  <TableCell>{req.selectedItems.length} items</TableCell>
                  <TableCell>
                    <div className="w-20">
                      <Progress value={progress} className="h-2" />
                      <div className="text-xs text-gray-500 mt-1">{progress.toFixed(0)}%</div>
                    </div>
                  </TableCell>
                  <TableCell>{formatDate(req.deliveryDate)}</TableCell>
                  <TableCell>
                    <Badge variant={getPriorityColor(req.priority) as any}>{req.priority}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(req.status)}
                      <span className="text-sm">{req.status}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        title="View Supply Details"
                        onClick={() => onViewSupplyDetails?.(req)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        title="Edit Requirement"
                        onClick={() => onEditRequirement?.(req)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        title="Delete Requirement"
                        onClick={() => handleDelete(req)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>

                {isExpanded && (
                  <TableRow>
                    <TableCell colSpan={9} className="bg-gray-50">
                      <div className="p-4">
                        <h4 className="font-medium mb-3">Requirement Items</h4>
                        <div className="grid gap-2">
                          {req.selectedItems.map((item: any, index: number) => {
                            const itemProgress = (item.quantitySupplied / item.quantityRequired) * 100
                            return (
                              <div
                                key={index}
                                className="flex items-center justify-between p-3 bg-white rounded border"
                              >
                                <div>
                                  <p className="font-medium">{item.materialName}</p>
                                  <p className="text-sm text-gray-600">
                                    {item.quantitySupplied}/{item.quantityRequired} {item.unit}
                                  </p>
                                </div>
                                <div className="w-24">
                                  <Progress value={itemProgress} className="h-2" />
                                  <div className="text-xs text-gray-500 mt-1 text-center">
                                    {itemProgress.toFixed(0)}%
                                  </div>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                        {req.notes && (
                          <div className="mt-3 p-3 bg-blue-50 rounded">
                            <p className="text-sm">
                              <strong>Notes:</strong> {req.notes}
                            </p>
                          </div>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}
