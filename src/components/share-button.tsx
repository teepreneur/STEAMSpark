"use client"

import * as React from "react"
import { Share2, Link as LinkIcon, Twitter, Facebook, Linkedin, MessageCircle, MoreHorizontal } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useToast } from "@/hooks/use-toast"

interface ShareButtonProps {
    title: string
    text: string
    url: string
    variant?: "default" | "outline" | "ghost" | "secondary"
    size?: "default" | "sm" | "lg" | "icon"
    className?: string
    iconOnly?: boolean
}

export function ShareButton({ title, text, url, variant = "outline", size = "sm", className, iconOnly = false }: ShareButtonProps) {
    const { toast } = useToast()
    // Construct the absolute URL if it's relative
    const shareUrl = typeof window !== 'undefined'
        ? (url.startsWith('http') ? url : `${window.location.origin}${url}`)
        : url

    const handleShare = async () => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title,
                    text,
                    url: shareUrl,
                })
            } catch (err) {
                console.error("Error sharing:", err)
            }
        }
    }

    const copyToClipboard = () => {
        navigator.clipboard.writeText(shareUrl)
        toast({
            title: "Link copied!",
            description: "The link has been copied to your clipboard.",
        })
    }

    const shareLinks = [
        {
            name: "WhatsApp",
            icon: MessageCircle,
            url: `https://wa.me/?text=${encodeURIComponent(`${text} ${shareUrl}`)}`,
            color: "text-green-500"
        },
        {
            name: "X (Twitter)",
            icon: Twitter,
            url: `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(shareUrl)}`,
            color: "text-sky-500"
        },
        {
            name: "Facebook",
            icon: Facebook,
            url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`,
            color: "text-blue-600"
        },
        {
            name: "LinkedIn",
            icon: Linkedin,
            url: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`,
            color: "text-blue-700"
        }
    ]

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant={variant} size={size} className={className}>
                    {iconOnly ? <Share2 className="size-4" /> : <><Share2 className="size-4 mr-2" /> Share</>}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem onClick={copyToClipboard} className="cursor-pointer">
                    <LinkIcon className="mr-2 h-4 w-4" />
                    <span>Copy Link</span>
                </DropdownMenuItem>

                {shareLinks.map((link) => (
                    <DropdownMenuItem key={link.name} asChild className="cursor-pointer">
                        <a href={link.url} target="_blank" rel="noopener noreferrer">
                            <link.icon className={`mr-2 h-4 w-4 ${link.color}`} />
                            <span>Share on {link.name}</span>
                        </a>
                    </DropdownMenuItem>
                ))}

                {typeof navigator !== 'undefined' && (navigator as any).share && (
                    <DropdownMenuItem onClick={handleShare} className="cursor-pointer sm:hidden">
                        <MoreHorizontal className="mr-2 h-4 w-4" />
                        <span>System Share</span>
                    </DropdownMenuItem>
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
