"use client"

import Image from "next/image"

interface LogoProps {
    size?: number
    className?: string
    variant?: "icon" | "full"
}

export function Logo({ size = 24, className = "", variant = "icon" }: LogoProps) {
    const src = variant === "full" ? "/logo-spark-v2.png" : "/icon-spark-v2.png"

    return (
        <Image
            src={src}
            alt="STEAM Spark Logo"
            width={size}
            height={size}
            className={className}
            priority
        />
    )
}
