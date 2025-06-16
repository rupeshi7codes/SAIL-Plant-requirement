"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { AlertTriangle, TrendingUp, Package, Clock, ChevronDown, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { JSX } from "react"
import { formatDate } from "@/utils/dateFormat"

interface DashboardProps {
  requirements: any[]
  getPriorityColor: (priority: string) => string
  getStatusIcon: (status: string) => JSX.Element
  onCardClick: (cardType: string) => void
}

export default function Dashboard({ requirements, getPriorityColor, getStatusIcon, onCardClick }: DashboardProps) {
  const [expandedUrgent, setExpandedUrgent] = useState<Set<string>>(new Set())
  const [expandedRecent, setExpandedRecent] = useState<Set<string>>(new Set())

  const urgentRequirements = requirements.filter((req) => req.priority === "Urgent" && req.status !== "Completed")
  const activeRequirements = requirements.filter((req) => req.status !== "Completed")
  const totalRequirements = activeRequirements.length
  const completedRequirements = requirements.filter((req) => req.status === "Completed").length
  const inProgressRequirements = requirements.filter((req) => req.status === "In Progress").length
  const pendingRequirements = requirements.filter((req) => req.status === "Pending").length

  const allRequirements = requirements.length
  const completionRate = allRequirements > 0 ? (completedRequirements / allRequirements) * 100 : 0

  const toggleUrgentExpanded = (reqId: string) => {
    const newExpanded = new Set(expandedUrgent)
    if (newExpanded.has(reqId)) {
      newExpanded.delete(reqId)
    } else {
      newExpanded.add(reqId)
    }
    setExpandedUrgent(newExpanded)
  }

  const toggleRecentExpanded = (reqId: string) => {
    const newExpanded = new Set(expandedRecent)
    if (newExpanded.has(reqId)) {
      newExpanded.delete(reqId)
    } else {
      newExpanded.add(reqId)
    }
    setExpandedRecent(newExpanded)
  }

  // Helper function to get creation timestamp for proper sorting
  const getCreationTimestamp = (req: any) => {
    // Try to use created_at first (ISO string with time), then fall back to createdDate
    if (req.created_at) {
      return new Date(req.created_at).getTime()
    } else if (req.createdDate) {
      return new Date(req.createdDate).getTime()
    } else {
      // Fallback: extract timestamp from ID if it contains one
      const idMatch = req.id?.match(/REQ-(\d+)-/)
      if (idMatch) {
        return Number.parseInt(idMatch[1])
      }
      return 0
    }
  }

  // Helper function to format creation date and time
  const formatCreationDateTime = (req: any) => {
    if (req.created_at) {
      const date = new Date(req.created_at)
      return date.toLocaleString("en-GB", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      })
    } else if (req.createdDate) {
      return formatDate(req.createdDate)
    }
    return "Unknown"
  }

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => onCardClick("total")}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Requirements</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalRequirements}</div>
            <p className="text-xs text-muted-foreground">In Progress & Pending requests</p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => onCardClick("urgent")}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Urgent Items</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{urgentRequirements.length}</div>
            <p className="text-xs text-muted-foreground">Require immediate attention</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completionRate.toFixed(1)}%</div>
            <Progress value={completionRate} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{inProgressRequirements}</div>
            <p className="text-xs text-muted-foreground">Currently being fulfilled</p>
          </CardContent>
        </Card>
      </div>

      {/* Urgent Requirements Alert */}
      {urgentRequirements.length > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="text-red-800 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Urgent Requirements Attention Needed
            </CardTitle>
            <CardDescription className="text-red-700">
              The following requirements need immediate attention
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {urgentRequirements.map((req) => {
                const isExpanded = expandedUrgent.has(req.id)
                return (
                  <div key={req.id}>
                    <div className="flex items-center justify-between p-3 bg-white rounded-lg border">
                      <div className="flex items-center gap-3">
                        {getStatusIcon(req.status)}
                        <div>
                          <Button
                            variant="ghost"
                            className="p-0 h-auto font-medium text-left hover:text-blue-600"
                            onClick={() => toggleUrgentExpanded(req.id)}
                          >
                            <div className="flex items-center gap-2">
                              {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                              {req.poNumber}
                            </div>
                          </Button>
                          <p className="text-sm text-gray-600">
                            {req.areaOfApplication} - {req.selectedItems.length} items
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">Due: {formatDate(req.deliveryDate)}</p>
                        <p className="text-sm text-gray-600">
                          {req.selectedItems.reduce((sum: number, item: any) => sum + (item.quantitySupplied || 0), 0)}/
                          {req.selectedItems.reduce((sum: number, item: any) => sum + item.quantityRequired, 0)} total
                          units
                        </p>
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="mt-2 ml-6 p-3 bg-white rounded border-l-4 border-red-200">
                        <h5 className="font-medium mb-2">Requirement Details:</h5>
                        <div className="space-y-2">
                          {req.selectedItems.map((item: any, index: number) => (
                            <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                              <div>
                                <p className="font-medium text-sm">{item.materialName}</p>
                                <p className="text-xs text-gray-600">
                                  {item.quantitySupplied || 0}/{item.quantityRequired} {item.unit}
                                </p>
                              </div>
                              <div className="text-right">
                                <Progress
                                  value={((item.quantitySupplied || 0) / item.quantityRequired) * 100}
                                  className="w-16 h-2"
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                        {req.notes && (
                          <div className="mt-2 p-2 bg-blue-50 rounded text-sm">
                            <strong>Notes:</strong> {req.notes}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Requirements</CardTitle>
          <CardDescription>Latest 10 material requirements by creation date and time</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {requirements
              .sort((a, b) => {
                // Sort by creation timestamp (most recent first)
                const timestampA = getCreationTimestamp(a)
                const timestampB = getCreationTimestamp(b)
                return timestampB - timestampA // Descending order (newest first)
              })
              .slice(0, 10) // Show only latest 10
              .map((req) => {
                const isExpanded = expandedRecent.has(req.id)
                return (
                  <div key={req.id}>
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-4">
                        {getStatusIcon(req.status)}
                        <div>
                          <Button
                            variant="ghost"
                            className="p-0 h-auto font-medium text-left hover:text-blue-600"
                            onClick={() => toggleRecentExpanded(req.id)}
                          >
                            <div className="flex items-center gap-2">
                              {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                              {req.poNumber}
                            </div>
                          </Button>
                          <p className="text-sm text-gray-600">
                            {req.areaOfApplication} - {req.selectedItems.length} items
                          </p>
                          <p className="text-xs text-gray-500 mt-1">Created: {formatCreationDateTime(req)}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <Badge variant={getPriorityColor(req.priority) as any}>{req.priority}</Badge>
                        <div className="text-right">
                          <p className="text-sm font-medium">
                            {req.selectedItems.reduce((sum: number, item: any) => sum + item.quantityRequired, 0)} total
                            units
                          </p>
                          <p className="text-sm text-gray-600">Due: {formatDate(req.deliveryDate)}</p>
                        </div>
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="mt-2 ml-6 p-3 bg-gray-50 rounded border-l-4 border-blue-200">
                        <h5 className="font-medium mb-2">Requirement Details:</h5>
                        <div className="space-y-2">
                          {req.selectedItems.map((item: any, index: number) => (
                            <div key={index} className="flex justify-between items-center p-2 bg-white rounded">
                              <div>
                                <p className="font-medium text-sm">{item.materialName}</p>
                                <p className="text-xs text-gray-600">
                                  {item.quantitySupplied || 0}/{item.quantityRequired} {item.unit}
                                </p>
                              </div>
                              <div className="text-right">
                                <Progress
                                  value={((item.quantitySupplied || 0) / item.quantityRequired) * 100}
                                  className="w-16 h-2"
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                        {req.notes && (
                          <div className="mt-2 p-2 bg-blue-50 rounded text-sm">
                            <strong>Notes:</strong> {req.notes}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
