export function OrganizationJsonLd() {
    const jsonLd = {
        "@context": "https://schema.org",
        "@type": "EducationalOrganization",
        name: "STEAM Spark",
        url: "https://steamsparkgh.com",
        logo: "https://steamsparkgh.com/logo-spark-v2.png",
        description: "STEAM Spark connects curious minds with expert mentors. Personalized learning paths in Science, Technology, Engineering, Arts, and Math for kids and teens ages 5-18.",
        address: {
            "@type": "PostalAddress",
            addressLocality: "Accra",
            addressCountry: "GH",
        },
        areaServed: {
            "@type": "Country",
            name: "Ghana",
        },
        sameAs: [
            // Add social media URLs when available
        ],
        serviceType: "Online Tutoring",
        audience: {
            "@type": "EducationalAudience",
            educationalRole: "student",
        },
    }

    return (
        <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
    )
}

export function WebsiteJsonLd() {
    const jsonLd = {
        "@context": "https://schema.org",
        "@type": "WebSite",
        name: "STEAM Spark",
        url: "https://steamsparkgh.com",
        description: "Personalized STEAM education for kids and teens in Ghana",
        potentialAction: {
            "@type": "SearchAction",
            target: {
                "@type": "EntryPoint",
                urlTemplate: "https://steamsparkgh.com/search?q={search_term_string}",
            },
            "query-input": "required name=search_term_string",
        },
    }

    return (
        <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
    )
}
