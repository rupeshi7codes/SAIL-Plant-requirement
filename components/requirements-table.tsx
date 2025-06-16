"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Progress } from "@/components/ui/progress"
import { Eye, Edit, ChevronDown, ChevronRight, Trash2, ChevronUp } from "lucide-react"
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
  const [showAllCompleted, setShowAllCompleted] = useState(false)

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
    const totalSupplied = selectedItems.reduce((sum, item) => sum + (item.quantitySupplied || 0), 0)
    return totalRequired > 0 ? (totalSupplied / totalRequired) * 100 : 0
  }

  const handleDelete = (requirement: any) => {
    if (window.confirm(`Are you sure you want to delete requirement ${requirement.poNumber}?`)) {
      onDeleteRequirement?.(requirement.id)
    }
  }

  // Separate incomplete and completed requirements
  const incompleteRequirements = requirements.filter((req) => req.status !== "Completed")
  const completedRequirements = requirements.filter((req) => req.status === "Completed")

  // Sort incomplete requirements by priority and delivery date
  const sortedIncompleteRequirements = [...incompleteRequirements].sort((a, b) => {
    const priorityOrder = { Urgent: 1, High: 2, Medium: 3, Low: 4 }
    const aPriority = priorityOrder[a.priority as keyof typeof priorityOrder] || 5
    const bPriority = priorityOrder[b.priority as keyof typeof priorityOrder] || 5

    if (aPriority !== bPriority) {
      return aPriority - bPriority
    }

    // Then sort by delivery date (earlier dates first)
    return new Date(a.deliveryDate).getTime() - new Date(b.deliveryDate).getTime()
  })

  // Sort completed requirements by creation date (most recent first) and limit to 10 or show all
  const sortedCompletedRequirements = [...completedRequirements].sort(
    (a, b) => new Date(b.createdDate || b.created_at).getTime() - new Date(a.createdDate || a.created_at).getTime(),
  )

  const displayedCompletedRequirements = showAllCompleted
    ? sortedCompletedRequirements
    : sortedCompletedRequirements.slice(0, 10)

  const renderRequirementRow = (req: any) => {
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
              <Button variant="ghost" size="sm" title="View Supply Details" onClick={() => onViewSupplyDetails?.(req)}>
                <Eye className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" title="Edit Requirement" onClick={() => onEditRequirement?.(req)}>
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
                    const itemProgress = ((item.quantitySupplied || 0) / item.quantityRequired) * 100
                    return (
                      <div key={index} className="flex items-center justify-between p-3 bg-white rounded border">
                        <div>
                          <p className="font-medium">{item.materialName}</p>
                          <p className="text-sm text-gray-600">
                            {item.quantitySupplied || 0}/{item.quantityRequired} {item.unit}
                          </p>
                        </div>
                        <div className="w-24">
                          <Progress value={itemProgress} className="h-2" />
                          <div className="text-xs text-gray-500 mt-1 text-center">{itemProgress.toFixed(0)}%</div>
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
  }

  return (
    <div className="space-y-8">
      {/* Incomplete Requirements Table */}
      <div>
        <div className="mb-4">
          <h2 className="mt-4 text-lg font-semibold text-gray-900">Active Requirements</h2>
          <p className="text-sm text-gray-600">
            Requirements that are pending or in progress ({incompleteRequirements.length} total)
          </p>
        </div>
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
              {sortedIncompleteRequirements.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8 text-gray-500">
                    No active requirements found
                  </TableCell>
                </TableRow>
              ) : (
                sortedIncompleteRequirements.map((req) => renderRequirementRow(req))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Completed Requirements Table */}
      {completedRequirements.length > 0 && (
        <div>
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Completed Requirements</h3>
            <p className="text-sm text-gray-600">
              Recently completed requirements ({completedRequirements.length} total)
            </p>
          </div>
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
              <TableBody>{displayedCompletedRequirements.map((req) => renderRequirementRow(req))}</TableBody>
            </Table>
          </div>

          {/* Show More/Less Button */}
          {completedRequirements.length > 10 && (
            <div className="mt-4 text-center">
              <Button
                variant="outline"
                onClick={() => setShowAllCompleted(!showAllCompleted)}
                className="flex items-center gap-2"
              >
                {showAllCompleted ? (
                  <>
                    <ChevronUp className="h-4 w-4" />
                    Show Less
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-4 w-4" />
                    Show All Completed ({completedRequirements.length - 10} more)
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
