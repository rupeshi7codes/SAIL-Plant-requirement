import { debugLog } from "./debug-logger"

// Validate user data structure and fix any issues
export const validateUserData = (data: any) => {
  if (!data) {
    debugLog("No data provided, returning default structure")
    return {
      requirements: [],
      pos: [],
      supplyHistory: [],
    }
  }

  const validatedData = {
    requirements: Array.isArray(data.requirements) ? data.requirements : [],
    pos: Array.isArray(data.pos) ? data.pos : [],
    supplyHistory: Array.isArray(data.supplyHistory) ? data.supplyHistory : [],
  }

  // Check if any data was fixed
  if (!Array.isArray(data.requirements) || !Array.isArray(data.pos) || !Array.isArray(data.supplyHistory)) {
    debugLog("Data structure was fixed:", validatedData)
  }

  return validatedData
}
