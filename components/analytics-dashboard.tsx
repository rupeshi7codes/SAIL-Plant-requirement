"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  AreaChart,
  Area,
} from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { TrendingUp, TrendingDown, BarChart3, Activity, Target } from "lucide-react"

interface AnalyticsDashboardProps {
  requirements: any[]
  pos: any[]
  supplyHistory: any[]
}

export default function AnalyticsDashboard({ requirements, pos, supplyHistory }: AnalyticsDashboardProps) {
  const [timeRange, setTimeRange] = useState("3months")
  const [selectedDepartment, setSelectedDepartment] = useState("all")

  // Color palette for charts
  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8", "#82CA9D", "#FFC658", "#FF7C7C"]

  // Department-wise consumption analysis
  const getDepartmentConsumption = () => {
    const departmentData: { [key: string]: { required: number; supplied: number; pending: number } } = {}

    requirements.forEach((req) => {
      if (!departmentData[req.department]) {
        departmentData[req.department] = { required: 0, supplied: 0, pending: 0 }
      }

      req.selectedItems.forEach((item: any) => {
        departmentData[req.department].required += item.quantityRequired
        departmentData[req.department].supplied += item.quantitySupplied
        departmentData[req.department].pending += item.quantityRequired - item.quantitySupplied
      })
    })

    return Object.entries(departmentData).map(([department, data]) => ({
      department,
      ...data,
      efficiency: data.required > 0 ? (data.supplied / data.required) * 100 : 0,
    }))
  }

  // Material type consumption analysis
  const getMaterialConsumption = () => {
    const materialData: { [key: string]: { required: number; supplied: number } } = {}

    requirements.forEach((req) => {
      req.selectedItems.forEach((item: any) => {
        if (!materialData[item.materialName]) {
          materialData[item.materialName] = { required: 0, supplied: 0 }
        }
        materialData[item.materialName].required += item.quantityRequired
        materialData[item.materialName].supplied += item.quantitySupplied
      })
    })

    return Object.entries(materialData)
      .map(([material, data]) => ({
        material: material.length > 30 ? material.substring(0, 30) + "..." : material,
        fullName: material,
        ...data,
        efficiency: data.required > 0 ? (data.supplied / data.required) * 100 : 0,
      }))
      .sort((a, b) => b.required - a.required)
      .slice(0, 10) // Top 10 materials
  }

  // Monthly consumption trends
  const getMonthlyTrends = () => {
    const monthlyData: { [key: string]: { required: number; supplied: number } } = {}

    requirements.forEach((req) => {
      const month = new Date(req.createdDate).toLocaleDateString("en-US", { year: "numeric", month: "short" })
      if (!monthlyData[month]) {
        monthlyData[month] = { required: 0, supplied: 0 }
      }

      req.selectedItems.forEach((item: any) => {
        monthlyData[month].required += item.quantityRequired
        monthlyData[month].supplied += item.quantitySupplied
      })
    })

    return Object.entries(monthlyData)
      .map(([month, data]) => ({
        month,
        ...data,
        pending: data.required - data.supplied,
      }))
      .sort((a, b) => new Date(a.month).getTime() - new Date(b.month).getTime())
  }

  // Priority distribution
  const getPriorityDistribution = () => {
    const priorityData: { [key: string]: number } = {}

    requirements.forEach((req) => {
      priorityData[req.priority] = (priorityData[req.priority] || 0) + 1
    })

    return Object.entries(priorityData).map(([priority, count]) => ({
      priority,
      count,
      percentage: (count / requirements.length) * 100,
    }))
  }

  // Status distribution
  const getStatusDistribution = () => {
    const statusData: { [key: string]: number } = {}

    requirements.forEach((req) => {
      statusData[req.status] = (statusData[req.status] || 0) + 1
    })

    return Object.entries(statusData).map(([status, count]) => ({
      status,
      count,
      percentage: (count / requirements.length) * 100,
    }))
  }

  // Supply efficiency by department
  const getDepartmentEfficiency = () => {
    return getDepartmentConsumption().map((dept) => ({
      department: dept.department.length > 15 ? dept.department.substring(0, 15) + "..." : dept.department,
      fullName: dept.department,
      efficiency: dept.efficiency,
      supplied: dept.supplied,
      required: dept.required,
    }))
  }

  // Key metrics calculation
  const getKeyMetrics = () => {
    const totalRequired = requirements.reduce(
      (sum, req) => sum + req.selectedItems.reduce((itemSum: number, item: any) => itemSum + item.quantityRequired, 0),
      0,
    )
    const totalSupplied = requirements.reduce(
      (sum, req) => sum + req.selectedItems.reduce((itemSum: number, item: any) => itemSum + item.quantitySupplied, 0),
      0,
    )
    const totalPending = totalRequired - totalSupplied
    const overallEfficiency = totalRequired > 0 ? (totalSupplied / totalRequired) * 100 : 0

    const urgentCount = requirements.filter((req) => req.priority === "Urgent").length
    const completedCount = requirements.filter((req) => req.status === "Completed").length

    return {
      totalRequired,
      totalSupplied,
      totalPending,
      overallEfficiency,
      urgentCount,
      completedCount,
      totalPOs: pos.length,
      avgDeliveryTime: 15, // Mock data - could be calculated from actual delivery dates
    }
  }

  const departmentConsumption = getDepartmentConsumption()
  const materialConsumption = getMaterialConsumption()
  const monthlyTrends = getMonthlyTrends()
  const priorityDistribution = getPriorityDistribution()
  const statusDistribution = getStatusDistribution()
  const departmentEfficiency = getDepartmentEfficiency()
  const keyMetrics = getKeyMetrics()

  return (
    <div className="space-y-6">
      {/* Header with filters */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-6 w-6" />
                Analytics Dashboard
              </CardTitle>
              <CardDescription>Material consumption trends and department-wise analysis</CardDescription>
            </div>
            <div className="flex gap-4">
              <Select value={timeRange} onValueChange={setTimeRange}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1month">Last Month</SelectItem>
                  <SelectItem value="3months">Last 3 Months</SelectItem>
                  <SelectItem value="6months">Last 6 Months</SelectItem>
                  <SelectItem value="1year">Last Year</SelectItem>
                </SelectContent>
              </Select>
              <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Departments</SelectItem>
                  {Array.from(new Set(requirements.map((req) => req.department))).map((dept) => (
                    <SelectItem key={dept} value={dept}>
                      {dept}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overall Efficiency</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{keyMetrics.overallEfficiency.toFixed(1)}%</div>
            <Progress value={keyMetrics.overallEfficiency} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-2">
              {keyMetrics.totalSupplied.toLocaleString()} / {keyMetrics.totalRequired.toLocaleString()} units supplied
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Materials</CardTitle>
            <TrendingDown className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{keyMetrics.totalPending.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Units awaiting supply</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Urgent Requirements</CardTitle>
            <Activity className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{keyMetrics.urgentCount}</div>
            <p className="text-xs text-muted-foreground">High priority items</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {((keyMetrics.completedCount / requirements.length) * 100).toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">
              {keyMetrics.completedCount} of {requirements.length} completed
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Tabs */}
      <Tabs defaultValue="consumption" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="consumption">Consumption Analysis</TabsTrigger>
          <TabsTrigger value="trends">Trends & Patterns</TabsTrigger>
          <TabsTrigger value="efficiency">Efficiency Metrics</TabsTrigger>
          <TabsTrigger value="distribution">Distribution Analysis</TabsTrigger>
        </TabsList>

        <TabsContent value="consumption" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Department-wise Consumption */}
            <Card>
              <CardHeader>
                <CardTitle>Department-wise Material Consumption</CardTitle>
                <CardDescription>Required vs Supplied materials by department</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer
                  config={{
                    required: { label: "Required", color: "hsl(var(--chart-1))" },
                    supplied: { label: "Supplied", color: "hsl(var(--chart-2))" },
                    pending: { label: "Pending", color: "hsl(var(--chart-3))" },
                  }}
                  className="h-[400px]"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={departmentConsumption} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="department" angle={-45} textAnchor="end" height={100} />
                      <YAxis />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Legend />
                      <Bar dataKey="required" fill="var(--color-required)" name="Required" />
                      <Bar dataKey="supplied" fill="var(--color-supplied)" name="Supplied" />
                      <Bar dataKey="pending" fill="var(--color-pending)" name="Pending" />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>

            {/* Top Materials Consumption */}
            <Card>
              <CardHeader>
                <CardTitle>Top 10 Materials by Consumption</CardTitle>
                <CardDescription>Most requested materials across all departments</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer
                  config={{
                    required: { label: "Required", color: "hsl(var(--chart-1))" },
                    supplied: { label: "Supplied", color: "hsl(var(--chart-2))" },
                  }}
                  className="h-[400px]"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={materialConsumption}
                      layout="horizontal"
                      margin={{ top: 20, right: 30, left: 100, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" />
                      <YAxis dataKey="material" type="category" width={100} />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Legend />
                      <Bar dataKey="required" fill="var(--color-required)" name="Required" />
                      <Bar dataKey="supplied" fill="var(--color-supplied)" name="Supplied" />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="trends" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Monthly Trends */}
            <Card>
              <CardHeader>
                <CardTitle>Monthly Consumption Trends</CardTitle>
                <CardDescription>Material requirements and supply over time</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer
                  config={{
                    required: { label: "Required", color: "hsl(var(--chart-1))" },
                    supplied: { label: "Supplied", color: "hsl(var(--chart-2))" },
                    pending: { label: "Pending", color: "hsl(var(--chart-3))" },
                  }}
                  className="h-[400px]"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={monthlyTrends} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Legend />
                      <Area
                        type="monotone"
                        dataKey="required"
                        stackId="1"
                        stroke="var(--color-required)"
                        fill="var(--color-required)"
                        name="Required"
                      />
                      <Area
                        type="monotone"
                        dataKey="supplied"
                        stackId="2"
                        stroke="var(--color-supplied)"
                        fill="var(--color-supplied)"
                        name="Supplied"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>

            {/* Supply Efficiency Trend */}
            <Card>
              <CardHeader>
                <CardTitle>Supply Efficiency Trend</CardTitle>
                <CardDescription>Monthly supply efficiency percentage</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer
                  config={{
                    efficiency: { label: "Efficiency %", color: "hsl(var(--chart-4))" },
                  }}
                  className="h-[400px]"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={monthlyTrends.map((item) => ({
                        ...item,
                        efficiency: item.required > 0 ? (item.supplied / item.required) * 100 : 0,
                      }))}
                      margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis domain={[0, 100]} />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="efficiency"
                        stroke="var(--color-efficiency)"
                        strokeWidth={3}
                        name="Efficiency %"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="efficiency" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Department Efficiency */}
            <Card>
              <CardHeader>
                <CardTitle>Department Supply Efficiency</CardTitle>
                <CardDescription>Supply efficiency percentage by department</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer
                  config={{
                    efficiency: { label: "Efficiency %", color: "hsl(var(--chart-5))" },
                  }}
                  className="h-[400px]"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={departmentEfficiency} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="department" angle={-45} textAnchor="end" height={100} />
                      <YAxis domain={[0, 100]} />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Legend />
                      <Bar dataKey="efficiency" fill="var(--color-efficiency)" name="Efficiency %" />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>

            {/* Material Efficiency */}
            <Card>
              <CardHeader>
                <CardTitle>Material Supply Efficiency</CardTitle>
                <CardDescription>Top materials by supply efficiency</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {materialConsumption.slice(0, 8).map((material, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="font-medium" title={material.fullName}>
                          {material.material}
                        </span>
                        <span>{material.efficiency.toFixed(1)}%</span>
                      </div>
                      <Progress value={material.efficiency} className="h-2" />
                      <div className="flex justify-between text-xs text-gray-600">
                        <span>Supplied: {material.supplied}</span>
                        <span>Required: {material.required}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="distribution" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Priority Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Priority Distribution</CardTitle>
                <CardDescription>Requirements breakdown by priority level</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer
                  config={{
                    count: { label: "Count", color: "hsl(var(--chart-1))" },
                  }}
                  className="h-[300px]"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={priorityDistribution}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ priority, percentage }) => `${priority}: ${percentage.toFixed(1)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="count"
                      >
                        {priorityDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>

            {/* Status Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Status Distribution</CardTitle>
                <CardDescription>Requirements breakdown by completion status</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer
                  config={{
                    count: { label: "Count", color: "hsl(var(--chart-2))" },
                  }}
                  className="h-[300px]"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={statusDistribution}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ status, percentage }) => `${status}: ${percentage.toFixed(1)}%`}
                        outerRadius={80}
                        fill="#82ca9d"
                        dataKey="count"
                      >
                        {statusDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>
          </div>

          {/* Department Summary Table */}
          <Card>
            <CardHeader>
              <CardTitle>Department Performance Summary</CardTitle>
              <CardDescription>Comprehensive overview of each department's material management</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Department</th>
                      <th className="text-right p-2">Total Required</th>
                      <th className="text-right p-2">Total Supplied</th>
                      <th className="text-right p-2">Pending</th>
                      <th className="text-right p-2">Efficiency</th>
                      <th className="text-center p-2">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {departmentConsumption.map((dept, index) => (
                      <tr key={index} className="border-b hover:bg-gray-50">
                        <td className="p-2 font-medium">{dept.department}</td>
                        <td className="text-right p-2">{dept.required.toLocaleString()}</td>
                        <td className="text-right p-2">{dept.supplied.toLocaleString()}</td>
                        <td className="text-right p-2">{dept.pending.toLocaleString()}</td>
                        <td className="text-right p-2">{dept.efficiency.toFixed(1)}%</td>
                        <td className="text-center p-2">
                          <Badge
                            variant={
                              dept.efficiency >= 90
                                ? "default"
                                : dept.efficiency >= 70
                                  ? "secondary"
                                  : dept.efficiency >= 50
                                    ? "outline"
                                    : "destructive"
                            }
                          >
                            {dept.efficiency >= 90
                              ? "Excellent"
                              : dept.efficiency >= 70
                                ? "Good"
                                : dept.efficiency >= 50
                                  ? "Average"
                                  : "Needs Attention"}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
