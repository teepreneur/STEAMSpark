const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const LOGO_PATH = path.join(process.cwd(), 'public/logo-transparent-v2.png');
const ARTIFACTS_DIR = '/Users/triumphtetteh/.gemini/antigravity/brain/2248d578-d393-4b3d-bb1c-7229230ae565';

const IMAGES = [
    { name: 'science', path: 'bg_science_nature_1769363078772.png' },
    { name: 'tech', path: 'bg_tech_coding_1769363092464.png' },
    { name: 'engineering', path: 'bg_engineering_build_1769363106857.png' },
    { name: 'arts', path: 'bg_arts_creative_1769363119742.png' },
    { name: 'math', path: 'bg_math_logic_1769363134375.png' }
];

async function overlayLogo() {
    console.log('Starting logo overlay process...');

    if (!fs.existsSync(LOGO_PATH)) {
        console.error('Logo not found at:', LOGO_PATH);
        return;
    }

    // Load logo metadata to resize it relative to the target image
    const logoMetadata = await sharp(LOGO_PATH).metadata();

    for (const img of IMAGES) {
        const inputPath = path.join(ARTIFACTS_DIR, img.path);
        const outputPath = path.join(ARTIFACTS_DIR, `branded_${img.name}.png`);

        if (!fs.existsSync(inputPath)) {
            console.error(`Input image not found: ${inputPath}`);
            continue;
        }

        try {
            const imageMetadata = await sharp(inputPath).metadata();
            const targetWidth = Math.round(imageMetadata.width * 0.25); // Logo is 25% of image width

            // Resize logo
            const resizedLogoBuffer = await sharp(LOGO_PATH)
                .resize({ width: targetWidth })
                .toBuffer();

            // Composite
            await sharp(inputPath)
                .composite([{
                    input: resizedLogoBuffer,
                    gravity: 'southeast', // Bottom right
                    blend: 'over'
                    // We might need to add padding/offset manually if gravity puts it too close to edge
                    // But sharp's gravity is usually right at the edge. 
                    // Let's add top/left transparent padding to the logo? Or use top/left positioning.
                }])
                .toFile(outputPath);

            console.log(`Created: ${outputPath}`);

        } catch (error) {
            console.error(`Error processing ${img.name}:`, error);
        }
    }
}

overlayLogo();
