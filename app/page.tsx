"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
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
import { supabase } from "@/lib/supabase"
import EnvironmentSetup from "@/components/environment-setup"

// Helper function to get current local date and time
const getCurrentLocalDateTime = () => {
  const now = new Date()
  // Get local timezone offset in minutes
  const timezoneOffset = now.getTimezoneOffset()
  // Adjust for timezone to get local time
  const localTime = new Date(now.getTime() - timezoneOffset * 60000)
  return localTime.toISOString()
}

// Helper function to get current local date in DD/MM/YYYY format
const getCurrentLocalDate = () => {
  const now = new Date()
  const day = now.getDate().toString().padStart(2, "0")
  const month = (now.getMonth() + 1).toString().padStart(2, "0")
  const year = now.getFullYear()
  return `${day}/${month}/${year}`
}

export default function SRUApp() {
  const router = useRouter()
  const { user, loading, logout, pos, requirements, supplyHistory, setPOs, setRequirements, setSupplyHistory } =
    useAuth()

  const [showForm, setShowForm] = useState(false)
  const [showEditForm, setShowEditForm] = useState(false)
  const [editingRequirement, setEditingRequirement] = useState<any>(null)
  const [showPOForm, setShowPOForm] = useState(false)
  const [showEditPOForm, setShowEditPOForm] = useState(false)
  const [editingPO, setEditingPO] = useState<any>(null)
  const [activeTab, setActiveTab] = useState("dashboard")
  const [showSupplyDetailsModal, setShowSupplyDetailsModal] = useState(false)
  const [selectedRequirementForSupply, setSelectedRequirementForSupply] = useState<any>(null)
  const [isEnvironmentConfigured, setIsEnvironmentConfigured] = useState(false)
  const [urgentRequirementsIntervalId, setUrgentRequirementsIntervalId] = useState<NodeJS.Timeout | null>(null)

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      router.push("/login")
    }
  }, [user, loading, router])

  

  // Auto-update priority based on delivery dates
  useEffect(() => {
    if (!requirements?.length) return

    const updateUrgentRequirements = async () => {
      const updatedRequirements = requirements.map((req: any) => {
        // Only update if not already completed and not already urgent
        if (req.status !== "Completed" && req.priority !== "Urgent") {
          if (isDeliveryDueSoon(req.delivery_date, 5)) {
            return { ...req, priority: "Urgent" }
          }
        }
        return req
      })

      // Check if any requirements were updated
      const hasChanges = updatedRequirements.some(
        (req: any, index: number) => req.priority !== requirements[index]?.priority,
      )

      if (hasChanges) {
        setRequirements(updatedRequirements)
        // Save to database
        for (const req of updatedRequirements) {
          if (req.priority === "Urgent") {
            await supabase.from("requirements").update({ priority: "Urgent" }).eq("id", req.id)
          }
        }
      }
    }

    // Run immediately and then every hour
    updateUrgentRequirements()
    const interval = setInterval(updateUrgentRequirements, 60 * 60 * 1000) // 1 hour
    setUrgentRequirementsIntervalId(interval)

    return () => {
      if (urgentRequirementsIntervalId) {
        clearInterval(urgentRequirementsIntervalId)
      }
    }
  }, [requirements, setRequirements, urgentRequirementsIntervalId])

  if (!loading && !isEnvironmentConfigured) {
    return <EnvironmentSetup />
  }

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

  const handleAddRequirement = async (newRequirement: any) => {
    try {
      // Check if delivery is due soon and set priority accordingly
      const priority = isDeliveryDueSoon(newRequirement.deliveryDate, 5) ? "Urgent" : newRequirement.priority

      const currentDateTime = getCurrentLocalDateTime()
      const currentDate = getCurrentLocalDate()

      const requirement = {
        id: `REQ-${Date.now()}-${String(requirements.length + 1).padStart(3, "0")}`,
        user_id: user.id,
        po_number: newRequirement.poNumber,
        area_of_application: newRequirement.areaOfApplication,
        delivery_date: newRequirement.deliveryDate,
        priority,
        status: "Pending",
        notes: newRequirement.notes,
        selected_items: newRequirement.selectedItems,
        created_at: currentDateTime,
      }

      console.log("Creating requirement with local datetime:", currentDateTime)
      console.log("Local date for display:", currentDate)

      // Save to database
      const { error } = await supabase.from("requirements").insert([requirement])
      if (error) throw error

      // Update local state
      const transformedReq = {
        id: requirement.id,
        poNumber: requirement.po_number,
        areaOfApplication: requirement.area_of_application,
        deliveryDate: requirement.delivery_date,
        priority: requirement.priority,
        status: requirement.status,
        notes: requirement.notes,
        selectedItems: requirement.selected_items,
        createdDate: currentDate, // Use local date for display
        created_at: requirement.created_at, // Keep full timestamp for sorting
      }

      setRequirements([...requirements, transformedReq])
      setShowForm(false)
    } catch (error) {
      console.error("Error adding requirement:", error)
      alert("Error adding requirement. Please try again.")
    }
  }

  const handleEditRequirement = (requirement: any) => {
    setEditingRequirement(requirement)
    setShowEditForm(true)
  }

  const handleUpdateRequirement = async (updatedRequirement: any) => {
    try {
      // Check if delivery is due soon and update priority accordingly
      const priority = isDeliveryDueSoon(updatedRequirement.deliveryDate, 5) ? "Urgent" : updatedRequirement.priority

      const finalRequirement = { ...updatedRequirement, priority }

      // Update in database
      const { error } = await supabase
        .from("requirements")
        .update({
          po_number: finalRequirement.poNumber,
          area_of_application: finalRequirement.areaOfApplication,
          delivery_date: finalRequirement.deliveryDate,
          priority: finalRequirement.priority,
          status: finalRequirement.status,
          notes: finalRequirement.notes,
          selected_items: finalRequirement.selectedItems,
        })
        .eq("id", finalRequirement.id)

      if (error) throw error

      // Update local state
      const updatedRequirements = requirements.map((req) => (req.id === finalRequirement.id ? finalRequirement : req))
      setRequirements(updatedRequirements)
      setShowEditForm(false)
      setEditingRequirement(null)
    } catch (error) {
      console.error("Error updating requirement:", error)
      alert("Error updating requirement. Please try again.")
    }
  }

  const handleDeleteRequirement = async (requirementId: string) => {
    try {
      // Delete from database
      const { error } = await supabase.from("requirements").delete().eq("id", requirementId)
      if (error) throw error

      // Also delete related supply history
      await supabase.from("supply_history").delete().eq("req_id", requirementId)

      // Update local state
      const updatedRequirements = requirements.filter((req) => req.id !== requirementId)
      const updatedSupplyHistory = supplyHistory.filter((entry) => entry.reqId !== requirementId)

      setRequirements(updatedRequirements)
      setSupplyHistory(updatedSupplyHistory)
    } catch (error) {
      console.error("Error deleting requirement:", error)
      alert("Error deleting requirement. Please try again.")
    }
  }

  const handleViewSupplyDetails = (requirement: any) => {
    setSelectedRequirementForSupply(requirement)
    setShowSupplyDetailsModal(true)
  }

  const handleAddPO = async (newPO: any) => {
    try {
      console.log("Adding new PO:", newPO)

      const currentDateTime = getCurrentLocalDateTime()
      const currentDate = getCurrentLocalDate()

      const po = {
        id: `PO-${Date.now()}-${String(pos.length + 1).padStart(3, "0")}`,
        user_id: user.id,
        po_number: newPO.poNumber,
        po_date: newPO.poDate,
        area_of_application: newPO.areaOfApplication,
        items: newPO.items.map((item: any) => ({
          ...item,
          balanceQty: item.quantity,
        })),
        pdf_file_url: newPO.pdfFileUrl || null,
        pdf_file_name: newPO.pdfFileName || null,
        created_at: currentDateTime,
      }

      console.log("Creating PO with local datetime:", currentDateTime)
      console.log("Local date for display:", currentDate)

      // Save to database
      const { error } = await supabase.from("purchase_orders").insert([po])
      if (error) throw error

      // Transform for local state
      const transformedPO = {
        id: po.id,
        poNumber: po.po_number,
        poDate: po.po_date,
        areaOfApplication: po.area_of_application,
        items: po.items,
        pdfFileUrl: po.pdf_file_url,
        pdfFileName: po.pdf_file_name,
        createdDate: currentDate, // Use local date for display
        created_at: po.created_at, // Keep full timestamp for sorting
      }

      setPOs([...pos, transformedPO])
      console.log("PO added successfully with correct local date")
      setShowPOForm(false)
    } catch (error) {
      console.error("Error adding PO:", error)
      alert("Error adding PO. Please try again.")
    }
  }

  const handleEditPO = (po: any) => {
    setEditingPO(po)
    setShowEditPOForm(true)
  }

  const handleUpdatePO = async (updatedPO: any) => {
    try {
      // Update in database
      const { error } = await supabase
        .from("purchase_orders")
        .update({
          po_number: updatedPO.poNumber,
          po_date: updatedPO.poDate,
          area_of_application: updatedPO.areaOfApplication,
          items: updatedPO.items,
          pdf_file_url: updatedPO.pdfFileUrl,
          pdf_file_name: updatedPO.pdfFileName,
        })
        .eq("id", updatedPO.id)

      if (error) throw error

      // Update local state
      const updatedPOs = pos.map((po) => (po.id === updatedPO.id ? updatedPO : po))
      setPOs(updatedPOs)
      setShowEditPOForm(false)
      setEditingPO(null)
    } catch (error) {
      console.error("Error updating PO:", error)
      alert("Error updating PO. Please try again.")
    }
  }

  const handleDeletePO = async (poId: string) => {
    try {
      // Delete from database
      const { error } = await supabase.from("purchase_orders").delete().eq("id", poId)
      if (error) throw error

      // Update local state
      const updatedPOs = pos.filter((po) => po.id !== poId)
      setPOs(updatedPOs)
    } catch (error) {
      console.error("Error deleting PO:", error)
      alert("Error deleting PO. Please try again.")
    }
  }

  const handleUpdatePOBalance = async (poId: string, materialName: string, newBalance: number) => {
    try {
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

      // Update in database
      const poToUpdate = updatedPOs.find((po) => po.id === poId)
      if (poToUpdate) {
        const { error } = await supabase.from("purchase_orders").update({ items: poToUpdate.items }).eq("id", poId)

        if (error) throw error
      }

      setPOs(updatedPOs)
    } catch (error) {
      console.error("Error updating PO balance:", error)
      alert("Error updating PO balance. Please try again.")
    }
  }

  const handleUpdateSupply = async (reqId: string, materialName: string, suppliedQuantity: number, notes = "") => {
    try {
      console.log("=== UPDATING SUPPLY ===")
      console.log("Requirement ID:", reqId)
      console.log("Material:", materialName)
      console.log("Supplied Quantity:", suppliedQuantity)

      const currentDateTime = getCurrentLocalDateTime()
      const currentDate = getCurrentLocalDate()

      // Add to supply history
      const newSupplyEntry = {
        id: `SUPPLY-${Date.now()}-${String(supplyHistory.length + 1).padStart(3, "0")}`,
        user_id: user.id,
        req_id: reqId,
        po_number: requirements.find((req) => req.id === reqId)?.poNumber || "",
        material_name: materialName,
        quantity: suppliedQuantity,
        date: currentDate, // Use local date format for supply date
        notes,
        created_at: currentDateTime,
      }

      // Save supply history to database
      const { error: supplyError } = await supabase.from("supply_history").insert([newSupplyEntry])
      if (supplyError) throw supplyError

      // Transform for local state
      const transformedSupply = {
        id: newSupplyEntry.id,
        reqId: newSupplyEntry.req_id,
        poNumber: newSupplyEntry.po_number,
        materialName: newSupplyEntry.material_name,
        quantity: newSupplyEntry.quantity,
        date: newSupplyEntry.date,
        notes: newSupplyEntry.notes,
      }

      const updatedSupplyHistory = [...supplyHistory, transformedSupply]
      setSupplyHistory(updatedSupplyHistory)

      // Update requirements with new supply quantities
      const updatedRequirements = requirements.map((req) => {
        if (req.id === reqId) {
          const updatedItems = req.selectedItems.map((item: any) => {
            if (item.materialName === materialName) {
              const newQuantitySupplied = (item.quantitySupplied || 0) + suppliedQuantity
              return {
                ...item,
                quantitySupplied: newQuantitySupplied,
              }
            }
            return item
          })

          const allCompleted = updatedItems.every((item: any) => (item.quantitySupplied || 0) >= item.quantityRequired)

          const updatedReq = {
            ...req,
            selectedItems: updatedItems,
            status: allCompleted ? "Completed" : "In Progress",
          }

          console.log("Updated requirement:", updatedReq)

          // Update requirement in database with new selected_items and status
          supabase
            .from("requirements")
            .update({
              selected_items: updatedItems,
              status: updatedReq.status,
            })
            .eq("id", reqId)
            .then(({ error }) => {
              if (error) {
                console.error("Error updating requirement in database:", error)
              } else {
                console.log("Successfully updated requirement in database")
              }
            })

          return updatedReq
        }
        return req
      })

      setRequirements(updatedRequirements)

      // Update PO balance
      const requirement = requirements.find((req) => req.id === reqId)
      if (requirement) {
        const po = pos.find((p) => p.poNumber === requirement.poNumber)
        if (po) {
          const updatedPOs = pos.map((p) => {
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

          setPOs(updatedPOs)

          // Update PO in database
          const updatedPO = updatedPOs.find((p) => p.id === po.id)
          if (updatedPO) {
            supabase
              .from("purchase_orders")
              .update({ items: updatedPO.items })
              .eq("id", po.id)
              .then(({ error }) => {
                if (error) {
                  console.error("Error updating PO in database:", error)
                } else {
                  console.log("Successfully updated PO balance in database")
                }
              })
          }
        }
      }

      console.log("=== SUPPLY UPDATE COMPLETE ===")
    } catch (error) {
      console.error("Error updating supply:", error)
      alert("Error updating supply. Please try again.")
    }
  }

  const handleUpdateSupplyHistory = async (updatedHistory: any[]) => {
    try {
      console.log("=== UPDATING SUPPLY HISTORY ===")
      console.log("Updated history:", updatedHistory)

      // Update local state first
      setSupplyHistory(updatedHistory)

      // Update each modified supply history entry in the database
      for (const entry of updatedHistory) {
        const { error } = await supabase
          .from("supply_history")
          .update({
            quantity: entry.quantity,
            date: entry.date,
            notes: entry.notes,
          })
          .eq("id", entry.id)

        if (error) {
          console.error("Error updating supply history entry:", error)
        }
      }

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

        const allCompleted = updatedItems.every((item: any) => (item.quantitySupplied || 0) >= item.quantityRequired)

        const updatedReq = {
          ...req,
          selectedItems: updatedItems,
          status: allCompleted ? "Completed" : "In Progress",
        }

        // Update requirement in database
        supabase
          .from("requirements")
          .update({
            selected_items: updatedItems,
            status: updatedReq.status,
          })
          .eq("id", req.id)
          .then(({ error }) => {
            if (error) {
              console.error("Error updating requirement in database:", error)
            } else {
              console.log("Successfully updated requirement in database")
            }
          })

        return updatedReq
      })

      setRequirements(updatedRequirements)

      console.log("=== SUPPLY HISTORY UPDATE COMPLETE ===")
    } catch (error) {
      console.error("Error updating supply history:", error)
      alert("Error updating supply history. Please try again.")
    }
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
      console.log("Logging out user...")
      await logout()
      console.log("Logout successful, redirecting...")
      router.push("/login")
    } catch (error) {
      console.error("Error logging out:", error)
      // Force redirect even if logout fails
      window.location.href = "/login"
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Material Requirement Management</h1>
              <p className="text-sm text-gray-600">SAIL Refractory Unit</p>
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
                  <p className="text-sm font-medium">
                    {user.user_metadata?.name || user.email?.split("@")[0] || "User"}
                  </p>
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
                      <AlertDialogTitle>Confirm Logout</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to logout? Your current session will be ended and you'll need to login
                        again to access the system.
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
              requirements={requirements || []}
              getPriorityColor={getPriorityColor}
              getStatusIcon={getStatusIcon}
              onCardClick={handleDashboardCardClick}
            />
          </TabsContent>

          <TabsContent value="pos">
            <POManagement
              pos={pos || []}
              onUpdateBalance={handleUpdatePOBalance}
              onEditPO={handleEditPO}
              onDeletePO={handleDeletePO}
            />
          </TabsContent>

          <TabsContent value="requirements">
            <Card>
              <CardContent>
                <RequirementsTable
                  requirements={requirements || []}
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
              requirements={requirements || []}
              supplyHistory={supplyHistory || []}
              onUpdateSupply={handleUpdateSupply}
              onUpdateSupplyHistory={handleUpdateSupplyHistory}
              getPriorityColor={getPriorityColor}
              getStatusIcon={getStatusIcon}
            />
          </TabsContent>
        </Tabs>
      </main>

      {showForm && (
        <RequirementForm pos={pos || []} onSubmit={handleAddRequirement} onClose={() => setShowForm(false)} />
      )}
      {showEditForm && editingRequirement && (
        <EditRequirementForm
          requirement={editingRequirement}
          pos={pos || []}
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
          supplyHistory={supplyHistory || []}
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
