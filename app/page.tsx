"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Link2, BarChart3, Zap, FileText, Bug } from "lucide-react"
import URLShortenerForm from "@/components/url-shortener-form"
import StatisticsPage from "@/components/statistics-page"
import RedirectHandler from "@/components/redirect-handler"
import LogViewer from "@/components/log-viewer"
import DebugPanel from "@/components/debug-panel"
import logger from "@/lib/logger"

export default function HomePage() {
  const [activeTab, setActiveTab] = useState("shortener")

  useState(() => {
    logger.info(
      "Application initialized",
      {
        userAgent: navigator.userAgent,
        timestamp: new Date().toISOString(),
        initialTab: activeTab,
      },
      "HomePage",
      "init",
    )
  })

  const handleTabChange = (value: string) => {
    logger.info(
      "Tab changed",
      {
        from: activeTab,
        to: value,
      },
      "HomePage",
      "navigation",
    )
    setActiveTab(value)
  }

  return (
    <div className="min-h-screen bg-background">
      <RedirectHandler />

      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <Link2 className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">LinkShort</h1>
                <p className="text-sm text-muted-foreground">Professional URL Management</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-foreground">Fast & Reliable</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="mx-auto max-w-6xl">
          {/* Welcome Section */}
          <div className="mb-8 text-center">
            <h2 className="mb-4 text-4xl font-bold text-foreground">Shorten URLs with Advanced Analytics</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Create short, memorable links and track their performance with detailed analytics. Perfect for marketers,
              businesses, and content creators.
            </p>
          </div>

          {/* Navigation Tabs */}
          <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
            <TabsList className="grid w-full grid-cols-4 mb-8">
              <TabsTrigger value="shortener" className="flex items-center gap-2">
                <Link2 className="h-4 w-4" />
                URL Shortener
              </TabsTrigger>
              <TabsTrigger value="statistics" className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                Statistics
              </TabsTrigger>
              <TabsTrigger value="logs" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Logs
              </TabsTrigger>
              <TabsTrigger value="debug" className="flex items-center gap-2">
                <Bug className="h-4 w-4" />
                Debug
              </TabsTrigger>
            </TabsList>

            {/* URL Shortener Tab */}
            <TabsContent value="shortener">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Link2 className="h-5 w-5 text-primary" />
                    Create Short URLs
                  </CardTitle>
                  <CardDescription>
                    Shorten up to 5 URLs at once with custom shortcodes and validity periods
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <URLShortenerForm />
                  <DebugPanel />
                </CardContent>
              </Card>
            </TabsContent>

            {/* Statistics Tab */}
            <TabsContent value="statistics">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-primary" />
                    URL Analytics
                  </CardTitle>
                  <CardDescription>
                    Track performance and analyze click data for all your shortened URLs
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <StatisticsPage />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="logs">
              <LogViewer />
            </TabsContent>

            <TabsContent value="debug">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bug className="h-5 w-5 text-primary" />
                    Debug Tools
                  </CardTitle>
                  <CardDescription>Test localStorage functionality and debug URL shortening issues</CardDescription>
                </CardHeader>
                <CardContent>
                  <DebugPanel />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-card mt-16">
        <div className="container mx-auto px-4 py-6">
          <div className="text-center text-sm text-muted-foreground">
            <p>© 2024 LinkShort - Professional URL Shortener with Analytics</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
