"use client"

import { useEffect } from "react"
import logger from "@/lib/logger"

export default function RedirectHandler() {
  useEffect(() => {
    logger.info("Redirect handler initialized", {}, "RedirectHandler", "init")

    // The actual redirection is now handled by the [shortcode]/page.tsx route

    logger.debug(
      "Redirect handler active - using Next.js dynamic routing",
      {
        pathname: window.location.pathname,
      },
      "RedirectHandler",
      "active",
    )
  }, [])

  return null // This component doesn't render anything
}
