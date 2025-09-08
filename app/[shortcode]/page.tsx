"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle, ExternalLink } from "lucide-react"
import logger from "@/lib/logger"

export default function RedirectPage() {
  const params = useParams()
  const shortcode = params.shortcode as string
  const [urlData, setUrlData] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (typeof window === "undefined") {
      console.log("[v0] Window not available, waiting...")
      return
    }

    if (!shortcode) {
      setError("No shortcode provided")
      setIsLoading(false)
      return
    }

    console.log("[v0] Accessing shortcode:", shortcode)
    console.log("[v0] Current URL:", window.location.href)

    try {
      if (typeof Storage === "undefined") {
        console.error("[v0] localStorage not available")
        setError("Browser storage not available")
        setIsLoading(false)
        return
      }

      const storedData = localStorage.getItem("shortenedUrls")
      console.log("[v0] Raw localStorage data:", storedData)

      if (!storedData) {
        console.log("[v0] No data in localStorage")
        setError(`The shortened URL "${shortcode}" does not exist or has been removed.`)
        setIsLoading(false)
        return
      }

      const storedUrls = JSON.parse(storedData)
      console.log("[v0] Parsed stored URLs:", storedUrls)
      console.log("[v0] Looking for shortcode:", shortcode)
      console.log(
        "[v0] Available shortcodes:",
        storedUrls.map((u: any) => u.shortcode),
      )

      const foundUrlData = storedUrls.find((url: any) => url.shortcode === shortcode)
      console.log("[v0] Found URL data:", foundUrlData)

      if (!foundUrlData) {
        logger.error(
          "Shortcode not found",
          { shortcode, availableShortcodes: storedUrls.map((u: any) => u.shortcode) },
          "RedirectPage",
          "notFound",
        )
        setError(`The shortened URL "${shortcode}" does not exist or has been removed.`)
        setIsLoading(false)
        return
      }

      // Check if URL is expired
      const now = new Date()
      const expiryDate = new Date(foundUrlData.expiryDate)
      console.log("[v0] Checking expiry:", { now: now.toISOString(), expiry: expiryDate.toISOString() })

      if (now > expiryDate) {
        logger.urlExpired(shortcode)
        setError(`URL expired on ${expiryDate.toLocaleString()}`)
        setIsLoading(false)
        return
      }

      setUrlData(foundUrlData)
      setIsLoading(false)

      logger.info(
        "Redirect page accessed",
        {
          shortcode,
          referrer: document.referrer || "direct",
          userAgent: navigator.userAgent,
        },
        "RedirectPage",
        "access",
      )

      // Log the click with analytics data
      const clickData = {
        timestamp: new Date().toISOString(),
        source: document.referrer || "direct",
        location: "Unknown", // In production, you'd get this from IP geolocation
        userAgent: navigator.userAgent,
      }

      // Update click count and analytics
      foundUrlData.clickCount = (foundUrlData.clickCount || 0) + 1
      foundUrlData.clickData = foundUrlData.clickData || []
      foundUrlData.clickData.push(clickData)

      // Save updated data
      const updatedUrls = storedUrls.map((url: any) => (url.shortcode === shortcode ? foundUrlData : url))
      localStorage.setItem("shortenedUrls", JSON.stringify(updatedUrls))

      logger.urlClicked(shortcode, foundUrlData.originalUrl, clickData.source)

      // Perform the actual redirect
      console.log("[v0] Redirecting to:", foundUrlData.originalUrl)
      setTimeout(() => {
        window.location.href = foundUrlData.originalUrl
      }, 1500) // Slightly longer delay to ensure user sees the message
    } catch (error) {
      console.error("[v0] Error accessing localStorage:", error)
      logger.error(
        "Error accessing stored URLs",
        { error: error instanceof Error ? error.message : "Unknown error" },
        "RedirectPage",
        "error",
      )
      setError("Error accessing stored URLs")
      setIsLoading(false)
    }
  }, [shortcode])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Loading...</CardTitle>
            <CardDescription>Checking URL data...</CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  if (error || !urlData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-5 w-5" />
              URL Not Found
            </CardTitle>
            <CardDescription>
              {error || `The shortened URL "${shortcode}" does not exist or has been removed.`}
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-primary">
            <ExternalLink className="h-5 w-5" />
            Redirecting...
          </CardTitle>
          <CardDescription>You will be redirected to the original URL in a moment.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              <strong>Original URL:</strong>
            </p>
            <p className="text-sm break-all bg-muted p-2 rounded">{urlData.originalUrl}</p>
            <p className="text-xs text-muted-foreground mt-4">
              If you are not redirected automatically,
              <a
                href={urlData.originalUrl}
                className="text-primary hover:underline ml-1"
                target="_blank"
                rel="noopener noreferrer"
              >
                click here
              </a>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
