"use client"

import Image from "next/image"

interface LogoProps {
    size?: number
    className?: string
    variant?: "icon" | "full"
}

export function Logo({ size = 24, className = "", variant = "icon" }: LogoProps) {
    const src = variant === "full" ? "/logo-transparent-v2.png" : "/icon-spark-v2.png"

    // Full logo has ~3:1 aspect ratio for compact header fit, icon is 1:1
    const width = variant === "full" ? size * 3 : size
    const height = size

    return (
        <Image
            src={src}
            alt="STEAM Spark Logo"
            width={width}
            height={height}
            className={className}
            priority
        />
    )
}

