import { useEffect } from "react";
import { useReportWebVitals } from "next/web-vitals";
import { logger } from "@/lib/logger";

export function useWebVitals() {
  useReportWebVitals((metric) => {
    // 1. Audit and classify performance coefficients
    const rating =
      metric.value < (metric.name === "CLS" ? 0.1 : metric.name === "LCP" ? 2500 : 100)
        ? "GOOD"
        : "DEGRADED";

    logger.info(`Web Vital telemetry: ${metric.name} = ${metric.value.toFixed(2)}ms (${rating})`, {
      id: metric.id,
      name: metric.name,
      startTime: metric.startTime,
      value: metric.value,
      rating
    });

    // 2. Dispatch analytics to Spring Boot performance monitoring in production
    if (process.env.NODE_ENV === "production") {
      fetch("/api/v1/monitoring/vitals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: metric.name,
          value: metric.value,
          rating,
          timestamp: new Date().toISOString()
        })
      }).catch(() => {
        // Fail silently
      });
    }
  });
}

export default useWebVitals;
