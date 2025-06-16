"use client"

import { Suspense } from "react"
import PDFTest from "@/components/pdf-test"
import DatabaseTest from "@/components/database-test"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function TestPage() {
  return (
    <div className="container mx-auto py-8 space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>PDF Storage & Database Integration Tests</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600 mb-4">
            Use these components to test the PDF storage functionality and database integration.
          </p>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Suspense fallback={<div className="p-4 border rounded-lg">Loading PDF Test...</div>}>
          <PDFTest />
        </Suspense>

        <Suspense fallback={<div className="p-4 border rounded-lg">Loading Database Test...</div>}>
          <DatabaseTest />
        </Suspense>
      </div>
    </div>
  )
}
