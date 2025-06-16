"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { supabase } from "@/lib/supabase"

interface TestResult {
  table: string
  status: "success" | "error"
  message: string
  count?: number
}

export default function DatabaseTest() {
  const [results, setResults] = useState<TestResult[]>([])
  const [loading, setLoading] = useState(false)

  const testDatabaseConnection = async () => {
    setLoading(true)
    setResults([])

    const tables = ["purchase_orders", "requirements", "supply_history"]
    const testResults: TestResult[] = []

    for (const table of tables) {
      try {
        const { data, error, count } = await supabase.from(table).select("*", { count: "exact", head: true })

        if (error) {
          testResults.push({
            table,
            status: "error",
            message: error.message,
          })
        } else {
          testResults.push({
            table,
            status: "success",
            message: "Connection successful",
            count: count || 0,
          })
        }
      } catch (err) {
        testResults.push({
          table,
          status: "error",
          message: err instanceof Error ? err.message : "Unknown error",
        })
      }
    }

    setResults(testResults)
    setLoading(false)
  }

  const createTestData = async () => {
    setLoading(true)

    try {
      // Test creating a PO
      const { data: poData, error: poError } = await supabase
        .from("purchase_orders")
        .insert({
          po_number: `TEST-${Date.now()}`,
          supplier: "Test Supplier",
          total_amount: 1000,
          status: "pending",
          user_id: "test-user",
        })
        .select()

      if (poError) {
        setResults((prev) => [
          ...prev,
          {
            table: "purchase_orders",
            status: "error",
            message: `Insert failed: ${poError.message}`,
          },
        ])
      } else {
        setResults((prev) => [
          ...prev,
          {
            table: "purchase_orders",
            status: "success",
            message: `Test PO created successfully`,
          },
        ])
      }
    } catch (err) {
      setResults((prev) => [
        ...prev,
        {
          table: "purchase_orders",
          status: "error",
          message: err instanceof Error ? err.message : "Unknown error",
        },
      ])
    }

    setLoading(false)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Database Connection Test</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Button onClick={testDatabaseConnection} disabled={loading}>
            {loading ? "Testing..." : "Test Connection"}
          </Button>

          <Button onClick={createTestData} disabled={loading} variant="outline">
            {loading ? "Creating..." : "Create Test Data"}
          </Button>
        </div>

        <div className="space-y-2">
          {results.length === 0 && !loading && (
            <Alert>
              <AlertDescription>Click "Test Connection" to check database connectivity</AlertDescription>
            </Alert>
          )}

          {results.map((result, index) => (
            <Alert key={index} variant={result.status === "error" ? "destructive" : "default"}>
              <AlertDescription>
                <strong>{result.table}:</strong> {result.message}
                {result.count !== undefined && ` (${result.count} records)`}
              </AlertDescription>
            </Alert>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
