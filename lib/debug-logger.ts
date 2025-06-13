// Simple debug logger to help track data flow
export const debugLog = (message: string, data?: any) => {
  if (process.env.NODE_ENV !== "production") {
    console.log(`[DEBUG] ${message}`, data || "")
  }
}
