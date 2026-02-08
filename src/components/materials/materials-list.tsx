"use client"

import { FileText, FileVideo, FileImage, Download, Trash2, Loader2, Globe, Users, Lock as LockIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useState } from "react"

export interface Material {
    id: string
    title: string
    description?: string
    file_url: string
    file_name?: string
    file_type?: string
    file_size?: number
    visibility: 'private' | 'enrolled_students' | 'public'
    created_at: string
}

interface MaterialsListProps {
    materials: Material[]
    onDelete?: (id: string) => Promise<void>
    isTeacher?: boolean
}

const fileIconMap: Record<string, any> = {
    pdf: FileText,
    video: FileVideo,
    image: FileImage,
    document: FileText,
    default: FileText
}

export function MaterialsList({ materials, onDelete, isTeacher }: MaterialsListProps) {
    const [deletingId, setDeletingId] = useState<string | null>(null)

    const handleDelete = async (id: string) => {
        if (!onDelete) return
        setDeletingId(id)
        try {
            await onDelete(id)
        } finally {
            setDeletingId(null)
        }
    }

    const formatSize = (bytes?: number) => {
        if (!bytes) return "0 B"
        const k = 1024
        const sizes = ["B", "KB", "MB", "GB"]
        const i = Math.floor(Math.log(bytes) / Math.log(k))
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
    }

    if (materials.length === 0) {
        return (
            <div className="text-center py-12 bg-muted/20 border-2 border-dashed rounded-2xl">
                <FileText className="size-12 text-muted-foreground mx-auto mb-3 opacity-20" />
                <p className="text-muted-foreground">No materials shared yet.</p>
            </div>
        )
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {materials.map((item) => {
                const Icon = fileIconMap[item.file_type || 'default'] || fileIconMap.default

                return (
                    <div key={item.id} className="group flex items-start gap-4 p-4 bg-card border rounded-xl hover:shadow-md transition-all">
                        <div className="size-12 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                            <Icon className="size-6" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2 mb-1">
                                <h4 className="font-bold text-sm truncate">{item.title}</h4>
                                <div className="flex items-center gap-1.5 shrink-0">
                                    {isTeacher && (
                                        <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-muted text-[10px] font-bold uppercase text-muted-foreground">
                                            {item.visibility === 'public' && <Globe className="size-2.5" />}
                                            {item.visibility === 'enrolled_students' && <Users className="size-2.5" />}
                                            {item.visibility === 'private' && <LockIcon className="size-2.5" />}
                                            {item.visibility.replace('_', ' ')}
                                        </div>
                                    )}
                                </div>
                            </div>
                            {item.description && (
                                <p className="text-xs text-muted-foreground line-clamp-1 mb-2">{item.description}</p>
                            )}
                            <div className="flex items-center gap-3 text-[10px] text-muted-foreground font-medium">
                                <span>{item.file_type?.toUpperCase() || 'FILE'}</span>
                                <span>•</span>
                                <span>{formatSize(item.file_size)}</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-1 opacity-100 lg:opacity-0 group-hover:opacity-100 transition-opacity self-center">
                            <Button size="icon" variant="ghost" className="size-8 rounded-full text-muted-foreground hover:text-primary" asChild>
                                <a href={item.file_url} target="_blank" rel="noopener noreferrer" download={item.file_name}>
                                    <Download className="size-4" />
                                </a>
                            </Button>
                            {onDelete && (
                                <Button
                                    size="icon"
                                    variant="ghost"
                                    className="size-8 rounded-full text-muted-foreground hover:text-red-500"
                                    onClick={() => handleDelete(item.id)}
                                    disabled={deletingId === item.id}
                                >
                                    {deletingId === item.id ? (
                                        <Loader2 className="size-4 animate-spin" />
                                    ) : (
                                        <Trash2 className="size-4" />
                                    )}
                                </Button>
                            )}
                        </div>
                    </div>
                )
            })}
        </div>
    )
}
