"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Trash2, Plus, Copy, ExternalLink } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import logger from "@/lib/logger"

interface URLEntry {
  id: string
  originalUrl: string
  customShortcode: string
  validityMinutes: string
  shortUrl?: string
  expiryDate?: Date
  isValid?: boolean
  error?: string
  shortcode?: string
}

export default function URLShortenerForm() {
  const [urlEntries, setUrlEntries] = useState<URLEntry[]>([
    { id: "1", originalUrl: "", customShortcode: "", validityMinutes: "30" },
  ])
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  useState(() => {
    logger.info("URL Shortener Form initialized", { initialEntries: 1 }, "URLShortenerForm", "init")
  })

  const addUrlEntry = () => {
    if (urlEntries.length < 5) {
      const newEntry: URLEntry = {
        id: Date.now().toString(),
        originalUrl: "",
        customShortcode: "",
        validityMinutes: "30",
      }
      setUrlEntries([...urlEntries, newEntry])

      logger.info(
        "New URL entry added",
        {
          entryId: newEntry.id,
          totalEntries: urlEntries.length + 1,
        },
        "URLShortenerForm",
        "add_entry",
      )
    } else {
      logger.warn("Maximum URL entries reached", { maxEntries: 5 }, "URLShortenerForm", "add_entry")
    }
  }

  const removeUrlEntry = (id: string) => {
    if (urlEntries.length > 1) {
      setUrlEntries(urlEntries.filter((entry) => entry.id !== id))

      logger.info(
        "URL entry removed",
        {
          entryId: id,
          remainingEntries: urlEntries.length - 1,
        },
        "URLShortenerForm",
        "remove_entry",
      )
    } else {
      logger.warn("Attempted to remove last URL entry", {}, "URLShortenerForm", "remove_entry")
    }
  }

  const updateUrlEntry = (id: string, field: keyof URLEntry, value: string) => {
    setUrlEntries(urlEntries.map((entry) => (entry.id === id ? { ...entry, [field]: value } : entry)))

    logger.debug(
      "URL entry updated",
      {
        entryId: id,
        field,
        valueLength: value.length,
      },
      "URLShortenerForm",
      "update_entry",
    )
  }

  const validateUrl = (url: string): boolean => {
    try {
      new URL(url)
      logger.debug("URL validation successful", { url }, "URLShortenerForm", "validate")
      return true
    } catch {
      logger.urlValidationFailed(url, "Invalid URL format")
      return false
    }
  }

  const validateEntry = (entry: URLEntry): { isValid: boolean; error?: string } => {
    logger.debug("Validating URL entry", { entryId: entry.id }, "URLShortenerForm", "validate")

    if (!entry.originalUrl.trim()) {
      const error = "URL is required"
      logger.urlValidationFailed(entry.originalUrl, error)
      return { isValid: false, error }
    }

    if (!validateUrl(entry.originalUrl)) {
      const error = "Invalid URL format"
      return { isValid: false, error }
    }

    const validity = Number.parseInt(entry.validityMinutes)
    if (isNaN(validity) || validity <= 0) {
      const error = "Validity must be a positive number"
      logger.urlValidationFailed(entry.originalUrl, error)
      return { isValid: false, error }
    }

    logger.debug(
      "URL entry validation successful",
      {
        entryId: entry.id,
        validityMinutes: validity,
      },
      "URLShortenerForm",
      "validate",
    )

    return { isValid: true }
  }

  const handleSubmit = async () => {
    logger.info(
      "Form submission started",
      {
        totalEntries: urlEntries.length,
      },
      "URLShortenerForm",
      "submit",
    )

    setIsLoading(true)

    // Validate all entries
    const validatedEntries = urlEntries.map((entry) => {
      const validation = validateEntry(entry)
      return { ...entry, ...validation }
    })

    setUrlEntries(validatedEntries)

    const invalidEntries = validatedEntries.filter((entry) => !entry.isValid)
    const validEntries = validatedEntries.filter((entry) => entry.isValid)

    logger.formSubmission(urlEntries.length, validEntries.length, invalidEntries.length)

    if (invalidEntries.length > 0) {
      setIsLoading(false)

      logger.warn(
        "Form submission failed due to validation errors",
        {
          invalidCount: invalidEntries.length,
          errors: invalidEntries.map((e) => ({ id: e.id, error: e.error })),
        },
        "URLShortenerForm",
        "submit",
      )

      toast({
        title: "Validation Error",
        description: "Please fix the errors in your URL entries",
        variant: "destructive",
      })
      return
    }

    // Process valid entries
    try {
      console.log("[v0] Accessing localStorage for URL storage...")
      const existingUrls = JSON.parse(localStorage.getItem("shortenedUrls") || "[]")
      console.log("[v0] Existing URLs in storage:", existingUrls)

      const processedEntries = validatedEntries.map((entry) => {
        let shortcode = entry.customShortcode || Math.random().toString(36).substring(2, 8)

        while (existingUrls.some((url: any) => url.shortcode === shortcode)) {
          shortcode = Math.random().toString(36).substring(2, 8)
        }

        const expiryDate = new Date(Date.now() + Number.parseInt(entry.validityMinutes) * 60 * 1000)
        const shortUrl = `http://localhost:3000/${shortcode}`

        const urlData = {
          id: entry.id,
          originalUrl: entry.originalUrl,
          shortcode,
          shortUrl,
          expiryDate: expiryDate.toISOString(),
          createdAt: new Date().toISOString(),
          validityMinutes: Number.parseInt(entry.validityMinutes),
          clickCount: 0,
          clickData: [],
        }

        existingUrls.push(urlData)

        console.log("[v0] Created URL data:", urlData)

        logger.urlCreated(entry.originalUrl, shortUrl, shortcode, Number.parseInt(entry.validityMinutes))

        return {
          ...entry,
          shortUrl,
          expiryDate,
          shortcode,
          isValid: true,
        }
      })

      console.log("[v0] Saving to localStorage:", existingUrls)
      localStorage.setItem("shortenedUrls", JSON.stringify(existingUrls))

      const verifyData = localStorage.getItem("shortenedUrls")
      console.log("[v0] Verification - data saved:", verifyData)

      if (!verifyData) {
        throw new Error("Failed to save to localStorage")
      }

      setUrlEntries(processedEntries)

      logger.info(
        "Form submission completed successfully",
        {
          processedCount: processedEntries.length,
          shortcodes: processedEntries.map((e) => e.shortcode),
        },
        "URLShortenerForm",
        "submit",
      )

      toast({
        title: "URLs Shortened Successfully",
        description: `${processedEntries.length} URL(s) have been shortened and saved`,
      })
    } catch (error) {
      console.error("[v0] Error during URL shortening:", error)
      logger.error(
        "Form submission failed",
        {
          error: error instanceof Error ? error.message : "Unknown error",
          entriesCount: validatedEntries.length,
        },
        "URLShortenerForm",
        "submit",
      )

      toast({
        title: "Error",
        description: "Failed to shorten URLs. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)

    logger.info(
      "Short URL copied to clipboard",
      {
        urlLength: text.length,
      },
      "URLShortenerForm",
      "copy",
    )

    toast({
      title: "Copied!",
      description: "Short URL copied to clipboard",
    })
  }

  return (
    <div className="space-y-6">
      {/* URL Entry Forms */}
      <div className="space-y-4">
        {urlEntries.map((entry, index) => (
          <Card key={entry.id} className={entry.error ? "border-destructive" : ""}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">URL #{index + 1}</CardTitle>
                {urlEntries.length > 1 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeUrlEntry(entry.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
              {entry.error && (
                <Badge variant="destructive" className="w-fit">
                  {entry.error}
                </Badge>
              )}
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor={`url-${entry.id}`}>Original URL *</Label>
                <Input
                  id={`url-${entry.id}`}
                  placeholder="https://example.com/very-long-url"
                  value={entry.originalUrl}
                  onChange={(e) => updateUrlEntry(entry.id, "originalUrl", e.target.value)}
                  className={entry.error && !entry.originalUrl ? "border-destructive" : ""}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor={`shortcode-${entry.id}`}>Custom Shortcode (Optional)</Label>
                  <Input
                    id={`shortcode-${entry.id}`}
                    placeholder="my-link"
                    value={entry.customShortcode}
                    onChange={(e) => updateUrlEntry(entry.id, "customShortcode", e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`validity-${entry.id}`}>Validity (Minutes)</Label>
                  <Input
                    id={`validity-${entry.id}`}
                    type="number"
                    placeholder="30"
                    value={entry.validityMinutes}
                    onChange={(e) => updateUrlEntry(entry.id, "validityMinutes", e.target.value)}
                    min="1"
                  />
                </div>
              </div>

              {/* Results Display */}
              {entry.shortUrl && (
                <div className="mt-4 p-4 bg-muted rounded-lg">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-medium">Short URL:</Label>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm" onClick={() => copyToClipboard(entry.shortUrl!)}>
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => window.open(entry.shortUrl, "_blank")}>
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <p className="text-sm font-mono bg-background p-2 rounded border">{entry.shortUrl}</p>
                    <p className="text-xs text-muted-foreground">Expires: {entry.expiryDate?.toLocaleString()}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Button
          onClick={addUrlEntry}
          variant="outline"
          disabled={urlEntries.length >= 5}
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Add URL ({urlEntries.length}/5)
        </Button>

        <Button onClick={handleSubmit} disabled={isLoading} className="flex items-center gap-2">
          {isLoading ? "Processing..." : "Shorten URLs"}
        </Button>
      </div>
    </div>
  )
}
