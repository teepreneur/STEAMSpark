"use server"

export async function resolveGoogleMapsUrl(shortUrl: string) {
    if (!shortUrl.includes('maps.app.goo.gl') && !shortUrl.includes('goo.gl/maps')) {
        return { error: "Not a shortened Google Maps URL" }
    }

    try {
        const response = await fetch(shortUrl, {
            method: 'HEAD',
            redirect: 'manual'
        })

        const location = response.headers.get('location')
        if (location) {
            return { url: location }
        }
        
        // Sometimes it's a 200 with a meta refresh or JS redirect, but let's try GET if HEAD fails
        const getResponse = await fetch(shortUrl, {
            method: 'GET',
            redirect: 'follow'
        })
        
        return { url: getResponse.url }
    } catch (e) {
        console.error("Failed to resolve URL:", e)
        return { error: "Could not resolve shortened link" }
    }
}
