"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Plus, AlertTriangle, Clock, CheckCircle, Package, LogOut } from "lucide-react"
import RequirementForm from "@/components/requirement-form"
import EditRequirementForm from "@/components/edit-requirement-form"
import RequirementsTable from "@/components/requirements-table"
import SupplyTracker from "@/components/supply-tracker"
import Dashboard from "@/components/dashboard"
import POManagement from "@/components/po-management"
import POForm from "@/components/po-form"
import EditPOForm from "@/components/edit-po-form"
import SupplyDetailsModal from "@/components/supply-details-modal"
import { useAuth } from "@/contexts/auth-context"
import { useRouter } from "next/navigation"
import { isDeliveryDueSoon } from "@/utils/dateFormat"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

// Add import for debug logger
import { debugLog } from "@/lib/debug-logger"

export default function SRUApp() {
  const router = useRouter()
  const { user, userData, logout, updateUserData, loading } = useAuth()
  const [showForm, setShowForm] = useState(false)
  const [showEditForm, setShowEditForm] = useState(false)
  const [editingRequirement, setEditingRequirement] = useState<any>(null)
  const [showPOForm, setShowPOForm] = useState(false)
  const [showEditPOForm, setShowEditPOForm] = useState(false)
  const [editingPO, setEditingPO] = useState<any>(null)
  const [activeTab, setActiveTab] = useState("dashboard")
  const [showSupplyDetailsModal, setShowSupplyDetailsModal] = useState(false)
  const [selectedRequirementForSupply, setSelectedRequirementForSupply] = useState<any>(null)

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      router.push("/login")
    }
  }, [user, loading, router])

  // Auto-update priority based on delivery dates
  // Update the useEffect that depends on userData.requirements
  useEffect(() => {
    if (!userData.requirements?.length) return

    debugLog("Current user data:", userData)

    const updateUrgentRequirements = () => {
      const updatedRequirements = userData.requirements.map((req: any) => {
        // Only update if not already completed and not already urgent
        if (req.status !== "Completed" && req.priority !== "Urgent") {
          if (isDeliveryDueSoon(req.deliveryDate, 5)) {
            return { ...req, priority: "Urgent" }
          }
        }
        return req
      })

      // Check if any requirements were updated
      const hasChanges = updatedRequirements.some(
        (req: any, index: number) => req.priority !== userData.requirements[index]?.priority,
      )

      if (hasChanges) {
        updateUserData({ requirements: updatedRequirements }).catch((error) => {
          console.error("Failed to update urgent requirements:", error)
        })
      }
    }

    // Run immediately and then every hour
    updateUrgentRequirements()
    const interval = setInterval(updateUrgentRequirements, 60 * 60 * 1000) // 1 hour

    return () => clearInterval(interval)
  }, [userData]) // Updated dependency array to use userData instead of userData.requirements

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!user) {
    return null // Will redirect to login
  }

  const { requirements = [], pos = [], supplyHistory = [] } = userData

  const handleAddRequirement = (newRequirement: any) => {
    // Check if delivery is due soon and set priority accordingly
    const priority = isDeliveryDueSoon(newRequirement.deliveryDate, 5) ? "Urgent" : newRequirement.priority

    const requirement = {
      ...newRequirement,
      priority,
      id: `REQ-${String(requirements.length + 1).padStart(3, "0")}`,
      status: "Pending",
      createdDate: new Date().toISOString().split("T")[0],
    }
    updateUserData({ requirements: [...requirements, requirement] })
    setShowForm(false)
  }

  const handleEditRequirement = (requirement: any) => {
    setEditingRequirement(requirement)
    setShowEditForm(true)
  }

  const handleUpdateRequirement = (updatedRequirement: any) => {
    // Check if delivery is due soon and update priority accordingly
    const priority = isDeliveryDueSoon(updatedRequirement.deliveryDate, 5) ? "Urgent" : updatedRequirement.priority

    const finalRequirement = { ...updatedRequirement, priority }
    const updatedRequirements = requirements.map((req) => (req.id === finalRequirement.id ? finalRequirement : req))
    updateUserData({ requirements: updatedRequirements })
    setShowEditForm(false)
    setEditingRequirement(null)
  }

  const handleDeleteRequirement = (requirementId: string) => {
    const updatedRequirements = requirements.filter((req) => req.id !== requirementId)
    // Also remove related supply history
    const updatedSupplyHistory = supplyHistory.filter((entry) => entry.reqId !== requirementId)
    updateUserData({
      requirements: updatedRequirements,
      supplyHistory: updatedSupplyHistory,
    })
  }

  const handleViewSupplyDetails = (requirement: any) => {
    setSelectedRequirementForSupply(requirement)
    setShowSupplyDetailsModal(true)
  }

  // Update the handleAddPO function to ensure proper data structure
  const handleAddPO = async (newPO: any) => {
    try {
      const po = {
        ...newPO,
        id: `PO-${String(pos.length + 1).padStart(3, "0")}`,
        createdDate: new Date().toISOString().split("T")[0],
        items: newPO.items.map((item: any) => ({
          ...item,
          balanceQty: item.quantity,
        })),
      }

      debugLog("Adding new PO:", po)

      // Make a copy of the current POs array to avoid reference issues
      const updatedPOs = [...pos, po]
      await updateUserData({ pos: updatedPOs })
      setShowPOForm(false)
    } catch (error) {
      console.error("Failed to add PO:", error)
      alert("Failed to add Purchase Order. Please try again.")
    }
  }

  const handleEditPO = (po: any) => {
    setEditingPO(po)
    setShowEditPOForm(true)
  }

  const handleUpdatePO = (updatedPO: any) => {
    const updatedPOs = pos.map((po) => (po.id === updatedPO.id ? updatedPO : po))
    updateUserData({ pos: updatedPOs })
    setShowEditPOForm(false)
    setEditingPO(null)
  }

  const handleDeletePO = (poId: string) => {
    const updatedPOs = pos.filter((po) => po.id !== poId)
    updateUserData({ pos: updatedPOs })
  }

  const handleUpdatePOBalance = (poId: string, materialName: string, newBalance: number) => {
    const updatedPOs = pos.map((po) => {
      if (po.id === poId) {
        return {
          ...po,
          items: po.items.map((item) =>
            item.materialName === materialName ? { ...item, balanceQty: newBalance } : item,
          ),
        }
      }
      return po
    })
    updateUserData({ pos: updatedPOs })
  }

  const handleUpdateSupply = (reqId: string, materialName: string, suppliedQuantity: number, notes = "") => {
    // Add to supply history
    const newSupplyEntry = {
      id: `SUPPLY-${String(supplyHistory.length + 1).padStart(3, "0")}`,
      reqId,
      poNumber: requirements.find((req) => req.id === reqId)?.poNumber || "",
      materialName,
      quantity: suppliedQuantity,
      date: new Date().toISOString().split("T")[0],
      notes,
    }
    const updatedSupplyHistory = [...supplyHistory, newSupplyEntry]

    // Update requirements
    const updatedRequirements = requirements.map((req) => {
      if (req.id === reqId) {
        const updatedItems = req.selectedItems.map((item: any) => {
          if (item.materialName === materialName) {
            return {
              ...item,
              quantitySupplied: item.quantitySupplied + suppliedQuantity,
            }
          }
          return item
        })

        const allCompleted = updatedItems.every((item: any) => item.quantitySupplied >= item.quantityRequired)

        return {
          ...req,
          selectedItems: updatedItems,
          status: allCompleted ? "Completed" : "In Progress",
        }
      }
      return req
    })

    // Update PO balance
    const requirement = requirements.find((req) => req.id === reqId)
    let updatedPOs = pos
    if (requirement) {
      const po = pos.find((p) => p.poNumber === requirement.poNumber)
      if (po) {
        updatedPOs = pos.map((p) => {
          if (p.id === po.id) {
            return {
              ...p,
              items: p.items.map((item) =>
                item.materialName === materialName
                  ? { ...item, balanceQty: Math.max(0, item.balanceQty - suppliedQuantity) }
                  : item,
              ),
            }
          }
          return p
        })
      }
    }

    // Update all data at once
    updateUserData({
      requirements: updatedRequirements,
      supplyHistory: updatedSupplyHistory,
      pos: updatedPOs,
    })
  }

  const handleUpdateSupplyHistory = (updatedHistory: any[]) => {
    // Recalculate requirements based on updated history
    const updatedRequirements = requirements.map((req) => {
      const reqSupplyEntries = updatedHistory.filter((entry) => entry.reqId === req.id)

      const updatedItems = req.selectedItems.map((item: any) => {
        const itemSupplies = reqSupplyEntries.filter((entry) => entry.materialName === item.materialName)
        const totalSupplied = itemSupplies.reduce((sum, entry) => sum + entry.quantity, 0)

        return {
          ...item,
          quantitySupplied: totalSupplied,
        }
      })

      const allCompleted = updatedItems.every((item: any) => item.quantitySupplied >= item.quantityRequired)

      return {
        ...req,
        selectedItems: updatedItems,
        status: allCompleted ? "Completed" : "In Progress",
      }
    })

    updateUserData({
      requirements: updatedRequirements,
      supplyHistory: updatedHistory,
    })
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "Urgent":
        return "destructive"
      case "High":
        return "default"
      case "Medium":
        return "secondary"
      case "Low":
        return "outline"
      default:
        return "secondary"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Completed":
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case "In Progress":
        return <Clock className="h-4 w-4 text-yellow-600" />
      case "Pending":
        return <AlertTriangle className="h-4 w-4 text-red-600" />
      default:
        return <Package className="h-4 w-4" />
    }
  }

  const handleDashboardCardClick = (cardType: string) => {
    setActiveTab("requirements")
  }

  const handleLogout = async () => {
    try {
      await logout()
      router.push("/login")
    } catch (error) {
      console.error("Error logging out:", error)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">SRU Material Management</h1>
              <p className="text-sm text-gray-600">Durgapur Steel Plant - Refractory Requirements Tracker</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex gap-3">
                <Button onClick={() => setShowPOForm(true)} variant="outline" className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  New PO
                </Button>
                <Button onClick={() => setShowForm(true)} className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  New Requirement
                </Button>
              </div>

              <div className="flex items-center gap-3 ml-4 pl-4 border-l">
                <div className="text-right">
                  <p className="text-sm font-medium">{user.name}</p>
                  <p className="text-xs text-gray-500">{user.email}</p>
                </div>

                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="destructive"
                      size="sm"
                      className="flex items-center gap-2 bg-red-600 hover:bg-red-700"
                    >
                      <LogOut className="h-4 w-4" />
                      Logout
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you sure you want to logout?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Your current session will be ended and you'll need to login again to access the system.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={handleLogout} className="bg-red-600 hover:bg-red-700">
                        Yes, Logout
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="pos">Purchase Orders</TabsTrigger>
            <TabsTrigger value="requirements">Requirements</TabsTrigger>
            <TabsTrigger value="supply">Supply Tracker</TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard">
            <Dashboard
              requirements={requirements}
              getPriorityColor={getPriorityColor}
              getStatusIcon={getStatusIcon}
              onCardClick={handleDashboardCardClick}
            />
          </TabsContent>

          <TabsContent value="pos">
            <POManagement
              pos={pos}
              onUpdateBalance={handleUpdatePOBalance}
              onEditPO={handleEditPO}
              onDeletePO={handleDeletePO}
            />
          </TabsContent>

          <TabsContent value="requirements">
            <Card>
              <CardHeader>
                <CardTitle>Material Requirements</CardTitle>
                <CardDescription>All material requirements from steel plant departments</CardDescription>
              </CardHeader>
              <CardContent>
                <RequirementsTable
                  requirements={requirements}
                  getPriorityColor={getPriorityColor}
                  getStatusIcon={getStatusIcon}
                  onEditRequirement={handleEditRequirement}
                  onDeleteRequirement={handleDeleteRequirement}
                  onViewSupplyDetails={handleViewSupplyDetails}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="supply">
            <SupplyTracker
              requirements={requirements}
              supplyHistory={supplyHistory}
              onUpdateSupply={handleUpdateSupply}
              onUpdateSupplyHistory={handleUpdateSupplyHistory}
              getPriorityColor={getPriorityColor}
              getStatusIcon={getStatusIcon}
            />
          </TabsContent>
        </Tabs>
      </main>

      {showForm && <RequirementForm pos={pos} onSubmit={handleAddRequirement} onClose={() => setShowForm(false)} />}
      {showEditForm && editingRequirement && (
        <EditRequirementForm
          requirement={editingRequirement}
          pos={pos}
          onSubmit={handleUpdateRequirement}
          onClose={() => {
            setShowEditForm(false)
            setEditingRequirement(null)
          }}
        />
      )}
      {showPOForm && <POForm onSubmit={handleAddPO} onClose={() => setShowPOForm(false)} />}
      {showEditPOForm && editingPO && (
        <EditPOForm
          po={editingPO}
          onSubmit={handleUpdatePO}
          onClose={() => {
            setShowEditPOForm(false)
            setEditingPO(null)
          }}
        />
      )}
      {showSupplyDetailsModal && selectedRequirementForSupply && (
        <SupplyDetailsModal
          requirement={selectedRequirementForSupply}
          supplyHistory={supplyHistory}
          onClose={() => {
            setShowSupplyDetailsModal(false)
            setSelectedRequirementForSupply(null)
          }}
          getPriorityColor={getPriorityColor}
          getStatusIcon={getStatusIcon}
        />
      )}
    </div>
  )
}
