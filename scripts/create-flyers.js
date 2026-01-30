const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const LOGO_PATH = path.join(process.cwd(), 'public/logo-transparent-v2.png');
// We will look for images in the artifacts directory
const ARTIFACTS_DIR = '/Users/triumphtetteh/.gemini/antigravity/brain/2248d578-d393-4b3d-bb1c-7229230ae565';

// Configuration for the flyers
const FLYERS_YOUNG = [
    { id: 'science_young', bgPattern: 'bg_science_young', headline: "TEACH SCIENCE", subhead: "Spark Curiosity in the Next Gen", color: "#4ADE80" },
    { id: 'tech_young', bgPattern: 'bg_tech_young', headline: "TEACH TECH", subhead: "Code the Future of Ghana", color: "#60A5FA" },
    { id: 'engineering_young', bgPattern: 'bg_engineering_young', headline: "TEACH ENGINEERING", subhead: "Build Solutions, Build Minds", color: "#FBBF24" },
    { id: 'arts_young', bgPattern: 'bg_arts_young', headline: "TEACH ARTS", subhead: "Design the World Around Us", color: "#F472B6" },
    { id: 'math_young', bgPattern: 'bg_math_young', headline: "TEACH MATH", subhead: "Master the Logic of Life", color: "#A78BFA" }
];

const FLYERS_SEASONED = [
    { id: 'science_seasoned', bgPattern: 'bg_science_nature', headline: "TEACH SCIENCE", subhead: "Share Your Experience", color: "#4ADE80" },
    { id: 'tech_seasoned', bgPattern: 'bg_tech_coding', headline: "TEACH TECH", subhead: "Mentor the Next Developers", color: "#60A5FA" },
    { id: 'engineering_seasoned', bgPattern: 'bg_engineering_build', headline: "TEACH ENGINEERING", subhead: "Guide Future Builders", color: "#FBBF24" },
    { id: 'arts_seasoned', bgPattern: 'bg_arts_creative', headline: "TEACH ARTS", subhead: "Inspire Through Creativity", color: "#F472B6" },
    { id: 'math_seasoned', bgPattern: 'bg_math_logic', headline: "TEACH MATH", subhead: "Pass Down Your Wisdom", color: "#A78BFA" }
];

const FLYERS = [...FLYERS_YOUNG, ...FLYERS_SEASONED];

function createTextSvg(width, height, headline, subhead, accentColor) {
    const fontSizeHead = Math.floor(width * 0.08);
    const fontSizeSub = Math.floor(width * 0.04);

    return `
    <svg width="${width}" height="${height}">
        <defs>
            <linearGradient id="grad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" style="stop-color:rgba(0,0,0,0);stop-opacity:0" />
                <stop offset="100%" style="stop-color:rgba(0,0,0,0.8);stop-opacity:1" />
            </linearGradient>
        </defs>
        
        <!-- Dark Gradient Overlay at Bottom -->
        <rect x="0" y="${height * 0.6}" width="${width}" height="${height * 0.4}" fill="url(#grad)" />
        
        <!-- Headline -->
        <text x="50" y="${height - 120}" font-family="Arial, sans-serif" font-weight="900" font-size="${fontSizeHead}" fill="white" style="text-shadow: 2px 2px 4px rgba(0,0,0,0.5);">
            ${headline}
        </text>
        
        <!-- Accent Line -->
        <rect x="50" y="${height - 100}" width="150" height="6" fill="${accentColor}" />
        
        <!-- Subhead -->
        <text x="50" y="${height - 60}" font-family="Arial, sans-serif" font-weight="500" font-size="${fontSizeSub}" fill="#E5E7EB">
            ${subhead}
        </text>
    </svg>
    `;
}

async function generateFlyers() {
    console.log('Starting flyer generation...');

    // Ensure output directory exists
    const OUTPUT_DIR = path.join(process.cwd(), 'marketing/assets');
    if (!fs.existsSync(OUTPUT_DIR)) {
        fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    }

    // Load Logo
    if (!fs.existsSync(LOGO_PATH)) {
        console.error('Logo not found at:', LOGO_PATH);
        return;
    }
    const logoBuffer = await sharp(LOGO_PATH).toBuffer();

    // Find latest generated images in artifacts dir
    const files = fs.readdirSync(ARTIFACTS_DIR);

    for (const config of FLYERS) {
        // Find the latest image that matches the pattern (get the one with latest timestamp)
        const matches = files.filter(f => f.includes(config.bgPattern) && f.endsWith('.png'));
        if (matches.length === 0) {
            console.log(`No background image found for ${config.id} (pattern: ${config.bgPattern})`);
            continue;
        }
        // Sort by name (timestamp usually at end) descending
        const bestMatch = matches.sort().reverse()[0];
        const inputPath = path.join(ARTIFACTS_DIR, bestMatch);
        const outputPath = path.join(OUTPUT_DIR, `flyer_${config.id}.png`);

        console.log(`Processing ${config.id} using background: ${bestMatch}`);

        try {
            const metadata = await sharp(inputPath).metadata();
            const width = metadata.width;
            const height = metadata.height;

            // 1. Prepare Logo (Top Right, resized)
            const logoWidth = Math.floor(width * 0.2); // 20% of width
            const resizedLogo = await sharp(logoBuffer).resize({ width: logoWidth }).toBuffer();

            // Calculate Position (Top Right with Padding)
            const padding = 40;
            const logoLeft = width - logoWidth - padding;
            const logoTop = padding;

            // 2. Prepare Text SVG
            const textSvg = Buffer.from(createTextSvg(width, height, config.headline, config.subhead, config.color));

            // 3. Composite everything
            await sharp(inputPath)
                .composite([
                    {
                        input: textSvg,
                        top: 0,
                        left: 0,
                    },
                    {
                        input: resizedLogo,
                        top: logoTop,
                        left: logoLeft
                    }
                ])
                .toFile(outputPath);

            console.log(`✅ Generated Flyer: ${outputPath}`);

        } catch (err) {
            console.error(`Failed to process ${config.id}:`, err);
        }
    }
}

generateFlyers();
