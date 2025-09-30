"use client"
import { createClient as createSupabaseClient, type SupabaseClient } from "@supabase/supabase-js"

/* ---------------------- ENV & constantes seguras ---------------------- */
const SUPABASE_URL =
  (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://ehbbgxnwbiiqcwhtbqxh.supabase.co").trim()
const SUPABASE_ANON_KEY =
  (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVoYmJneG53YmlpcWN3aHRicXhoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg4MTc3MzcsImV4cCI6MjA3NDM5MzczN30.Bm8aTujVGL9fT48AuVs9Nbvpt_IvSRCMFW1cj7pt3zE").trim()

// ⬇️ schema y nombres de tablas configurables
const SUPABASE_SCHEMA = (process.env.NEXT_PUBLIC_SUPABASE_SCHEMA ?? "public").trim()
export const RADICADOS_TABLE = (process.env.NEXT_PUBLIC_RADICADOS_TABLE ?? "radicados").trim()
export const HOLIDAYS_TABLE = (process.env.NEXT_PUBLIC_HOLIDAYS_TABLE ?? "festivos_colombia").trim()

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error("Faltan variables NEXT_PUBLIC_SUPABASE_URL o NEXT_PUBLIC_SUPABASE_ANON_KEY")
}

/* --------------------------- Cliente único ---------------------------- */
// ❗️Sin anotación de tipo aquí para evitar conflicto con schema dinámico.
//    El `as any` en las opciones evita errores de sobrecarga en versiones antiguas.
const supabase = createSupabaseClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
  { db: { schema: SUPABASE_SCHEMA } } as any,
)

// Compatibilidad con componentes que llaman createClient()
export function createClient(): SupabaseClient {
  return supabase
}

/* --------------------------- Utilidades fecha ------------------------- */
function toLocalISODate(d: Date): string {
  // YYYY-MM-DD (zona horaria local, evita desfases por toISOString)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${y}-${m}-${day}`
}

/* ----------------------- Funciones de festivos ------------------------ */
export async function isHoliday(date: Date): Promise<boolean> {
  try {
    const dateString = toLocalISODate(date)
    const { data, error } = await supabase
      .from(HOLIDAYS_TABLE)
      .select("fecha")
      .eq("fecha", dateString)
      .maybeSingle()

    if (error) {
      console.error("isHoliday error:", error)
      return false
    }
    return !!data
  } catch (e) {
    console.error("isHoliday exception:", e)
    return false
  }
}

export async function calculateBusinessDaysBetween(startDate: Date, endDate: Date): Promise<number> {
  let count = 0
  const currentDate = new Date(startDate)
  const end = new Date(endDate)

  while (currentDate < end) {
    currentDate.setDate(currentDate.getDate() + 1)
    const dayOfWeek = currentDate.getDay() // 0=Dom, 6=Sáb
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      if (!(await isHoliday(currentDate))) count++
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
      if (!(await isHoliday(currentDate))) addedDays++
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

export async function getHolidaysForYear(
  year: number,
): Promise<Array<{ fecha: string; nombre: string }>> {
  try {
    const { data, error } = await supabase
      .from(HOLIDAYS_TABLE)
      .select("fecha, nombre")
      .gte("fecha", `${year}-01-01`)
      .lte("fecha", `${year}-12-31`)
      .order("fecha")

    if (error) {
      console.error("getHolidaysForYear error:", error)
      return []
    }
    return data || []
  } catch (e) {
    console.error("getHolidaysForYear exception:", e)
    return []
  }
}

/* --------------------------- Smoke test opcional ---------------------- */
// Llama a esto desde cualquier lado para verificar acceso a la tabla.
// import { smokeTestRadicados } from "@/lib/supabase"
// useEffect(() => { smokeTestRadicados() }, [])
export async function smokeTestRadicados(): Promise<void> {
  const { data, error } = await supabase.from(RADICADOS_TABLE).select("id").limit(1)
  console.log("SMOKE TEST radicados:", { data, error })
}
