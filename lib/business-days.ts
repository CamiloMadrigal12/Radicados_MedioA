const COLOMBIA_HOLIDAYS_2025 = [
  { fecha: "2025-01-01", nombre: "Año Nuevo" },
  { fecha: "2025-01-06", nombre: "Día de los Reyes Magos" },
  { fecha: "2025-03-24", nombre: "Día de San José" },
  { fecha: "2025-04-17", nombre: "Jueves Santo" },
  { fecha: "2025-04-18", nombre: "Viernes Santo" },
  { fecha: "2025-05-01", nombre: "Día del Trabajo" },
  { fecha: "2025-05-26", nombre: "Ascensión del Señor" },
  { fecha: "2025-06-16", nombre: "Corpus Christi" },
  { fecha: "2025-06-23", nombre: "Sagrado Corazón de Jesús" },
  { fecha: "2025-06-30", nombre: "San Pedro y San Pablo" },
  { fecha: "2025-07-20", nombre: "Día de la Independencia" },
  { fecha: "2025-08-07", nombre: "Batalla de Boyacá" },
  { fecha: "2025-08-18", nombre: "Asunción de la Virgen" },
  { fecha: "2025-10-13", nombre: "Día de la Raza" },
  { fecha: "2025-11-03", nombre: "Todos los Santos" },
  { fecha: "2025-11-17", nombre: "Independencia de Cartagena" },
  { fecha: "2025-12-08", nombre: "Inmaculada Concepción" },
  { fecha: "2025-12-25", nombre: "Navidad" },
]

export function isHoliday(date: Date): boolean {
  const dateString = date.toISOString().split("T")[0]
  return COLOMBIA_HOLIDAYS_2025.some((holiday) => holiday.fecha === dateString)
}

export async function calculateBusinessDaysBetween(startDate: Date, endDate: Date): Promise<number> {
  let count = 0
  const currentDate = new Date(startDate)
  const end = new Date(endDate)

  while (currentDate < end) {
    currentDate.setDate(currentDate.getDate() + 1)
    const dayOfWeek = currentDate.getDay()
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      if (!isHoliday(currentDate)) count++
    }
  }
  return count
}

export async function addBusinessDays(startDate: Date, businessDays: number): Promise<Date> {
  const currentDate = new Date(startDate)
  let addedDays = 0

  while (addedDays < businessDays) {
    currentDate.setDate(currentDate.getDate() + 1)
    const dayOfWeek = currentDate.getDay()
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      if (!isHoliday(currentDate)) addedDays++
    }
  }
  return currentDate
}

export async function calculateBusinessDaysUntilDeadline(deadlineDate: Date): Promise<number> {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const deadline = new Date(deadlineDate)
  deadline.setHours(0, 0, 0, 0)
  if (deadline <= today) return 0
  return calculateBusinessDaysBetween(today, deadline)
}

export async function shouldTriggerAlert(deadlineDate: Date): Promise<boolean> {
  const businessDaysRemaining = await calculateBusinessDaysUntilDeadline(deadlineDate)
  return businessDaysRemaining <= 10
}

export async function getHolidaysForYear(year: number): Promise<Array<{ fecha: string; nombre: string }>> {
  return COLOMBIA_HOLIDAYS_2025.filter((holiday) => {
    const holidayYear = new Date(holiday.fecha).getFullYear()
    return holidayYear === year
  })
}
