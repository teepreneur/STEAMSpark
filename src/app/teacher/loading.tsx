import { Skeleton } from "@/components/ui/skeleton"

export default function Loading() {
    return (
        <div className="flex flex-col gap-6">
            {/* Header Banner Skeleton */}
            <div className="w-full">
                <div className="bg-muted rounded-2xl min-h-[180px] md:min-h-[220px] shadow-sm animate-pulse"></div>
            </div>

            {/* Stats Grid Skeleton */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="bg-card rounded-xl border p-6 shadow-sm">
                        <div className="flex items-center justify-between mb-2">
                            <Skeleton className="h-4 w-20" />
                            <Skeleton className="size-8 rounded-lg" />
                        </div>
                        <Skeleton className="h-8 w-16 mb-1" />
                        <Skeleton className="h-3 w-24" />
                    </div>
                ))}
            </div>

            {/* Main Grid Skeleton */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column */}
                <div className="lg:col-span-2 flex flex-col gap-6">
                    {/* Quick Actions */}
                    <div>
                        <Skeleton className="h-6 w-32 mb-4" />
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                            {[1, 2, 3].map((i) => (
                                <Skeleton key={i} className="h-24 rounded-lg" />
                            ))}
                        </div>
                    </div>

                    {/* Upcoming */}
                    <div>
                        <div className="flex justify-between mb-4">
                            <Skeleton className="h-6 w-40" />
                            <Skeleton className="h-4 w-24" />
                        </div>
                        <div className="bg-card rounded-xl border h-64"></div>
                    </div>
                </div>

                {/* Right Column */}
                <div className="flex flex-col gap-6">
                    <div>
                        <Skeleton className="h-6 w-32 mb-4" />
                        <div className="bg-card rounded-xl border h-48"></div>
                    </div>
                    <Skeleton className="h-32 rounded-xl" />
                </div>
            </div>
        </div>
    )
}
