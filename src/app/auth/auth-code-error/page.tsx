'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'

export default function AuthCodeErrorPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <Link href="/" className="inline-flex items-center space-x-2 mb-6">
            <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-lg">P</span>
            </div>
            <span className="font-bold text-2xl">Polly</span>
          </Link>
        </div>

        <Card className="w-full">
          <CardHeader className="text-center">
            <div className="mx-auto h-12 w-12 text-red-500 mb-4">
              <svg
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                className="h-full w-full"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
            </div>
            <CardTitle className="text-2xl font-bold text-red-600">
              Authentication Error
            </CardTitle>
            <CardDescription>
              There was a problem signing you in
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            <Alert variant="destructive">
              <AlertDescription>
                The authentication process failed. This could be due to:
              </AlertDescription>
            </Alert>

            <div className="space-y-2 text-sm text-muted-foreground">
              <ul className="list-disc list-inside space-y-1">
                <li>The authorization was cancelled or denied</li>
                <li>Invalid or expired authentication code</li>
                <li>Network connectivity issues</li>
                <li>OAuth provider configuration problems</li>
              </ul>
            </div>

            <div className="space-y-3 pt-4">
              <Button asChild className="w-full">
                <Link href="/auth/login">
                  Try Again
                </Link>
              </Button>

              <Button variant="outline" asChild className="w-full">
                <Link href="/auth/register">
                  Create New Account
                </Link>
              </Button>

              <div className="text-center">
                <Link
                  href="/support"
                  className="text-sm text-primary hover:underline"
                >
                  Contact Support
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="text-center">
          <p className="text-sm text-muted-foreground">
            Need help?{' '}
            <Link href="/help" className="text-primary hover:underline">
              Visit our help center
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
