import { ReactNode } from "react"
import { Metadata } from "next"
import { OrganizationJsonLd, WebsiteJsonLd } from "@/components/seo/json-ld"

export const metadata: Metadata = {
    title: "STEAM Spark | Personalized STEAM Education for Kids in Ghana",
    description: "Connect your child with expert tutors in Science, Technology, Engineering, Arts, and Math. Personalized learning paths, gamified lessons, and real-time progress tracking for ages 5-16.",
    keywords: ["STEAM education", "tutoring Ghana", "online tutoring", "kids education", "science tutoring", "coding for kids", "math tutoring", "personalized learning"],
    authors: [{ name: "STEAM Spark" }],
    creator: "STEAM Spark",
    metadataBase: new URL("https://steamsparkgh.com"),
    alternates: {
        canonical: "/",
    },
    openGraph: {
        type: "website",
        locale: "en_GH",
        url: "https://steamsparkgh.com",
        siteName: "STEAM Spark",
        title: "STEAM Spark | Personalized STEAM Education for Kids in Ghana",
        description: "Connect your child with expert tutors in Science, Technology, Engineering, Arts, and Math. Personalized learning paths and gamified lessons.",
        images: [
            {
                url: "/og-image.png",
                width: 1200,
                height: 630,
                alt: "STEAM Spark - Igniting curiosities, one lesson at a time",
            },
        ],
    },
    twitter: {
        card: "summary_large_image",
        title: "STEAM Spark | Personalized STEAM Education for Kids",
        description: "Connect your child with expert STEAM tutors. Personalized learning, gamified lessons, real-time progress tracking.",
        images: ["/og-image.png"],
    },
    robots: {
        index: true,
        follow: true,
        googleBot: {
            index: true,
            follow: true,
            "max-video-preview": -1,
            "max-image-preview": "large",
            "max-snippet": -1,
        },
    },
}

export default function MarketingLayout({ children }: { children: ReactNode }) {
    return (
        <div className="min-h-screen bg-slate-50 dark:bg-[#0f1923]">
            <OrganizationJsonLd />
            <WebsiteJsonLd />
            {children}
        </div>
    )
}

