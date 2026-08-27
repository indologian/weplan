import { NextResponse } from "next/server";
import { collectMetrics } from "@/modules/admin/server/metrics";
import { createLogger } from "@/shared/lib/logging";

export async function GET(): Promise<NextResponse> {
  const logger = createLogger();

  try {
    const metrics = await collectMetrics();

    const alerts: string[] = [];
    if (metrics.outboxPending > 100) alerts.push("OUTBOX_HIGH_BACKLOG");
    if (metrics.failedJobs > 50) alerts.push("HIGH_FAILED_JOBS");
    if (metrics.paymentPendingAge > 3600) alerts.push("PAYMENT_PENDING_AGE");
    if (metrics.emailFailed > 20) alerts.push("EMAIL_FAILURE_RATE");
    if (metrics.mediaProcessingFailed > 10) alerts.push("MEDIA_PROCESSING_FAILURES");

    logger.info("metrics_collected", {
      meta: { alerts: alerts.length > 0 ? alerts : undefined },
    });

    return NextResponse.json({
      success: true,
      data: {
        ...metrics,
        alerts,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    logger.error("metrics_collection_failed", { error: error instanceof Error ? error.message : "Unknown" });
    return NextResponse.json(
      { success: false, error: "Failed to collect metrics." },
      { status: 500 },
    );
  }
}
