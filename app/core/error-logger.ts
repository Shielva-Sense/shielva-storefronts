/** SOLE telemetry sink. Swap the body for Sentry / OTel when wired. */
export function logError(error: unknown, context: Record<string, unknown> = {}): void {
    console.error("[storefront]", error, context);
}
