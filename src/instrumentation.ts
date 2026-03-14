export async function register() {
  // Only run on the Node.js runtime (not edge)
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { startScheduler, stopScheduler } = await import(
      "@/lib/polling/scheduler"
    );
    const { alertEventBus } = await import("@/lib/polling/event-bus");
    const { prisma } = await import("@/lib/db");
    const { startCleanupJob, stopCleanupJob } = await import(
      "@/lib/cleanup"
    );

    startScheduler();
    startCleanupJob();

    // Graceful shutdown
    const shutdown = async (signal: string) => {
      console.log(`[shutdown] Received ${signal}, shutting down gracefully…`);
      stopScheduler();
      stopCleanupJob();
      alertEventBus.removeAllListeners();
      await prisma.$disconnect();
      console.log("[shutdown] Cleanup complete");
      process.exit(0);
    };

    process.on("SIGTERM", () => shutdown("SIGTERM"));
    process.on("SIGINT", () => shutdown("SIGINT"));
  }
}
