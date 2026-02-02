import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
    let ip = (request as any).ip || request.headers.get('x-forwarded-for') || 'unknown';

    // Handle multiple IPs in x-forwarded-for
    if (ip.includes(',')) {
        ip = ip.split(',')[0].trim();
    }

    return NextResponse.json({ ip });
}
