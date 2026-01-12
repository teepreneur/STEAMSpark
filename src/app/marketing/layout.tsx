import { ReactNode } from "react"

export default function MarketingLayout({ children }: { children: ReactNode }) {
    return (
        <div className="min-h-screen bg-slate-50 dark:bg-[#0f1923]">
            {children}
        </div>
    )
}
