import { Loader2 } from "lucide-react"

export default function Loading() {
    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
            <Loader2 className="size-10 animate-spin text-primary" />
            <p className="text-muted-foreground animate-pulse">Loading dashboard...</p>
        </div>
    )
}
