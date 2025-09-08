"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export default function DebugPanel() {
  const [storageData, setStorageData] = useState<any>(null)

  const checkStorage = () => {
    try {
      const data = localStorage.getItem("shortenedUrls")
      console.log("[v0] Debug - Raw storage data:", data)

      if (data) {
        const parsed = JSON.parse(data)
        console.log("[v0] Debug - Parsed storage data:", parsed)
        setStorageData(parsed)
      } else {
        setStorageData([])
      }
    } catch (error) {
      console.error("[v0] Debug - Error reading storage:", error)
      setStorageData("ERROR")
    }
  }

  const clearStorage = () => {
    localStorage.removeItem("shortenedUrls")
    setStorageData(null)
    console.log("[v0] Debug - Storage cleared")
  }

  const testStorage = () => {
    const testData = {
      id: "test",
      originalUrl: "https://google.com",
      shortcode: "test123",
      shortUrl: "http://localhost:3000/test123",
      expiryDate: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
      createdAt: new Date().toISOString(),
      validityMinutes: 30,
      clickCount: 0,
      clickData: [],
    }

    try {
      const existing = JSON.parse(localStorage.getItem("shortenedUrls") || "[]")
      existing.push(testData)
      localStorage.setItem("shortenedUrls", JSON.stringify(existing))
      console.log("[v0] Debug - Test URL created:", testData)
      checkStorage()
    } catch (error) {
      console.error("[v0] Debug - Error creating test URL:", error)
    }
  }

  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle>Debug Panel</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Button onClick={checkStorage} variant="outline" size="sm">
            Check Storage
          </Button>
          <Button onClick={testStorage} variant="outline" size="sm">
            Create Test URL
          </Button>
          <Button onClick={clearStorage} variant="destructive" size="sm">
            Clear Storage
          </Button>
        </div>

        {storageData && (
          <div className="space-y-2">
            <Badge variant="secondary">
              {Array.isArray(storageData) ? `${storageData.length} URLs stored` : "Storage Error"}
            </Badge>
            <pre className="text-xs bg-muted p-2 rounded overflow-auto max-h-40">
              {JSON.stringify(storageData, null, 2)}
            </pre>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
