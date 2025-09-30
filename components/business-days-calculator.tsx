"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { CalendarIcon, Calculator, Info, Clock, AlertCircle } from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { cn } from "@/lib/utils"
import { calculateBusinessDaysBetween, addBusinessDays, getHolidaysForYear } from "@/lib/supabase"

interface Holiday {
  fecha: string
  nombre: string
}

export function BusinessDaysCalculator() {
  const [startDate, setStartDate] = useState<Date | undefined>(new Date())
  const [endDate, setEndDate] = useState<Date | undefined>(undefined)
  const [businessDaysToAdd, setBusinessDaysToAdd] = useState<number>(16)
  const [businessDays, setBusinessDays] = useState<number | null>(null)
  const [calculatedEndDate, setCalculatedEndDate] = useState<Date | undefined>(undefined)
  const [holidays, setHolidays] = useState<Holiday[]>([])
  const [isCalculating, setIsCalculating] = useState(false)

  const calculateBusinessDaysBetweenDates = async () => {
    if (!startDate || !endDate) return
    setIsCalculating(true)
    try {
      const days = await calculateBusinessDaysBetween(startDate, endDate)
      setBusinessDays(days)
    } catch (error) {
      console.error("Error calculating business days:", error)
    } finally {
      setIsCalculating(false)
    }
  }

  const calculateDeadlineDate = async () => {
    if (!startDate || businessDaysToAdd <= 0) return
    setIsCalculating(true)
    try {
      const deadline = await addBusinessDays(startDate, businessDaysToAdd)
      setCalculatedEndDate(deadline)
      setEndDate(deadline)
    } catch (error) {
      console.error("Error calculating deadline:", error)
    } finally {
      setIsCalculating(false)
    }
  }

  const loadHolidays = async () => {
    if (!startDate) return
    setIsCalculating(true)
    try {
      const year = startDate.getFullYear()
      const holidayList = await getHolidaysForYear(year)
      setHolidays(holidayList)
    } catch (error) {
      console.error("Error loading holidays:", error)
    } finally {
      setIsCalculating(false)
    }
  }

  const resetCalculator = () => {
    setStartDate(new Date())
    setEndDate(undefined)
    setBusinessDays(null)
    setCalculatedEndDate(undefined)
    setBusinessDaysToAdd(16)
    setHolidays([])
  }

  return (
    <div className="space-y-6">
      {/* Main Calculator */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center text-slate-800 dark:text-slate-100">
            <Calculator className="mr-2 h-5 w-5 text-purple-600" />
            Calculadora de Días Hábiles
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Calcula días hábiles excluyendo sábados, domingos y festivos de Colombia
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Date Selectors */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">Fecha de Inicio</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn("w-full justify-start text-left font-normal", !startDate && "text-muted-foreground")}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startDate ? format(startDate, "PPP", { locale: es }) : <span>Seleccionar fecha</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar mode="single" selected={startDate} onSelect={setStartDate} initialFocus locale={es} />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">Fecha de Fin</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn("w-full justify-start text-left font-normal", !endDate && "text-muted-foreground")}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {endDate ? format(endDate, "PPP", { locale: es }) : <span>Seleccionar fecha</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar mode="single" selected={endDate} onSelect={setEndDate} initialFocus locale={es} />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Business Days Input */}
          <div className="space-y-2">
            <Label htmlFor="businessDays" className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Días Hábiles a Agregar
            </Label>
            <Input
              id="businessDays"
              type="number"
              min="1"
              max="365"
              value={businessDaysToAdd}
              onChange={(e) => setBusinessDaysToAdd(Number(e.target.value))}
              className="w-full"
            />
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Button
              onClick={calculateBusinessDaysBetweenDates}
              disabled={!startDate || !endDate || isCalculating}
              className="bg-purple-600 hover:bg-purple-700"
            >
              <Calculator className="mr-2 h-4 w-4" />
              {isCalculating ? "Calculando..." : "Calcular Días"}
            </Button>
            <Button
              onClick={calculateDeadlineDate}
              disabled={!startDate || businessDaysToAdd <= 0 || isCalculating}
              variant="outline"
              className="bg-transparent"
            >
              <Clock className="mr-2 h-4 w-4" />
              {isCalculating ? "Calculando..." : "Calcular Fecha Límite"}
            </Button>
            <Button
              onClick={loadHolidays}
              disabled={!startDate || isCalculating}
              variant="outline"
              className="bg-transparent"
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {isCalculating ? "Cargando..." : "Ver Festivos"}
            </Button>
          </div>

          {/* Results */}
          {businessDays !== null && (
            <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg border border-purple-200 dark:border-purple-800">
              <div className="flex items-center space-x-2">
                <Info className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                <div>
                  <p className="font-semibold text-purple-800 dark:text-purple-200">Resultado del Cálculo</p>
                  <p className="text-purple-700 dark:text-purple-300">
                    <span className="font-bold text-2xl">{businessDays}</span> días hábiles
                  </p>
                  <p className="text-sm text-purple-600 dark:text-purple-400 mt-1">
                    Entre {startDate && format(startDate, "dd/MM/yyyy", { locale: es })} y{" "}
                    {endDate && format(endDate, "dd/MM/yyyy", { locale: es })}
                  </p>
                </div>
              </div>
            </div>
          )}

          {calculatedEndDate && (
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="flex items-center space-x-2">
                <Clock className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                <div>
                  <p className="font-semibold text-blue-800 dark:text-blue-200">Fecha Límite Calculada</p>
                  <p className="text-blue-700 dark:text-blue-300">
                    <span className="font-bold text-xl">{format(calculatedEndDate, "PPP", { locale: es })}</span>
                  </p>
                  <p className="text-sm text-blue-600 dark:text-blue-400 mt-1">
                    Agregando {businessDaysToAdd} días hábiles desde{" "}
                    {startDate && format(startDate, "dd/MM/yyyy", { locale: es })}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Reset Button */}
          <Button onClick={resetCalculator} variant="outline" className="w-full bg-transparent">
            Limpiar Calculadora
          </Button>
        </CardContent>
      </Card>

      {/* Holidays Display */}
      {holidays.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-slate-800 dark:text-slate-100">
              <CalendarIcon className="mr-2 h-5 w-5 text-orange-600" />
              Festivos de Colombia {startDate && startDate.getFullYear()}
            </CardTitle>
            <p className="text-sm text-muted-foreground">Días festivos que se excluyen del cálculo de días hábiles</p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {holidays.map((holiday, index) => (
                <div
                  key={index}
                  className="flex items-center space-x-2 p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800"
                >
                  <AlertCircle className="h-4 w-4 text-orange-600 dark:text-orange-400 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="font-medium text-orange-800 dark:text-orange-200 truncate">{holiday.nombre}</p>
                    <p className="text-sm text-orange-600 dark:text-orange-400">
                      {format(new Date(holiday.fecha), "dd/MM/yyyy", { locale: es })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Info Box */}
      <Card>
        <CardContent className="p-4">
          <h4 className="font-semibold text-slate-700 dark:text-slate-300 mb-3 flex items-center">
            <Info className="mr-2 h-4 w-4" />
            Información Importante
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-slate-600 dark:text-slate-400">
            <ul className="space-y-1">
              <li>• Se excluyen sábados y domingos</li>
              <li>• Se excluyen festivos nacionales de Colombia</li>
              <li>• Tiempo límite estándar: 16 días hábiles</li>
            </ul>
            <ul className="space-y-1">
              <li>• Alertas se activan 10 días hábiles antes</li>
              <li>• Cálculo basado en calendario oficial colombiano</li>
              <li>• Incluye festivos trasladados a lunes</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
