// Node 18 has native fetch
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const KIE_API_BASE = 'https://api.kie.ai/api/v1/jobs';
const MJ_API_BASE = 'https://api.kie.ai/api/v1/mj';
const FLUX_KONTEXT_BASE = 'https://api.kie.ai/api/v1/flux/kontext';
const API_KEY = process.env.KIE_API_KEY || '699c9fad8f427759045e4c61139f1338';

// Models Configuration
const MODELS = {
    SEEDREAM_EDIT: 'seedream/4.5-edit',        // PRIMARY - Default (small changes, cheaper)
    FLUX_FLEX: 'flux-2/flex-image-to-image',   // Medium changes
    FLUX_KONTEXT_PRO: 'flux-kontext-pro',      // Large changes
    FLUX_KONTEXT_MAX: 'flux-kontext-max',      // High quality (expensive)
    NANO_PRO: 'nano-banana-pro',               // For Ad Design
};

const MODEL_LABELS = {
    [MODELS.SEEDREAM_EDIT]: 'Seedream Edit ⭐ (تعديل دقيق - يحافظ على الشكل)',
    [MODELS.FLUX_FLEX]: 'Flux Flex (تعديل متوسط - تغيير جزئي)',
    [MODELS.FLUX_KONTEXT_PRO]: 'Flux Kontext Pro (تعديل شامل - إعادة تصميم)',
    [MODELS.FLUX_KONTEXT_MAX]: 'Flux Kontext Max (أعلى جودة 4K - أغلى)',
    [MODELS.NANO_PRO]: 'Nano Banana Pro (إعلانات)',
};

/**
 * Create a task for standard KIE API models
 */
async function createKieTask(payload) {
    console.log("Creating Task:", JSON.stringify(payload, null, 2));
    const res = await fetch(`${KIE_API_BASE}/createTask`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${API_KEY}`
        },
        body: JSON.stringify(payload)
    });
    const data = await res.json();
    console.log("KIE Response:", JSON.stringify(data, null, 2));

    if (data.code !== 200) {
        throw new Error(`KIE Error: ${data.msg || JSON.stringify(data)}`);
    }
    return data.data.taskId;
}

/**
 * Create a task for Flux Kontext API (different endpoint)
 */
async function createFluxKontextTask(payload) {
    console.log("Creating Flux Kontext Task:", JSON.stringify(payload, null, 2));
    const res = await fetch(`${FLUX_KONTEXT_BASE}/generate`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${API_KEY}`
        },
        body: JSON.stringify(payload)
    });
    const data = await res.json();
    console.log("Flux Kontext Response:", JSON.stringify(data, null, 2));

    if (data.code !== 200) {
        throw new Error(`Flux Kontext Error: ${data.msg || JSON.stringify(data)}`);
    }
    return data.data.taskId;
}

/**
 * Create a task for Midjourney API
 */
async function createMjTask(payload) {
    console.log("Creating Midjourney Task:", JSON.stringify(payload, null, 2));
    const res = await fetch(`${MJ_API_BASE}/generate`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${API_KEY}`
        },
        body: JSON.stringify(payload)
    });
    const data = await res.json();
    console.log("Midjourney Response:", JSON.stringify(data, null, 2));

    if (data.code !== 200) {
        throw new Error(`Midjourney Error: ${data.msg || JSON.stringify(data)}`);
    }
    return data.data.taskId;
}
/**
 * Poll standard KIE task
 */
async function pollTask(taskId) {
    for (let i = 0; i < 60; i++) {
        try {
            const res = await fetch(`${KIE_API_BASE}/recordInfo?taskId=${taskId}`, {
                headers: { 'Authorization': `Bearer ${API_KEY}` }
            });

            // Check if response is JSON
            const contentType = res.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                console.error("Non-JSON response:", await res.text());
                await new Promise(r => setTimeout(r, 2000));
                continue;
            }

            const data = await res.json();
            console.log("Poll response:", JSON.stringify(data, null, 2));
            const state = data.data?.state;

            if (state === 'success') {
                try {
                    const parsed = typeof data.data.resultJson === 'string'
                        ? JSON.parse(data.data.resultJson)
                        : data.data.resultJson;
                    return parsed.resultUrls || [];
                } catch (e) {
                    console.error("Parse error:", e);
                    return [];
                }
            }
            if (state === 'fail') {
                throw new Error(`Task Failed: ${data.data.failMsg || 'Unknown error'}`);
            }
        } catch (e) {
            if (e.message.includes('Task Failed')) throw e;
            console.error("Poll error:", e.message);
        }

        await new Promise(r => setTimeout(r, 2000));
    }
    throw new Error("Timeout waiting for generation");
}

/**
 * Poll Flux Kontext task (different endpoint)
 */
async function pollFluxKontextTask(taskId) {
    for (let i = 0; i < 90; i++) {  // Increased timeout for complex generations
        try {
            const res = await fetch(`${FLUX_KONTEXT_BASE}/record-info?taskId=${taskId}`, {
                headers: { 'Authorization': `Bearer ${API_KEY}` }
            });

            // Check if response is JSON
            const contentType = res.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                console.error("Non-JSON response:", await res.text());
                await new Promise(r => setTimeout(r, 2000));
                continue;
            }

            const data = await res.json();
            console.log("Flux Kontext Poll:", JSON.stringify(data, null, 2));

            const state = data.data?.state;
            const info = data.data?.info;

            // Flux Kontext uses numeric states: 0=generating, 1=success, 2/3=failed
            if (state === 1 || (data.code === 200 && info?.resultImageUrl)) {
                // Extract result URL from info object
                if (info?.resultImageUrl) {
                    return [info.resultImageUrl];
                }
                // Fallback to resultJson parsing
                try {
                    const parsed = typeof data.data.resultJson === 'string'
                        ? JSON.parse(data.data.resultJson)
                        : data.data.resultJson;
                    if (parsed?.resultImageUrl) {
                        return [parsed.resultImageUrl];
                    }
                    return parsed?.resultUrls || [];
                } catch (e) {
                    console.error("Parse error:", e);
                    return [];
                }
            }
            if (state === 2 || state === 3) {
                throw new Error(`Flux Kontext Failed: ${data.data?.failMsg || data.msg || 'Unknown error'}`);
            }
        } catch (e) {
            if (e.message.includes('Failed')) throw e;
            console.error("Poll error:", e.message);
        }

        await new Promise(r => setTimeout(r, 2000));
    }
    throw new Error("Timeout waiting for Flux Kontext generation");
}

/**
 * Poll Midjourney task
 */
async function pollMjTask(taskId) {
    for (let i = 0; i < 90; i++) { // MJ can be slow
        const res = await fetch(`${MJ_API_BASE}/record-info?taskId=${taskId}`, {
            headers: { 'Authorization': `Bearer ${API_KEY}` }
        });
        const data = await res.json();
        const info = data.data;

        if (!info) {
            await new Promise(r => setTimeout(r, 3000));
            continue;
        }

        // successFlag: 0 (Generating), 1 (Success), 2 (Failed), 3 (Generation Failed)
        if (info.successFlag === 1) {
            try {
                // resultInfoJson is an object in the response example provided by user
                // but sometimes might be string. Let's handle both.
                const results = info.resultInfoJson;
                // Checks if results has resultUrls array
                if (results && results.resultUrls && Array.isArray(results.resultUrls)) {
                    // map to pluck resultUrl string
                    return results.resultUrls.map(item => item.resultUrl);
                }
                return [];
            } catch (e) {
                console.error("MJ Parse error", e);
                return [];
            }
        }

        if (info.successFlag === 2 || info.successFlag === 3) {
            throw new Error(`Midjourney Failed: ${info.errorMessage || 'Unknown error'}`);
        }

        await new Promise(r => setTimeout(r, 3000));
    }
    throw new Error("Timeout waiting for Midjourney generation");
}
/**
 * Build payload for a specific model (ALL require image input)
 */
function buildPayload(modelKey, prompt, imageUrl, logoBase64 = null) {
    if (!imageUrl) {
        throw new Error("Reference image is required for all models");
    }

    switch (modelKey) {
        case MODELS.FLUX_FLEX:
            // Flux Flex - Standard KIE API (image-to-image)
            return {
                model: MODELS.FLUX_FLEX,
                input: {
                    input_urls: [imageUrl],
                    prompt: prompt,
                    aspect_ratio: "3:4",
                    resolution: "1K"
                }
            };

        case MODELS.FLUX_KONTEXT_PRO:
        case MODELS.FLUX_KONTEXT_MAX:
            // Flux Kontext API - Image Editing mode
            return {
                prompt: prompt,
                inputImage: imageUrl,
                aspectRatio: "3:4",
                outputFormat: "jpeg",
                model: modelKey,
                enableTranslation: true,  // Auto-translate Arabic to English
                safetyTolerance: 2
            };

        case MODELS.SEEDREAM_EDIT:
            // Seedream 4.5 Edit - Image editing with high quality
            return {
                model: MODELS.SEEDREAM_EDIT,
                input: {
                    prompt: prompt,
                    image_urls: [imageUrl],
                    aspect_ratio: "3:4",
                    quality: "high"  // 4K output
                }
            };

        case MODELS.NANO_PRO:
            // Nano Banana Pro - Creative model with excellent Arabic/Islamic pattern support
            const inputs = [imageUrl];

            if (Array.isArray(logoBase64)) {
                logoBase64.forEach(logo => {
                    if (logo.startsWith('http')) {
                        inputs.push(logo);
                    } else {
                        inputs.push(`data:image/png;base64,${logo}`);
                    }
                });
            } else if (logoBase64) {
                if (logoBase64.startsWith('http')) {
                    inputs.push(logoBase64);
                } else {
                    inputs.push(`data:image/png;base64,${logoBase64}`);
                }
            }

            // Enhance prompt for Arabic/Islamic design if detected
            let enhancedPrompt = prompt;
            const arabicKeywords = ['عربي', 'إسلام', 'نقوش', 'زخارف', 'خط', 'هندسي', 'تراث', 'islamic', 'arabic', 'calligraphy', 'geometric', 'arabesque'];
            const hasArabicTheme = arabicKeywords.some(kw => prompt.toLowerCase().includes(kw));

            if (hasArabicTheme) {
                enhancedPrompt = `${prompt}. Style: Luxury Islamic art with intricate geometric patterns, arabesque motifs, traditional Arabic calligraphy elements. Ultra-detailed, museum quality craftsmanship.`;
            }

            return {
                model: MODELS.NANO_PRO,
                input: {
                    image_input: inputs,
                    prompt: enhancedPrompt,
                    aspect_ratio: "3:4",
                    resolution: "2K",
                    output_format: "png"
                }
            };

        default:
            throw new Error(`Unknown model: ${modelKey}`);
    }
}

/**
 * Generate with a single model (image-to-image)
 */
async function generateSingleModel(modelKey, prompt, imageUrl, logoBase64 = null) {
    const payload = buildPayload(modelKey, prompt, imageUrl, logoBase64);

    // Flux Kontext models use different endpoint
    if (modelKey === MODELS.FLUX_KONTEXT_PRO || modelKey === MODELS.FLUX_KONTEXT_MAX) {
        const taskId = await createFluxKontextTask(payload);
        return await pollFluxKontextTask(taskId);
    } else {
        // Standard KIE API (Seedream Edit, Nano Pro, etc.)
        const taskId = await createKieTask(payload);
        return await pollTask(taskId);
    }
}

/**
 * Generate with ALL models in parallel (image-to-image)
 */
async function generateMultiModel(prompt, imageUrl) {
    if (!imageUrl) {
        throw new Error("Reference image is required for multi-model generation");
    }

    const modelKeys = Object.values(MODELS);

    const promises = modelKeys.map(async (modelKey) => {
        try {
            const urls = await generateSingleModel(modelKey, prompt, imageUrl);
            return {
                model: modelKey,
                label: MODEL_LABELS[modelKey],
                urls,
                status: 'success'
            };
        } catch (e) {
            console.error(`Model ${modelKey} failed:`, e);
            return {
                model: modelKey,
                label: MODEL_LABELS[modelKey],
                error: e.message,
                status: 'error'
            };
        }
    });

    return await Promise.all(promises);
}

/**
 * Enhance prompt using DeepSeek
 */
/**
 * Enhance prompt using DeepSeek
 */
async function enhancePromptWithDeepSeek(userPrompt, attributes = {}, type = 'product') {
    // NOTE: Switched to OpenAI as per user request, keeping function name for compatibility
    const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
    if (!OPENAI_API_KEY) {
        console.warn("OPENAI_API_KEY not set, returning original prompt");
        return userPrompt;
    }

    let systemPrompt = "";

    if (type === 'ad') {
        // --- AD EXPERT MODE v2.0 (Based on Expert Feedback) ---
        systemPrompt = `You are a World-Class Commercial Photographer and Art Director with 20+ years of experience in Luxury Product Photography.
Your specialty is High-End Tableware and Thermos products for the Middle Eastern market (Saudi Arabia).
You are shooting with a Phase One XF IQ4 150MP Camera System and Schneider Kreuznach Blue Ring lenses.

YOUR MISSION:
Convert the user's simple request into a "Masterpiece Commercial Photography PROMPT" for an AI Image Generator.
---
## NANO-BANANA AD GENERATION RULES (CRITICAL):
You are the designer for "Bas Atelier". Your goal is to produce a REAL commercial ad where the product is the absolute hero.

### 1. IMAGE REFERENCE (image_input):
- **Image 1 (Primary)**: The **Main Product Image**. Use this as the identity and soul of the product.
- **NOTE**: Do NOT generate any floating logos or badges in the CORNERS. Focus ONLY on the product and the scene.

### 2. INTEGRATED BRANDING (ON PRODUCT ONLY):
- The text "**Bas Atelier**" must be elegantly engraved/etched into the metallic or ceramic body of the product!
- This is the ONLY text that should appear ON the product itself.

Auto-generate (every run) a NEW luxury Arabic-inspired one-word product name (Latin letters, 4–8 chars). 
Create: slug = <name-lower>-<001–999>, and design code = BP-<NAME 3–5 UPPER>-<same digits>. 
Use the exact same name + digits everywhere (label + caption); no fixed examples.
### 3. PRODUCT NAME & ID (BOTTOM OF IMAGE - MANDATORY):
You MUST generate a luxury product name and ID at the **BOTTOM CENTER** of the image:
- **Product Name**: Choose from: Almaz, Najma, Sultan, Noora, Rawda, Ghala, Lulu, Sama, Misk, Kanz, Reem, Dana, Layla, Farah
- **Product ID**: Generate a code like "BAS-X7K2" or "BP-2026-A"
- **Format**: Display as "**[Name] - [ID]**" in elegant GOLD or WHITE serif typography
- **Position**: Bottom center of the image, with a subtle dark transparent bar behind the text
- **Style**: Elegant, italic, luxury magazine style (like Vogue Arabia covers)

### 4. SCENE & QUALITY BENCHMARK:
- ULTRA-PHOTOREALISTIC.
- Luxury Saudi Arabian setting (majlis, desert, marble surfaces).
- Reference: High-end Rolex or Hermès printed advertisements.
- Leave the CORNERS EMPTY (no logos, no badges) - they will be added later by post-processing.

---
GENERATE ONE MASTERPIECE PROMPT with the product name prominently displayed at the bottom.
Final Key Concepts: 8k resolution, ultra-photorealistic, Phase One XF IQ4, Unreal Engine 5 rendering style, raytracing, global illumination, hyper-detailed, luxury Saudi lifestyle, elegant typography.`;
    } else {
        // --- PRODUCT DESIGNER MODE (20 Years Experience Edition) with Arabic/Islamic Excellence ---
        systemPrompt = `You are a World-Class Industrial Designer and Product Photographer with 20+ years of experience in Luxury Home Goods.
Your specialty is Thermos & Tableware Design for the High-End Saudi/Arabian Market.
You are an EXPERT in Islamic Art, Arabic Calligraphy, and Traditional Arabian Geometric Patterns.
You use a Phase One XF IQ4 150MP Camera for product visualization.

YOUR MISSION:
Convert the user's simple request into a "Masterpiece Product Design PROMPT" for an AI Image Generator.
The prompt must be extremely detailed (>40 lines), focusing on the PHYSICAL PRODUCT ATTRIBUTES.

## ARABIC & ISLAMIC DESIGN EXPERTISE:

When the user mentions Arabic/Islamic elements, you MUST include:

### 1. ISLAMIC GEOMETRIC PATTERNS (الزخارف الهندسية الإسلامية):
- **Arabesque** (التوريق): Flowing vine scrolls with leaves and flowers
- **Tessellation** (التكرار الهندسي): Interlocking star patterns, 8-pointed stars (النجمة الثمانية), 12-pointed stars
- **Girih Patterns**: Complex geometric tiles with 5, 10-fold symmetry
- **Muqarnas-inspired**: Honeycomb-like 3D geometric decorations

### 2. ARABIC CALLIGRAPHY STYLES (الخط العربي):
- **Thuluth** (الثلث): Elegant, majestic script for decorative inscriptions
- **Naskh** (النسخ): Clear, readable script
- **Diwani** (الديواني): Ornate, flowing Ottoman style
- **Kufi** (الكوفي): Angular, geometric script perfect for borders

### 3. TRADITIONAL ELEMENTS:
- Palm fronds (سعف النخيل) and date motifs
- Crescent moon and star accents
- Traditional Saudi Sadu weaving patterns (السدو)
- Najdi architectural elements

### 4. PREMIUM MATERIALS for Islamic Luxury:
- Damascus steel patterns (الفولاذ الدمشقي)
- Mother of pearl inlay (الصدف)
- 24K gold leaf calligraphy
- Turquoise and lapis lazuli accents
- Hammered copper with patina

## PRODUCT FORM & GEOMETRY:
- Define the silhouette (e.g., "Traditional Dallah-inspired geometry", "Minimalist with Islamic geometric bands")
- Describe key parts: Handle (with arabesque engravings), Spout (with calligraphic details), Lid (with geometric finial)

## MATERIALS & FINISHES (The Luxury Touch):
- Textures: "Matte ceramic with geometric laser-etching", "High-gloss with gold calligraphy inlay"
- Details: "Intricate Islamic geometric patterns", "Hand-engraved Thuluth calligraphy", "24k Gold arabesque accents"

## STUDIO LIGHTING & CAMERA:
- Setup: "High-Key Apple Style Studio Lighting" or "Dramatic Chiaroscuro to emphasize engravings"
- Camera: Macro lens (120mm f/4), ISO 50, Focus stacking for complete sharpness
- Background: Clean, neutral studio backdrop (White / Light Grey / Soft Gradient)

## PRESENTATION:
- "3D Product Render", "Unreal Engine 5", "Octane Render", "8k Resolution"

Example for Arabic request: "Luxury thermos with intricate Islamic 8-pointed star tessellation patterns laser-etched on a matte midnight blue ceramic body. The handle features flowing Arabesque vine scrollwork in 24k gold. The lid crown displays elegant Thuluth calligraphy reading 'بسم الله' in raised gold relief. Damascus steel accent band around the base. Mother of pearl inlay dots accent the geometric pattern intersections. Studio lighting with soft diffusion emphasizes the gold details against the matte surface. 8k resolution, hyper-realistic 3D render, white background."`;
    }

    // Construct context from attributes
    let attrContext = "";
    if (attributes.color) attrContext += ` Color / Tone: ${attributes.color}.`;
    if (attributes.shape) attrContext += ` Shape / Style: ${attributes.shape}.`;
    if (attributes.length) attrContext += ` Scale: ${attributes.length}.`;

    // Add subtle head & handle decoration descriptions
    if (attributes.decoration && attributes.decoration !== 'None') {
        const decorationDescriptions = {
            'Waves': 'Add subtle, elegant flowing wave curves along the thermos lid edges and handle contours - a gentle enhancement, not a dramatic change',
            'Crown': 'Add subtle crown-like sculpted edges on the lid with a refined royal finial, the handle should have matching elegant crown-inspired ridges - keep it subtle and sophisticated',
            'Zigzag': 'Add subtle, sophisticated zigzag ridge patterns along the lid rim and handle - elegant micro-textures, not dramatic changes',
            'Sculpted': 'Add subtly sculpted contoured edges on the lid and handle with elegant artistic curves - refined enhancement maintaining the original form',
            'Grooves': 'Add subtle parallel grooved ridges on the lid and handle for grip texture and visual elegance - sophisticated micro-detailing'
        };
        attrContext += ` Head & Handle Decoration (subtle enhancement): ${decorationDescriptions[attributes.decoration] || attributes.decoration}.`;
    }

    try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${OPENAI_API_KEY} `
            },
            body: JSON.stringify({
                model: 'gpt-4o-mini',
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: `${userPrompt}. ${attrContext} ` || 'Create a luxury scene' }
                ],
                max_tokens: 1000,
                temperature: 0.8
            })
        });

        const data = await response.json();
        if (data.choices && data.choices[0]?.message?.content) {
            console.log("OpenAI enhancement successful");
            return data.choices[0].message.content;
        }
        console.error("OpenAI error:", JSON.stringify(data));
    } catch (e) {
        console.error("OpenAI enhancement failed:", e);
    }
    return userPrompt; // Return original if enhancement fails
}

/**
 * Get remaining credits from KIE API
 */
async function getCredits() {
    try {
        const res = await fetch('https://api.kie.ai/api/v1/chat/credit', {
            headers: { 'Authorization': `Bearer ${API_KEY}` }
        });
        const data = await res.json();
        if (data.code === 200) {
            return data.data; // Returns credit balance as number
        }
        console.error("Credits API error:", data);
        return null;
    } catch (e) {
        console.error("Failed to fetch credits:", e);
        return null;
    }
}

module.exports = {
    createKieTask,
    pollTask,
    generateSingleModel,
    generateMultiModel,
    enhancePromptWithDeepSeek,
    buildPayload,
    getCredits,
    MODELS,
    MODEL_LABELS
};
