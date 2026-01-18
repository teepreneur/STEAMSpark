import type { Metadata } from 'next'
import { Lexend } from 'next/font/google'
import '../globals.css'

const lexend = Lexend({
    subsets: ['latin'],
    variable: '--font-lexend',
})

export const metadata: Metadata = {
    title: 'Early Access | STEAM Spark',
    description: 'Join the waiting list for STEAM Spark.',
}

export default function EarlyAccessLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className={`${lexend.variable} font-sans min-h-screen bg-white`}>
            {children}
        </div>
    )
}
