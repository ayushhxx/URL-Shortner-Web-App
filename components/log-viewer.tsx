"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Download, Trash2, RefreshCw, Filter } from "lucide-react"
import logger, { type LogLevel, type LogEntry } from "@/lib/logger"
import { useToast } from "@/hooks/use-toast"

export default function LogViewer() {
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [filteredLogs, setFilteredLogs] = useState<LogEntry[]>([])
  const [levelFilter, setLevelFilter] = useState<string>("all")
  const [componentFilter, setComponentFilter] = useState<string>("all")
  const { toast } = useToast()

  useEffect(() => {
    loadLogs()
  }, [])

  useEffect(() => {
    applyFilters()
  }, [logs, levelFilter, componentFilter])

  const loadLogs = () => {
    const allLogs = logger.getLogs()
    setLogs(allLogs)
    logger.info("Log viewer loaded", { logCount: allLogs.length }, "LogViewer", "load")
  }

  const applyFilters = () => {
    let filtered = logs

    if (levelFilter !== "all") {
      const level = Number.parseInt(levelFilter) as LogLevel
      filtered = filtered.filter((log) => log.level >= level)
    }

    if (componentFilter !== "all") {
      filtered = filtered.filter((log) => log.component === componentFilter)
    }

    setFilteredLogs(filtered)
  }

  const clearLogs = () => {
    logger.clearLogs()
    setLogs([])
    setFilteredLogs([])
    toast({
      title: "Logs Cleared",
      description: "All application logs have been cleared",
    })
  }

  const exportLogs = () => {
    const logData = logger.exportLogs()
    const blob = new Blob([logData], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `app-logs-${new Date().toISOString().split("T")[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    logger.info("Logs exported", { logCount: logs.length }, "LogViewer", "export")
    toast({
      title: "Logs Exported",
      description: "Application logs have been downloaded",
    })
  }

  const getLevelBadge = (level: LogLevel) => {
    const levelNames = ["DEBUG", "INFO", "WARN", "ERROR"]
    const levelColors = ["secondary", "default", "destructive", "destructive"] as const

    return (
      <Badge variant={levelColors[level]} className="text-xs">
        {levelNames[level]}
      </Badge>
    )
  }

  const getUniqueComponents = () => {
    const components = new Set(logs.map((log) => log.component).filter(Boolean))
    return Array.from(components).sort()
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              Application Logs
              <Badge variant="outline">{filteredLogs.length}</Badge>
            </CardTitle>
            <CardDescription>View and manage application logging data</CardDescription>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={loadLogs}>
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={exportLogs}>
              <Download className="h-4 w-4" />
            </Button>
            <Button variant="destructive" size="sm" onClick={clearLogs}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Filters */}
        <div className="flex gap-4 mb-4">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            <Select value={levelFilter} onValueChange={setLevelFilter}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Levels</SelectItem>
                <SelectItem value="0">Debug+</SelectItem>
                <SelectItem value="1">Info+</SelectItem>
                <SelectItem value="2">Warn+</SelectItem>
                <SelectItem value="3">Error</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Select value={componentFilter} onValueChange={setComponentFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Component" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Components</SelectItem>
              {getUniqueComponents().map((component) => (
                <SelectItem key={component} value={component}>
                  {component}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Log Entries */}
        <ScrollArea className="h-96 w-full border rounded-md p-4">
          {filteredLogs.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">No logs match the current filters</div>
          ) : (
            <div className="space-y-2">
              {filteredLogs.map((log, index) => (
                <div key={index} className="border-b border-border pb-2 last:border-b-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        {getLevelBadge(log.level)}
                        {log.component && (
                          <Badge variant="outline" className="text-xs">
                            {log.component}
                          </Badge>
                        )}
                        {log.action && (
                          <Badge variant="secondary" className="text-xs">
                            {log.action}
                          </Badge>
                        )}
                        <span className="text-xs text-muted-foreground">
                          {new Date(log.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                      <p className="text-sm font-medium">{log.message}</p>
                      {log.context && Object.keys(log.context).length > 0 && (
                        <pre className="text-xs text-muted-foreground mt-1 bg-muted p-2 rounded overflow-x-auto">
                          {JSON.stringify(log.context, null, 2)}
                        </pre>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
