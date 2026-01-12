import { BarChart, Info } from "lucide-react"

export function ActivityChart() {
    return (
        <section>
            <div className="flex items-center gap-2 mb-4">
                <BarChart className="text-primary size-5" />
                <h2 className="text-lg font-bold">Weekly Activity</h2>
            </div>
            <div className="bg-card p-6 rounded-xl border shadow-sm">
                <div className="flex items-end justify-between h-40 gap-2 sm:gap-4">
                    {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, i) => {
                        const height = [40, 65, 30, 85, 55, 20, 10][i] + '%';
                        return (
                            <div key={i} className="flex flex-col items-center gap-2 flex-1 group cursor-pointer">
                                <div className="w-full bg-primary/20 dark:bg-primary/10 rounded-t-lg h-full relative overflow-hidden group-hover:bg-primary/30 transition-colors">
                                    <div className="absolute bottom-0 w-full bg-primary rounded-t-lg transition-all duration-500" style={{ height }}></div>
                                </div>
                                <span className="text-xs font-medium text-muted-foreground">{day}</span>
                            </div>
                        )
                    })}
                </div>
            </div>
        </section>
    )
}
