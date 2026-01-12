/**
 * Image Compositor Utility
 * Adds logo overlays and text to generated images using Sharp
 */
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

// Logo paths - Corrected layout
const LOGOS = {
    BP_LOGO: path.join(__dirname, '..', 'public', 'bp.png'),              // Top-Left
    SAUDI_MADE: path.join(__dirname, '..', 'public', 'saudi_made.png'),   // Top-Right
    BAS_ATELIER: path.join(__dirname, '..', 'public', 'bas_atelier_logo_white.png') // Bottom
};

/**
 * Download image from URL and return buffer
 */
async function downloadImage(url) {
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const arrayBuffer = await response.arrayBuffer();
        return Buffer.from(arrayBuffer);
    } catch (e) {
        console.error(`Failed to download image: ${url}`, e);
        throw e;
    }
}

/**
 * Resize logo to fit within specified dimensions while maintaining aspect ratio
 */
async function resizeLogo(logoPath, maxWidth, maxHeight) {
    try {
        const resized = await sharp(logoPath)
            .resize(maxWidth, maxHeight, { fit: 'inside', withoutEnlargement: true })
            .toBuffer();
        return resized;
    } catch (e) {
        console.error(`Failed to resize logo: ${logoPath}`, e);
        throw e;
    }
}

/**
 * Add logo overlays and optional product name to an image
 * @param {string} imageUrl - URL of the generated image
 * @param {object} options - Overlay options
 * @param {string} options.productName - Product name to display
 * @param {string} options.productId - Product ID to display
 * @returns {Promise<Buffer>} - Composited image buffer
 */
async function compositeAd(imageUrl, options = {}) {
    const { productName, productId } = options;

    console.log('🎨 Starting image compositing...');

    // Download the generated image
    const imageBuffer = await downloadImage(imageUrl);
    const metadata = await sharp(imageBuffer).metadata();
    const { width, height } = metadata;

    console.log(`📐 Image dimensions: ${width}x${height}`);

    // Calculate logo sizes (proportional to image)
    const logoMaxWidth = Math.round(width * 0.15); // 15% of width
    const logoMaxHeight = Math.round(height * 0.10); // 10% of height
    const badgeMaxWidth = Math.round(width * 0.18); // 18% of width (enlarged)
    const badgeMaxHeight = Math.round(height * 0.12); // 12% of height (enlarged)
    const bottomLogoMaxWidth = Math.round(width * 0.20); // 20% of width for bottom logo
    const bottomLogoMaxHeight = Math.round(height * 0.08); // 8% of height

    // Prepare composite layers
    const composites = [];

    // 1. BP Logo (Top-Left)
    if (fs.existsSync(LOGOS.BP_LOGO)) {
        const bpLogo = await resizeLogo(LOGOS.BP_LOGO, logoMaxWidth, logoMaxHeight);
        composites.push({
            input: bpLogo,
            top: Math.round(height * 0.03), // 3% from top
            left: Math.round(width * 0.03), // 3% from left
        });
        console.log('✅ BP Logo added (top-left)');
    } else {
        console.warn('⚠️ BP Logo not found:', LOGOS.BP_LOGO);
    }

    // 2. Saudi Made Badge (Top-Right)
    if (fs.existsSync(LOGOS.SAUDI_MADE)) {
        const badge = await resizeLogo(LOGOS.SAUDI_MADE, badgeMaxWidth, badgeMaxHeight);
        const badgeMeta = await sharp(badge).metadata();
        composites.push({
            input: badge,
            top: Math.round(height * 0.03), // 3% from top
            left: width - badgeMeta.width - Math.round(width * 0.03), // 3% from right
        });
        console.log('✅ Saudi Made badge added (top-right)');
    } else {
        console.warn('⚠️ Saudi Made badge not found:', LOGOS.SAUDI_MADE);
    }

    // Bas Atelier Logo removed from bottom - it's now only on the product body (AI-generated)

    // Product Name + ID removed - NanoBanana will generate this in the image directly

    // Apply all composites
    const result = await sharp(imageBuffer)
        .composite(composites)
        .png({ quality: 95 })
        .toBuffer();

    console.log('🎉 Image compositing complete!');
    return result;
}

/**
 * Save composited image to uploads folder and return URL
 */
async function saveCompositedImage(buffer, baseUrl) {
    const filename = `ad_${Date.now()}.png`;
    const uploadsDir = path.join(__dirname, '..', 'uploads');

    // Ensure uploads dir exists
    if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const filepath = path.join(uploadsDir, filename);
    await sharp(buffer).toFile(filepath);

    console.log(`💾 Saved composited image: ${filepath}`);
    return `${baseUrl}/uploads/${filename}`;
}

module.exports = {
    compositeAd,
    saveCompositedImage,
    downloadImage,
    LOGOS
};
