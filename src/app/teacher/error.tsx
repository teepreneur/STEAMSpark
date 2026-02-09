'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { AlertCircle } from 'lucide-react'

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string }
    reset: () => void
}) {
    useEffect(() => {
        // Log the error to an error reporting service
        console.error('[Teacher Dashboard Error]', error)
    }, [error])

    return (
        <div className="flex flex-col items-center justify-center min-h-[50vh] p-4 text-center">
            <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-full mb-4">
                <AlertCircle className="size-8 text-red-600 dark:text-red-400" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Something went wrong!</h2>
            <p className="text-muted-foreground mb-6 max-w-md">
                We encountered an error while loading your dashboard. This might be due to a temporary connection issue.
            </p>
            <div className="flex items-center gap-4">
                <Button onClick={() => reset()} variant="default">
                    Try again
                </Button>
                <Button onClick={() => window.location.href = '/'} variant="outline">
                    Go Home
                </Button>
            </div>
            {process.env.NODE_ENV === 'development' && (
                <div className="mt-8 p-4 bg-muted rounded-lg text-left w-full max-w-2xl overflow-auto text-xs font-mono">
                    <p className="font-bold text-red-500 mb-2">{error.name}: {error.message}</p>
                    <pre>{error.stack}</pre>
                </div>
            )}
        </div>
    )
}
