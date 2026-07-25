'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { AlertTriangle, CheckCircle2, ArrowRight } from 'lucide-react'

// Mock student data with approved registrations
const mockStudents = [
  { id: 1, name: 'Chioma Okafor', email: 'chioma.okafor@example.com' },
  { id: 2, name: 'Adebayo Johnson', email: 'adebayo.j@example.com' },
  { id: 3, name: 'Blessing Nwosu', email: 'blessing.n@example.com' },
  { id: 4, name: 'Tunde Oluwaseun', email: 'tunde.o@example.com' },
  { id: 5, name: 'Amara Ekpenyong', email: 'amara.e@example.com' },
  { id: 6, name: 'Ifeanyi Okonkwo', email: 'ifeanyi.o@example.com' },
  { id: 7, name: 'Zainab Adebisi', email: 'zainab.a@example.com' },
  { id: 8, name: 'Kamara Sani', email: 'kamara.s@example.com' },
  { id: 9, name: 'Ebube Nnamdi', email: 'ebube.n@example.com' },
  { id: 10, name: 'Hauwa Ibrahim', email: 'hauwa.i@example.com' },
  { id: 11, name: 'Folake Adeyemi', email: 'folake.a@example.com' },
  { id: 12, name: 'Emeka Okoye', email: 'emeka.o@example.com' },
]

// Mock approved registrations per student
const mockRegistrations: Record<number, Array<{ id: string; exam: string; date: string; time: string; docket: string }>> = {
  1: [{ id: '1a', exam: 'BT', date: '2025-02-15', time: '9:45 AM', docket: 'DOC-2025-001' }],
  2: [
    { id: '2a', exam: 'FA', date: '2025-02-20', time: '12:15 PM', docket: 'DOC-2025-002' },
    { id: '2b', exam: 'CBL', date: '2025-03-05', time: '2:15 PM', docket: 'DOC-2025-003' },
  ],
  3: [{ id: '3a', exam: 'MA', date: '2025-02-18', time: '12:15 PM', docket: 'DOC-2025-004' }],
  4: [
    { id: '4a', exam: 'BT', date: '2025-02-22', time: '2:15 PM', docket: 'DOC-2025-005' },
    { id: '4b', exam: 'FA', date: '2025-03-01', time: '9:45 AM', docket: 'DOC-2025-006' },
  ],
  5: [{ id: '5a', exam: 'CBL', date: '2025-03-10', time: '12:15 PM', docket: 'DOC-2025-007' }],
  6: [
    { id: '6a', exam: 'BT', date: '2025-02-15', time: '12:15 PM', docket: 'DOC-2025-008' },
    { id: '6b', exam: 'MA', date: '2025-02-28', time: '2:15 PM', docket: 'DOC-2025-009' },
    { id: '6c', exam: 'FA', date: '2025-03-08', time: '9:45 AM', docket: 'DOC-2025-010' },
  ],
  7: [{ id: '7a', exam: 'FA', date: '2025-02-25', time: '9:45 AM', docket: 'DOC-2025-011' }],
  8: [
    { id: '8a', exam: 'BT', date: '2025-02-20', time: '9:45 AM', docket: 'DOC-2025-012' },
    { id: '8b', exam: 'CBL', date: '2025-03-12', time: '12:15 PM', docket: 'DOC-2025-013' },
  ],
  9: [{ id: '9a', exam: 'MA', date: '2025-03-03', time: '12:15 PM', docket: 'DOC-2025-014' }],
  10: [
    { id: '10a', exam: 'CBL', date: '2025-03-15', time: '9:45 AM', docket: 'DOC-2025-015' },
  ],
  11: [{ id: '11a', exam: 'BT', date: '2025-02-18', time: '2:15 PM', docket: 'DOC-2025-016' }],
  12: [
    { id: '12a', exam: 'FA', date: '2025-02-22', time: '12:15 PM', docket: 'DOC-2025-017' },
    { id: '12b', exam: 'MA', date: '2025-03-07', time: '9:45 AM', docket: 'DOC-2025-018' },
  ],
}

type Step = 'search' | 'select' | 'reschedule' | 'success'

interface SelectedRegistration {
  studentId: number
  registrationId: string
  student: (typeof mockStudents)[0]
  registration: (typeof mockRegistrations)[1][0]
}

interface NewSchedule {
  date: string
  time: string
}

interface CapacityCheck {
  booked: number
  capacity: number
  full: boolean
}

export default function ReschedulePage() {
  const [currentStep, setCurrentStep] = useState<Step>('search')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedStudent, setSelectedStudent] = useState<(typeof mockStudents)[0] | null>(null)
  const [selectedRegistration, setSelectedRegistration] = useState<SelectedRegistration | null>(null)
  const [newSchedule, setNewSchedule] = useState<NewSchedule>({ date: '', time: '' })
  const [showCapacityDialog, setShowCapacityDialog] = useState(false)
  const [capacityData, setCapacityData] = useState<CapacityCheck | null>(null)
  const [capacityOverride, setCapacityOverride] = useState(false)
  const [newDocket, setNewDocket] = useState('')

  // Filter students based on search
  const filteredStudents = mockStudents.filter(
    (student) =>
      student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.email.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Get registrations for selected student (only approved)
  const studentRegistrations = selectedStudent ? mockRegistrations[selectedStudent.id] || [] : []

  // Step 1: Handle student selection
  const handleSelectStudent = (student: (typeof mockStudents)[0]) => {
    setSelectedStudent(student)
    setSearchQuery('')
  }

  // Step 2: Handle registration selection
  const handleSelectRegistration = (registration: (typeof mockRegistrations)[1][0]) => {
    setSelectedRegistration({
      studentId: selectedStudent!.id,
      registrationId: registration.id,
      student: selectedStudent!,
      registration,
    })
    setCurrentStep('reschedule')
  }

  // Handle new date/time selection
  const handleSelectNewDateTime = (date: string, time: string) => {
    setNewSchedule({ date, time })
  }

  // Step 3: Check capacity and trigger reschedule
  const handleConfirmReschedule = () => {
    // Mock capacity check - 50/50 chance of full capacity
    const booked = Math.floor(Math.random() * 22)
    const capacity = 20
    const full = booked >= capacity

    setCapacityData({ booked, capacity, full })
    setShowCapacityDialog(true)
  }

  // Proceed with reschedule after capacity check
  const handleProceedWithReschedule = () => {
    setShowCapacityDialog(false)

    // Only check capacity if not full, or if override is enabled
    if (capacityData && capacityData.full && !capacityOverride) {
      return
    }

    // Generate new docket and show success
    const newDocketNum = `DOC-2025-${String(Math.floor(Math.random() * 10000)).padStart(3, '0')}`
    setNewDocket(newDocketNum)
    setCapacityOverride(false)
    setCurrentStep('success')
  }

  // Handle reschedule another
  const handleRescheduleAnother = () => {
    setCurrentStep('search')
    setSearchQuery('')
    setSelectedStudent(null)
    setSelectedRegistration(null)
    setNewSchedule({ date: '', time: '' })
    setNewDocket('')
    setCapacityOverride(false)
  }

  // Handle back to dashboard
  const handleBackToDashboard = () => {
    // In production, navigate to dashboard
    window.location.href = '/'
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Reschedule Registration</h1>
          <p className="text-gray-600 mt-1">Modify approved exam registrations for students</p>
        </div>

        {/* Step 1: Search Student */}
        {currentStep === 'search' && (
          <div className="space-y-6">
            <Card className="border-gray-200">
              <CardHeader>
                <CardTitle className="text-lg">Find Student</CardTitle>
                <CardDescription>Search by name or email to find the student's registration</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label htmlFor="search" className="text-sm font-medium text-gray-700">
                    Student Name or Email
                  </label>
                  <Input
                    id="search"
                    type="text"
                    placeholder="Type to search..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="mt-2 border-gray-300"
                  />
                </div>

                {filteredStudents.length > 0 && (
                  <div className="space-y-2 max-h-64 overflow-y-auto border border-gray-200 rounded-lg p-3">
                    {filteredStudents.map((student) => (
                      <button
                        key={student.id}
                        onClick={() => handleSelectStudent(student)}
                        className="w-full text-left p-3 rounded hover:bg-blue-50 transition-colors border border-transparent hover:border-blue-200"
                      >
                        <p className="font-medium text-gray-900">{student.name}</p>
                        <p className="text-sm text-gray-600">{student.email}</p>
                      </button>
                    ))}
                  </div>
                )}

                {searchQuery && filteredStudents.length === 0 && (
                  <div className="text-center py-6 text-gray-500">
                    <p>No students found matching "{searchQuery}"</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {selectedStudent && (
              <Card className="border-blue-200 bg-blue-50">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Selected Student</p>
                      <p className="text-lg font-semibold text-gray-900">{selectedStudent.name}</p>
                    </div>
                    <Button onClick={() => setCurrentStep('select')} className="bg-blue-600 hover:bg-blue-700">
                      Continue
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Step 2: Select Registration */}
        {currentStep === 'select' && selectedStudent && (
          <div className="space-y-6">
            <Card className="border-gray-200">
              <CardHeader>
                <CardTitle className="text-lg">Select Registration to Reschedule</CardTitle>
                <CardDescription>
                  Showing approved registrations for {selectedStudent.name}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {studentRegistrations.length > 0 ? (
                  <div className="space-y-3">
                    {studentRegistrations.map((reg) => (
                      <button
                        key={reg.id}
                        onClick={() => handleSelectRegistration(reg)}
                        className="w-full text-left p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <Badge className="bg-green-100 text-green-800 border-green-200">Approved</Badge>
                              <span className="font-semibold text-gray-900">{reg.exam}</span>
                            </div>
                            <p className="text-sm text-gray-600">
                              {reg.date} at {reg.time}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">Docket: {reg.docket}</p>
                          </div>
                          <ArrowRight className="h-5 w-5 text-gray-400" />
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <p>No approved registrations found</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setCurrentStep('search')
                  setSelectedStudent(null)
                  setSearchQuery('')
                }}
              >
                Back
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Reschedule */}
        {currentStep === 'reschedule' && selectedRegistration && (
          <div className="space-y-6">
            {/* Current Schedule */}
            <Card className="border-gray-200 bg-gray-50">
              <CardHeader>
                <CardTitle className="text-sm">Current Schedule</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-xs text-gray-600">Exam</p>
                    <p className="text-lg font-semibold text-gray-900">{selectedRegistration.registration.exam}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">Date</p>
                    <p className="text-lg font-semibold text-gray-900">{selectedRegistration.registration.date}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">Time</p>
                    <p className="text-lg font-semibold text-gray-900">{selectedRegistration.registration.time}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* New Schedule */}
            <Card className="border-blue-200">
              <CardHeader>
                <CardTitle className="text-lg">Select New Schedule</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Date Input */}
                <div>
                  <label htmlFor="new-date" className="text-sm font-medium text-gray-700">
                    New Date
                  </label>
                  <Input
                    id="new-date"
                    type="date"
                    value={newSchedule.date}
                    onChange={(e) => handleSelectNewDateTime(e.target.value, newSchedule.time)}
                    className="mt-2 border-gray-300"
                  />
                </div>

                {/* Time Slot Selection */}
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-3">
                    Time Slot
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {['9:45 AM', '12:15 PM', '2:15 PM'].map((time) => (
                      <Button
                        key={time}
                        variant={newSchedule.time === time ? 'default' : 'outline'}
                        onClick={() => handleSelectNewDateTime(newSchedule.date, time)}
                        className="h-12"
                      >
                        {time}
                      </Button>
                    ))}
                  </div>
                </div>

                {newSchedule.date && newSchedule.time && (
                  <Alert className="bg-green-50 border-green-200">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <AlertDescription className="text-green-800">
                      New schedule selected: {newSchedule.date} at {newSchedule.time}
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setCurrentStep('select')
                  setSelectedRegistration(null)
                  setNewSchedule({ date: '', time: '' })
                }}
              >
                Back
              </Button>
              <Button
                disabled={!newSchedule.date || !newSchedule.time}
                onClick={handleConfirmReschedule}
                className="ml-auto bg-blue-600 hover:bg-blue-700"
              >
                Check Capacity & Reschedule
              </Button>
            </div>
          </div>
        )}

        {/* Step 4: Success */}
        {currentStep === 'success' && selectedRegistration && (
          <div className="space-y-6">
            <Card className="border-green-200 bg-green-50">
              <CardContent className="pt-8">
                <div className="text-center space-y-4">
                  <CheckCircle2 className="h-12 w-12 text-green-600 mx-auto" />
                  <h2 className="text-2xl font-bold text-green-900">Reschedule Successful</h2>
                  <p className="text-green-800">The registration has been rescheduled successfully</p>
                </div>
              </CardContent>
            </Card>

            {/* Details Card */}
            <Card className="border-gray-200">
              <CardHeader>
                <CardTitle className="text-lg">Updated Registration Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-600">Student</p>
                    <p className="text-sm font-semibold text-gray-900">{selectedRegistration.student.name}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">Exam</p>
                    <p className="text-sm font-semibold text-gray-900">{selectedRegistration.registration.exam}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">New Date</p>
                    <p className="text-sm font-semibold text-gray-900">{newSchedule.date}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">New Time</p>
                    <p className="text-sm font-semibold text-gray-900">{newSchedule.time}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-xs text-gray-600">New Docket Number</p>
                    <p className="text-lg font-mono font-semibold text-blue-600">{newDocket}</p>
                  </div>
                </div>

                <Alert className="bg-blue-50 border-blue-200">
                  <AlertDescription className="text-blue-800">
                    Old docket {selectedRegistration.registration.docket} has been archived. New docket {newDocket} is active.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="flex gap-3 justify-center">
              <Button
                variant="outline"
                onClick={handleRescheduleAnother}
                className="w-full sm:w-auto"
              >
                Reschedule Another
              </Button>
              <Button
                onClick={handleBackToDashboard}
                className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700"
              >
                Back to Dashboard
              </Button>
            </div>
          </div>
        )}

        {/* Capacity Check Dialog */}
        <Dialog open={showCapacityDialog} onOpenChange={setShowCapacityDialog}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {capacityData?.full && <AlertTriangle className="h-5 w-5 text-yellow-600" />}
                Capacity Check
              </DialogTitle>
              <DialogDescription>
                The requested time slot has limited availability
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <Alert className={capacityData?.full ? 'bg-yellow-50 border-yellow-200' : 'bg-green-50 border-green-200'}>
                <AlertDescription
                  className={capacityData?.full ? 'text-yellow-800' : 'text-green-800'}
                >
                  <p className="font-semibold">
                    {capacityData?.booked}/{capacityData?.capacity} slots booked
                  </p>
                  {capacityData?.full && (
                    <p className="text-sm mt-1">This slot is at full capacity. Override to proceed?</p>
                  )}
                </AlertDescription>
              </Alert>

              {capacityData?.full && (
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={capacityOverride}
                    onChange={(e) => setCapacityOverride(e.target.checked)}
                    className="w-4 h-4"
                  />
                  <span className="text-sm text-gray-700">Yes, override and reschedule anyway</span>
                </label>
              )}
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setShowCapacityDialog(false)
                  setCapacityOverride(false)
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleProceedWithReschedule}
                disabled={capacityData?.full && !capacityOverride}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Proceed
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
