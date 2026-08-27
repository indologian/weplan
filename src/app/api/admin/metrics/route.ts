import { NextResponse, type NextRequest } from "next/server";
import { collectMetrics } from "@/modules/admin/server/metrics";
import { createLogger } from "@/shared/lib/logging";
import { getServerEnv } from "@/shared/lib/env/server";
import crypto from "crypto";

export async function GET(request: NextRequest): Promise<NextResponse> {
  const logger = createLogger();

  try {
    const authHeader = request.headers.get("authorization");
    const env = getServerEnv();
    
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const token = authHeader.split(" ")[1];
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const expected = crypto.createHash('sha256').update(env.ADMIN_SECRET).digest();
    const actual = crypto.createHash('sha256').update(token).digest();
    
    if (!crypto.timingSafeEqual(actual, expected)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

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
