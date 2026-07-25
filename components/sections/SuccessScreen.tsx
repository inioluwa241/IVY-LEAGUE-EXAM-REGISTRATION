'use client'

import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CheckCircle2, Mail } from 'lucide-react'

export default function SuccessScreen() {
  return (
    <div className="min-h-screen bg-background py-8 px-4 flex items-center justify-center">
      <div className="max-w-md w-full">
        <Card>
          <CardHeader className="text-center pb-4">
            <div className="flex justify-center mb-4">
              <div className="rounded-full bg-green-100 dark:bg-green-900 p-3">
                <CheckCircle2 className="size-12 text-green-600 dark:text-green-400" />
              </div>
            </div>
            <h1 className="text-2xl font-bold">Registration Successful!</h1>
          </CardHeader>

          <CardContent className="space-y-6">
            <div className="space-y-3 text-center">
              <p className="text-muted-foreground">
                Thank you for completing your ACCA registration.
              </p>
              <p className="text-sm text-muted-foreground">
                Our team will review your application and contact you within 24-48 hours with further instructions.
              </p>
            </div>

            <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Mail className="size-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-blue-900 dark:text-blue-100 mb-1">
                    Check Your Email
                  </p>
                  <p className="text-blue-800 dark:text-blue-200 text-xs">
                    A confirmation email has been sent to your registered email address with your registration details.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-2 text-sm text-muted-foreground">
              <p>
                <span className="font-medium">Reference Number:</span> ACCA-2024-001847
              </p>
              <p>
                <span className="font-medium">Status:</span>{' '}
                <span className="inline-block px-2 py-1 rounded bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 text-xs font-medium">
                  Under Review
                </span>
              </p>
            </div>

            <div className="pt-4 border-t space-y-2">
              <Button className="w-full" onClick={() => window.location.reload()}>
                Start New Registration
              </Button>
              <Button variant="outline" className="w-full">
                View Dashboard
              </Button>
            </div>

            <p className="text-xs text-muted-foreground text-center">
              Questions? Contact support@accaexams.com or call +44 1908 248250
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
