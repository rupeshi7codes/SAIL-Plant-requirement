export function formatDate(dateString: string): string {
  const date = new Date(dateString)
  const day = date.getDate().toString().padStart(2, "0")
  const month = (date.getMonth() + 1).toString().padStart(2, "0")
  const year = date.getFullYear()
  return `${day}/${month}/${year}`
}

export function formatDateForInput(dateString: string): string {
  // Convert DD/MM/YYYY to YYYY-MM-DD for input fields
  if (dateString.includes("/")) {
    const [day, month, year] = dateString.split("/")
    return `${year}-${month}-${day}`
  }
  return dateString
}

export function formatDateFromInput(dateString: string): string {
  // Convert YYYY-MM-DD to DD/MM/YYYY for display
  const date = new Date(dateString)
  const day = date.getDate().toString().padStart(2, "0")
  const month = (date.getMonth() + 1).toString().padStart(2, "0")
  const year = date.getFullYear()
  return `${day}/${month}/${year}`
}

export function isDeliveryDueSoon(deliveryDate: string, daysThreshold = 5): boolean {
  const today = new Date()
  const delivery = new Date(deliveryDate)
  const diffTime = delivery.getTime() - today.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  return diffDays <= daysThreshold && diffDays >= 0
}

export function getDaysUntilDelivery(deliveryDate: string): number {
  const today = new Date()
  const delivery = new Date(deliveryDate)
  const diffTime = delivery.getTime() - today.getTime()
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
}
