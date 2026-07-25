'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface TimeSlot {
  time: string
  capacity: number
  booked: number
}

interface DateData {
  isOpen: boolean
  timeSlots: TimeSlot[]
}

interface CalendarMonth {
  [dateKey: string]: DateData
}

interface ExamCalendar {
  currentMonth: Date
  dates: CalendarMonth
}

const EXAMS = ['BT', 'MA', 'FA', 'CBL']
const TIME_SLOTS = ['9:45', '12:15', '2:15']

// Mock calendar data generator
const generateMockCalendar = (startMonth: number, exam: string): CalendarMonth => {
  const calendar: CalendarMonth = {}
  const daysInMonth = 31
  
  // Generate a mix of open and closed dates with bookings
  for (let day = 1; day <= daysInMonth; day++) {
    const dateKey = `2025-${String(startMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    const random = Math.random()
    
    if (random > 0.3) {
      const slots: TimeSlot[] = TIME_SLOTS.map((time) => ({
        time,
        capacity: Math.floor(Math.random() * 10) + 10, // 10-20
        booked: Math.floor(Math.random() * 12), // 0-12
      }))
      calendar[dateKey] = {
        isOpen: true,
        timeSlots: slots,
      }
    } else {
      calendar[dateKey] = {
        isOpen: false,
        timeSlots: TIME_SLOTS.map((time) => ({
          time,
          capacity: 0,
          booked: 0,
        })),
      }
    }
  }
  
  return calendar
}

export default function CalendarPage() {
  const [selectedExam, setSelectedExam] = useState('BT')
  const [examsData, setExamsData] = useState<Record<string, ExamCalendar>>(() => {
    const data: Record<string, ExamCalendar> = {}
    EXAMS.forEach((exam) => {
      data[exam] = {
        currentMonth: new Date(2025, 0, 1),
        dates: generateMockCalendar(1, exam),
      }
    })
    return data
  })

  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [isSheetOpen, setIsSheetOpen] = useState(false)
  const [editingCapacity, setEditingCapacity] = useState<Record<string, string>>({})

  const currentExamData = examsData[selectedExam]
  const currentMonth = currentExamData.currentMonth
  const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate()
  const firstDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay()

  const monthName = currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })

  const handlePrevMonth = () => {
    const newMonth = new Date(currentMonth)
    newMonth.setMonth(newMonth.getMonth() - 1)
    setExamsData((prev) => ({
      ...prev,
      [selectedExam]: {
        ...prev[selectedExam],
        currentMonth: newMonth,
      },
    }))
  }

  const handleNextMonth = () => {
    const newMonth = new Date(currentMonth)
    newMonth.setMonth(newMonth.getMonth() + 1)
    setExamsData((prev) => ({
      ...prev,
      [selectedExam]: {
        ...prev[selectedExam],
        currentMonth: newMonth,
      },
    }))
  }

  const handleDateClick = (day: number) => {
    const dateKey = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    setSelectedDate(dateKey)
    const dateData = currentExamData.dates[dateKey]
    if (dateData) {
      setEditingCapacity(
        Object.fromEntries(
          dateData.timeSlots.map((slot) => [`capacity-${slot.time}`, String(slot.capacity)])
        )
      )
    }
    setIsSheetOpen(true)
  }

  const handleSaveChanges = () => {
    if (!selectedDate) return

    setExamsData((prev) => {
      const newData = { ...prev }
      const dateData = newData[selectedExam].dates[selectedDate]
      
      if (dateData) {
        dateData.timeSlots = dateData.timeSlots.map((slot) => ({
          ...slot,
          capacity: Math.max(slot.booked, parseInt(editingCapacity[`capacity-${slot.time}`] || slot.capacity, 10)),
        }))
      }
      
      return newData
    })
    setIsSheetOpen(false)
  }

  const handleToggleOpen = () => {
    if (!selectedDate) return

    setExamsData((prev) => {
      const newData = { ...prev }
      const dateData = newData[selectedExam].dates[selectedDate]
      if (dateData) {
        dateData.isOpen = !dateData.isOpen
      }
      return newData
    })
  }

  const getDateStatus = (day: number) => {
    const dateKey = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    const dateData = currentExamData.dates[dateKey]
    if (!dateData || !dateData.isOpen) return 'closed'
    
    const hasFullSlots = dateData.timeSlots.some((slot) => slot.booked >= slot.capacity)
    return hasFullSlots ? 'partial' : 'open'
  }

  const getCapacityDisplay = (day: number) => {
    const dateKey = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    const dateData = currentExamData.dates[dateKey]
    if (!dateData || !dateData.isOpen) return ''
    
    return dateData.timeSlots
      .map((slot) => {
        const isFull = slot.booked >= slot.capacity
        const text = `${slot.time}: ${slot.booked}/${slot.capacity}`
        return isFull ? `<span class="text-red-600">${text}</span>` : text
      })
      .join(' · ')
  }

  const selectedDateData = selectedDate ? currentExamData.dates[selectedDate] : null

  // Build calendar grid
  const calendarDays = []
  for (let i = 0; i < firstDayOfMonth; i++) {
    calendarDays.push(null)
  }
  for (let day = 1; day <= daysInMonth; day++) {
    calendarDays.push(day)
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-6xl space-y-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Calendar Management</h1>
          <p className="text-gray-600 mt-1">Configure exam dates and time slot capacity</p>
        </div>

        {/* Exam Tabs */}
        <Tabs value={selectedExam} onValueChange={setSelectedExam} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            {EXAMS.map((exam) => (
              <TabsTrigger key={exam} value={exam}>
                {exam}
              </TabsTrigger>
            ))}
          </TabsList>

          {EXAMS.map((exam) => (
            <TabsContent key={exam} value={exam} className="space-y-6">
              <Card className="border-gray-200">
                <CardHeader className="flex flex-row items-center justify-between pb-4">
                  <div>
                    <CardTitle className="text-lg">{exam} — January 2025</CardTitle>
                    <CardDescription>Click any date to configure time slots and capacity</CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handlePrevMonth}
                      className="border-gray-300"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleNextMonth}
                      className="border-gray-300"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </CardHeader>

                <CardContent>
                  {/* Calendar Grid */}
                  <div className="space-y-6">
                    {/* Day headers */}
                    <div className="grid grid-cols-7 gap-2">
                      {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                        <div key={day} className="text-center text-sm font-semibold text-gray-600 py-2">
                          {day}
                        </div>
                      ))}
                    </div>

                    {/* Calendar cells */}
                    <div className="grid grid-cols-7 gap-2">
                      {calendarDays.map((day, idx) => {
                        if (day === null) {
                          return <div key={`empty-${idx}`} className="bg-gray-50 rounded p-3" />
                        }

                        const status = getDateStatus(day)
                        const isOpen = status !== 'closed'
                        const capacityDisplay = getCapacityDisplay(day)

                        return (
                          <Sheet key={day} open={isSheetOpen && selectedDate?.endsWith(`-${String(day).padStart(2, '0')}`)} onOpenChange={setIsSheetOpen}>
                            <SheetTrigger asChild>
                              <button
                                onClick={() => handleDateClick(day)}
                                className={`p-3 rounded border-2 transition-all cursor-pointer text-left h-24 flex flex-col justify-between ${
                                  isOpen
                                    ? status === 'partial'
                                      ? 'border-orange-200 bg-orange-50 hover:border-orange-400'
                                      : 'border-green-200 bg-green-50 hover:border-green-400'
                                    : 'border-gray-200 bg-gray-100 hover:border-gray-400 opacity-60'
                                }`}
                              >
                                <div className="font-bold text-gray-900">{day}</div>
                                {isOpen && (
                                  <div className="text-xs leading-tight" dangerouslySetInnerHTML={{ __html: capacityDisplay }} />
                                )}
                              </button>
                            </SheetTrigger>

                            <SheetContent side="right" className="w-full sm:w-96">
                              <SheetHeader>
                                <SheetTitle>
                                  {selectedExam} — {selectedDate}
                                </SheetTitle>
                              </SheetHeader>

                              {selectedDateData && (
                                <div className="space-y-6 mt-6">
                                  {/* Open/Close Toggle */}
                                  <div className="space-y-3">
                                    <label className="text-sm font-medium text-gray-700">Status</label>
                                    <div className="flex items-center gap-3">
                                      <Switch
                                        checked={selectedDateData.isOpen}
                                        onCheckedChange={handleToggleOpen}
                                      />
                                      <span className="text-sm text-gray-600">
                                        {selectedDateData.isOpen ? 'Open for registration' : 'Closed'}
                                      </span>
                                    </div>
                                  </div>

                                  {selectedDateData.isOpen && (
                                    <>
                                      {/* Time Slots */}
                                      <div className="space-y-4">
                                        <label className="text-sm font-medium text-gray-700 block">
                                          Time Slot Capacity
                                        </label>

                                        {selectedDateData.timeSlots.map((slot) => {
                                          const isFull = slot.booked >= slot.capacity
                                          return (
                                            <div key={slot.time} className="space-y-2">
                                              <div className="flex items-center justify-between">
                                                <span className="text-sm font-medium text-gray-700">{slot.time}</span>
                                                <span className={`text-xs font-medium ${isFull ? 'text-red-600' : 'text-gray-600'}`}>
                                                  {slot.booked} booked
                                                </span>
                                              </div>

                                              {isFull && (
                                                <Alert className="bg-red-50 border-red-200">
                                                  <AlertCircle className="h-4 w-4 text-red-600" />
                                                  <AlertDescription className="text-red-700 text-xs">
                                                    This slot is full. Capacity must be at least {slot.booked}.
                                                  </AlertDescription>
                                                </Alert>
                                              )}

                                              <div className="flex items-center gap-2">
                                                <span className="text-sm text-gray-600">Capacity:</span>
                                                <Input
                                                  type="number"
                                                  min={slot.booked}
                                                  value={editingCapacity[`capacity-${slot.time}`] || slot.capacity}
                                                  onChange={(e) =>
                                                    setEditingCapacity((prev) => ({
                                                      ...prev,
                                                      [`capacity-${slot.time}`]: e.target.value,
                                                    }))
                                                  }
                                                  className="w-20 h-9 border-gray-300"
                                                />
                                              </div>
                                            </div>
                                          )
                                        })}
                                      </div>
                                    </>
                                  )}

                                  {/* Save Button */}
                                  <Button
                                    onClick={handleSaveChanges}
                                    className="w-full mt-8"
                                    style={{ background: '#1e3a5f', color: '#ffffff' }}
                                  >
                                    Save Changes
                                  </Button>
                                </div>
                              )}
                            </SheetContent>
                          </Sheet>
                        )
                      })}
                    </div>

                    {/* Legend */}
                    <div className="flex gap-6 text-sm mt-6 pt-4 border-t border-gray-200">
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded bg-green-100 border-2 border-green-200" />
                        <span className="text-gray-600">Open with capacity</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded bg-orange-100 border-2 border-orange-200" />
                        <span className="text-gray-600">Partial/Full slots</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded bg-gray-100 border-2 border-gray-200" />
                        <span className="text-gray-600">Closed</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </div>
  )
}
