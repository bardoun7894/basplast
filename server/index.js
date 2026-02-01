const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { PrismaClient } = require('@prisma/client');
const {
    generateMultiModel,
    generateSingleModel,
    enhancePromptWithDeepSeek,
    getCredits,
    MODELS,
    MODEL_LABELS
} = require('./kieClient');
const { compositeAd, saveCompositedImage } = require('./utils/imageCompositor');

const app = express();
const prisma = new PrismaClient();
const port = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/public', express.static(path.join(__dirname, 'public')));

// Storage for Image Uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path.join(__dirname, 'uploads');
        if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        cb(null, `${Date.now()}-${Math.round(Math.random() * 1E9)}${ext}`);
    }
});
const upload = multer({ storage });

// Health Check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date() });
});

// Get KIE API Credits
app.get('/api/credits', async (req, res) => {
    try {
        const credits = await getCredits();
        res.json({ credits: credits, timestamp: new Date() });
    } catch (e) {
        res.status(500).json({ error: e.message, credits: null });
    }
});

// Get available models
app.get('/api/models', (req, res) => {
    const models = Object.entries(MODELS).map(([key, value]) => ({
        id: value,
        name: MODEL_LABELS[value] || key,
        type: 'image-to-image'
    }));
    res.json(models);
});

// Upload Endpoint
app.post('/api/upload', upload.single('image'), (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    const host = process.env.PUBLIC_HOST || '184.174.37.148';
    const protocol = process.env.PUBLIC_PROTOCOL || 'http';
    const fileUrl = `${protocol}://${host}/uploads/${req.file.filename}`;

    res.json({ filename: req.file.filename, url: fileUrl, path: req.file.path });
});

// Enhance prompt with DeepSeek
app.post('/api/enhance', async (req, res) => {
    const { prompt, attributes, type = 'product' } = req.body;

    if (!prompt) {
        return res.status(400).json({ error: 'Prompt is required' });
    }

    try {
        const enhanced = await enhancePromptWithDeepSeek(prompt, attributes, type);
        res.json({ original: prompt, enhanced });
    } catch (e) {
        console.error("Enhance Error:", e);
        res.status(500).json({ error: e.message, enhanced: prompt });
    }
});

// Generate Endpoint (ALL models require image input now)
app.post('/api/generate', async (req, res) => {
    const { prompt, attributes, count = 1, mode = 'single' } = req.body;

    // Validate reference image is provided
    if (!attributes?.refImage) {
        return res.status(400).json({
            error: 'Reference image is required. Please upload an image first.',
            field: 'refImage'
        });
    }

    // Logo Injection for Ads - Simplified (bp.png + saudi_made.png)
    let extraImages = [];
    if (attributes?.isAdMode === "true" || attributes?.isAdMode === true) {
        try {
            const host = process.env.PUBLIC_HOST || '184.174.37.148';
            const protocol = process.env.PUBLIC_PROTOCOL || 'http';
            const baseUrl = `${protocol}://${host}`;

            // 1. BasPlast Logo (bp.png)
            // STOPPED INJECTION TO AI: We use Post-Processing now.
            // const bpLogoPath = path.join(__dirname, 'public', 'bp.png');
            // if (fs.existsSync(bpLogoPath)) {
            //    extraImages.push(`${baseUrl}/public/bp.png`);
            // }

            // 2. Saudi Made Badge (saudi_made.png)
            // STOPPED INJECTION TO AI: We use Post-Processing now.
            // const saudiMadePath = path.join(__dirname, '..', 'saudi_made.png');
            // if (fs.existsSync(saudiMadePath)) {
            //    extraImages.push(`${baseUrl}/saudi_made.png`);
            // }
        } catch (e) {
            console.error("Failed to inject logos:", e);
        }
    }

    try {
        let results = [];

        // Create DB Record
        const generationRecord = await prisma.generation.create({
            data: {
                prompt,
                model: mode === 'multi-model' ? 'ALL' : (attributes.model || 'auto'),
                length: attributes.length || '',
                shape: attributes.shape || '',
                decoration: attributes.decoration || '',
                color: attributes.color || '',
                refImage: attributes.refImage,
                status: 'processing'
            }
        });

        if (mode === 'multi-model') {
            // Generate with ALL models in parallel
            const modelResults = await generateMultiModel(prompt, attributes.refImage);
            modelResults.forEach(r => {
                if (r.urls) results.push(...r.urls);
            });
        } else {
            // Single model generation
            // Updated to pass logoBase64
            const selectedModel = attributes.model || MODELS.SEEDREAM_EDIT;
            const loops = Math.max(1, Math.min(count, 4));

            const promises = [];
            for (let i = 0; i < loops; i++) {
                promises.push(generateSingleModel(selectedModel, prompt, attributes.refImage, extraImages));
            }

            const loopResults = await Promise.all(promises);
            loopResults.forEach(urls => results.push(...urls));
        }


        // POST-PROCESSING: Add logo overlays for Ad Mode (Sharp)
        if (attributes?.isAdMode === "true" || attributes?.isAdMode === true) {
            console.log('🎨 Starting Ad post-processing (Sharp)...');
            const host = process.env.PUBLIC_HOST || '184.174.37.148';
            const protocol = process.env.PUBLIC_PROTOCOL || 'http';
            const baseUrl = `${protocol}://${host}`;

            const compositedResults = [];
            for (const imageUrl of results) {
                try {
                    const compositedBuffer = await compositeAd(imageUrl, {
                        productName: attributes.productName || null,
                        productId: `BAS-${Date.now().toString(36).toUpperCase().slice(-4)}`
                    });
                    const newUrl = await saveCompositedImage(compositedBuffer, baseUrl);
                    compositedResults.push(newUrl);
                    console.log(`✅ Composited: ${newUrl}`);
                } catch (compErr) {
                    console.error('⚠️ Compositing failed, using original:', compErr.message);
                    compositedResults.push(imageUrl); // Fallback to original
                }
            }
            results = compositedResults;
        }

        // Update DB with results
        await prisma.generation.update({
            where: { id: generationRecord.id },
            data: {
                images: results,
                status: results.length > 0 ? 'success' : 'failed'
            }
        });

        res.json({
            success: true,
            images: results,
            id: generationRecord.id,
            count: results.length
        });

    } catch (e) {
        console.error("Generation Error:", e);
        res.status(500).json({ error: e.message });
    }
});

// History/Catalog Endpoint
app.get('/api/history', async (req, res) => {
    try {
        const history = await prisma.generation.findMany({
            orderBy: { createdAt: 'desc' },
            take: 100
        });
        res.json(history);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// Single generation detail
app.get('/api/history/:id', async (req, res) => {
    try {
        const record = await prisma.generation.findUnique({
            where: { id: req.params.id }
        });
        if (!record) {
            return res.status(404).json({ error: 'Generation not found' });
        }
        res.json(record);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// Image Proxy to bypass CORS
app.get('/api/proxy-image', async (req, res) => {
    const { url } = req.query;
    if (!url) return res.status(400).send('URL required');
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`Failed to fetch image: ${response.statusText}`);
        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const contentType = response.headers.get('content-type') || 'image/jpeg';
        res.setHeader('Content-Type', contentType);
        res.send(buffer);
    } catch (e) {
        console.error("Proxy Error:", e);
        res.status(500).send(e.message);
    }
});

app.listen(port, () => {
    console.log(`Backend running on port ${port}`);
});
