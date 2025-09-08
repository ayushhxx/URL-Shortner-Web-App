"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { BarChart3, Clock, MousePointer, Globe, Copy, ExternalLink } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import logger from "@/lib/logger"

interface ClickData {
  timestamp: Date
  source: string
  location: string
}

interface URLStats {
  id: string
  originalUrl: string
  shortUrl: string
  shortcode: string
  createdAt: Date
  expiryDate: Date
  clickCount: number
  clicks: ClickData[]
  isExpired: boolean
}

export default function StatisticsPage() {
  const [urlStats, setUrlStats] = useState<URLStats[]>([])
  const { toast } = useToast()

  useEffect(() => {
    // Load statistics from localStorage or API
    logger.info("Statistics page initialized", {}, "StatisticsPage", "init")
    loadStatistics()
  }, [])

  const loadStatistics = () => {
    // Placeholder data - in real app, this would come from API/localStorage
    logger.info("Loading statistics data", {}, "StatisticsPage", "load")
    const mockStats: URLStats[] = [
      {
        id: "1",
        originalUrl: "https://example.com/very-long-url-that-needs-shortening",
        shortUrl: "http://localhost:3000/abc123",
        shortcode: "abc123",
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
        expiryDate: new Date(Date.now() + 28 * 60 * 1000), // 28 minutes from now
        clickCount: 15,
        clicks: [
          { timestamp: new Date(Date.now() - 30 * 60 * 1000), source: "Direct", location: "New York, US" },
          { timestamp: new Date(Date.now() - 45 * 60 * 1000), source: "Twitter", location: "London, UK" },
          { timestamp: new Date(Date.now() - 60 * 60 * 1000), source: "Email", location: "Tokyo, JP" },
        ],
        isExpired: false,
      },
      {
        id: "2",
        originalUrl: "https://github.com/user/repository",
        shortUrl: "http://localhost:3000/gh-repo",
        shortcode: "gh-repo",
        createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
        expiryDate: new Date(Date.now() - 60 * 1000), // 1 minute ago (expired)
        clickCount: 8,
        clicks: [
          { timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), source: "LinkedIn", location: "San Francisco, US" },
          { timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000), source: "Direct", location: "Berlin, DE" },
        ],
        isExpired: true,
      },
    ]
    setUrlStats(mockStats)

    const totalClicks = mockStats.reduce((sum, stat) => sum + stat.clickCount, 0)
    logger.statisticsViewed(mockStats.length, totalClicks)
    logger.info(
      "Statistics data loaded successfully",
      {
        totalUrls: mockStats.length,
        activeUrls: mockStats.filter((s) => !s.isExpired).length,
        expiredUrls: mockStats.filter((s) => s.isExpired).length,
        totalClicks,
      },
      "StatisticsPage",
      "load",
    )
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    logger.info(
      "URL copied from statistics page",
      {
        urlLength: text.length,
      },
      "StatisticsPage",
      "copy",
    )
    toast({
      title: "Copied!",
      description: "URL copied to clipboard",
    })
  }

  const formatTimeAgo = (date: Date) => {
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / (1000 * 60))
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    return `${diffDays}d ago`
  }

  const getStatusBadge = (stat: URLStats) => {
    if (stat.isExpired) {
      logger.debug(
        "Displaying expired URL status",
        {
          shortcode: stat.shortcode,
        },
        "StatisticsPage",
        "status",
      )
      return <Badge variant="destructive">Expired</Badge>
    }
    const timeLeft = stat.expiryDate.getTime() - Date.now()
    const minutesLeft = Math.floor(timeLeft / (1000 * 60))

    if (minutesLeft < 5) {
      logger.warn(
        "URL expiring soon",
        {
          shortcode: stat.shortcode,
          minutesLeft,
        },
        "StatisticsPage",
        "status",
      )
      return <Badge variant="destructive">Expires Soon</Badge>
    }
    return <Badge variant="secondary">Active</Badge>
  }

  const handleExternalOpen = (shortUrl: string, shortcode: string, isExpired: boolean) => {
    if (isExpired) {
      logger.urlExpired(shortcode)
      toast({
        title: "URL Expired",
        description: "This short URL has expired and cannot be accessed",
        variant: "destructive",
      })
      return
    }

    logger.info(
      "External URL opened from statistics",
      {
        shortcode,
        shortUrl,
      },
      "StatisticsPage",
      "external_open",
    )

    window.open(shortUrl, "_blank")
  }

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total URLs</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{urlStats.length}</div>
            <p className="text-xs text-muted-foreground">{urlStats.filter((s) => !s.isExpired).length} active</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Clicks</CardTitle>
            <MousePointer className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{urlStats.reduce((sum, stat) => sum + stat.clickCount, 0)}</div>
            <p className="text-xs text-muted-foreground">Across all URLs</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Clicks</CardTitle>
            <Globe className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {urlStats.length > 0
                ? Math.round(urlStats.reduce((sum, stat) => sum + stat.clickCount, 0) / urlStats.length)
                : 0}
            </div>
            <p className="text-xs text-muted-foreground">Per URL</p>
          </CardContent>
        </Card>
      </div>

      {/* URL Statistics List */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">URL Statistics</h3>

        {urlStats.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <BarChart3 className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No URLs Yet</h3>
              <p className="text-muted-foreground text-center">
                Create your first shortened URL to see statistics here
              </p>
            </CardContent>
          </Card>
        ) : (
          urlStats.map((stat) => (
            <Card key={stat.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-base">{stat.shortcode}</CardTitle>
                      {getStatusBadge(stat)}
                    </div>
                    <CardDescription className="break-all">{stat.originalUrl}</CardDescription>
                  </div>
                  <div className="flex gap-2 ml-4">
                    <Button variant="ghost" size="sm" onClick={() => copyToClipboard(stat.shortUrl)}>
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleExternalOpen(stat.shortUrl, stat.shortcode, stat.isExpired)}
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">{stat.clickCount}</div>
                    <div className="text-xs text-muted-foreground">Total Clicks</div>
                  </div>
                  <div className="text-center">
                    <div className="text-sm font-medium">{formatTimeAgo(stat.createdAt)}</div>
                    <div className="text-xs text-muted-foreground">Created</div>
                  </div>
                  <div className="text-center">
                    <div className="text-sm font-medium">
                      {stat.isExpired
                        ? "Expired"
                        : formatTimeAgo(new Date(Date.now() - (stat.expiryDate.getTime() - Date.now())))}
                    </div>
                    <div className="text-xs text-muted-foreground">{stat.isExpired ? "Status" : "Expires"}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-sm font-medium">{stat.clicks.length}</div>
                    <div className="text-xs text-muted-foreground">Recent Clicks</div>
                  </div>
                </div>

                {/* Recent Clicks */}
                {stat.clicks.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      Recent Click Activity
                    </h4>
                    <div className="space-y-2">
                      {stat.clicks.slice(0, 3).map((click, index) => (
                        <div key={index} className="flex items-center justify-between text-sm bg-muted p-2 rounded">
                          <div className="flex items-center gap-2">
                            <Globe className="h-3 w-3 text-muted-foreground" />
                            <span>{click.location}</span>
                          </div>
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <span>{click.source}</span>
                            <span>•</span>
                            <span>{formatTimeAgo(click.timestamp)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
