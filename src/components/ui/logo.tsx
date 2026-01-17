"use client"

import Image from "next/image"

interface LogoProps {
    size?: number
    className?: string
}

export function Logo({ size = 24, className = "" }: LogoProps) {
    return (
        <Image
            src="/logo.png"
            alt="STEAM Spark Logo"
            width={size}
            height={size}
            className={`rounded-lg ${className}`}
            priority
        />
    )
}
