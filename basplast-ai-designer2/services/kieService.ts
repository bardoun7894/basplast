
const KIE_API_BASE = 'https://api.kie.ai/api/v1/jobs';
const API_KEY = import.meta.env.VITE_KIE_API_KEY || '';

export interface KieTaskResponse {
  code: number;
  msg: string;
  data: {
    taskId: string;
    state?: string;
    resultJson?: string;
  };
}

/**
 * Premium System Prompt for BasPlast
 */
const SYSTEM_PROMPT = `
You are the Lead Industrial Designer for BasPlast, a premium brand known for elegant, durable thermos products (dallahs, jugs).
Your goal is to interpret user requests into highly detailed, photorealistic image generation prompts.

BRAND DNA:
- **Aesthetic**: Modern Islamic Luxury, Minimalist Elegance, or Traditional Royal.
- **Materials**: High-gloss injected plastic (PP/ABS), brushed stainless steel, gold/rose-gold plating (PVD), glass liners.
- **Photography**: Studio product shot, 85mm lens, softbox lighting, clean gradient background (white/grey/warm-beige), sharp focus.

INSTRUCTIONS:
1. **Analyze** the user's intent. If they say "classic", think traditional Arabic coffee pots. If "modern", think sleek cylinders.
2. **Enhance** with technical details: Mention "ergonomic handle", "precision spout", "leak-proof lid".
3. **Lighting**: Ensure the lighting highlights the material textures (reflections on gold, matte finish on plastic).
4. **Composition**: Center the product. 45-degree angle or front profile.
`.trim();

/**
 * Constructs the complex prompt to send to KIE.ai
 */
function buildComplexPrompt(userPrompt: string, attributes: { length?: string; shape?: string; color?: string }): string {
  let details = [];

  // Attribute Injection
  if (attributes.length) details.push(`Size/Capacity: ${attributes.length} (Standard hospitality volume)`);
  if (attributes.shape) details.push(`Form Factor: ${attributes.shape} silhouette.`);
  if (attributes.color) details.push(`Primary Colorway: ${attributes.color} with complementary accents.`);

  // Combine
  return `
${SYSTEM_PROMPT}

USER REQUEST: "${userPrompt}"

SPECIFICATIONS:
${details.join('\n')}

OUTPUT IMAGE STYLE:
Photorealistic, 8k, Unreal Engine 5 render style, commercial product photography, ultra-detailed.
`.trim();
}

/**
 * Creates a generation task on KIE.ai
 */
export async function createKieTask(
  prompt: string,
  attributes: { length?: string; shape?: string; color?: string },
  refImageBase64?: string
): Promise<string> {

  if (!API_KEY) throw new Error("Missing VITE_KIE_API_KEY");

  const fullPrompt = buildComplexPrompt(prompt, attributes);

  const payload: any = {
    model: "gpt-image/1.5-image-to-image",
    input: {
      prompt: fullPrompt,
      aspect_ratio: "3:4",
      quality: "high",
      negative_prompt: "text, watermark, logo, blurry, distorted, low quality, cartoon, illustration"
    }
  };

  const res = await fetch(`${KIE_API_BASE}/createTask`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${API_KEY}`
    },
    body: JSON.stringify(payload)
  });

  const data: KieTaskResponse = await res.json();

  if (data.code !== 200) {
    throw new Error(`KIE Creation Failed: ${data.msg} (${JSON.stringify(data)})`);
  }

  return data.data.taskId;
}

/**
 * Polls the task status until success or failure
 */
export async function pollKieTask(taskId: string): Promise<string[]> {
  if (!API_KEY) throw new Error("Missing VITE_KIE_API_KEY");

  const maxAttempts = 30; // 30 * 2s = 60s timeout
  for (let attempts = 0; attempts < maxAttempts; attempts++) {
    const res = await fetch(`${KIE_API_BASE}/recordInfo?taskId=${taskId}`, {
      headers: {
        'Authorization': `Bearer ${API_KEY}`
      }
    });

    const data: KieTaskResponse = await res.json();
    const state = data.data.state;

    if (state === 'success') {
      // Parse result
      let results: string[] = [];
      if (data.data.resultJson) {
        try {
          // Handle double encoded JSON if necessary, or direct object
          const parsed = typeof data.data.resultJson === 'string'
            ? JSON.parse(data.data.resultJson)
            : data.data.resultJson;

          if (parsed.resultUrls && Array.isArray(parsed.resultUrls)) {
            results = parsed.resultUrls;
          }
        } catch (e) {
          console.error("JSON Parse error", e);
        }
      }
      return results;
    }

    if (state === 'fail') {
      throw new Error("Task failed during processing.");
    }

    // Wait 2s
    await new Promise(r => setTimeout(r, 2000));
  }

  throw new Error("Polling timed out.");
}

/**
 * Uses KIE (GPT-4o) to enhance the user's prompt before generation
 */
export async function enhancePrompt(
  prompt: string,
  attributes: { length?: string; shape?: string },
  refDesc?: string
): Promise<string> {
  if (!API_KEY) throw new Error("Missing VITE_KIE_API_KEY");

  const systemInstruction = `
    You are an expert industrial designer for BasPlast. 
    Enhance the user's short prompt into a professional, descriptive image generation prompt.
    Keep the language the same as the input (Arabic if Arabic, English if English).
    Focus on: ${attributes.shape || 'elegant'} shape, ${attributes.length || 'standard'} size.
    ${refDesc ? `Maintain the structure: ${refDesc}` : ''}
    Output ONLY the enhanced prompt text.
  `.trim();

  const payload = {
    model: "gpt-4o",
    input: {
      messages: [
        { role: "system", content: systemInstruction },
        { role: "user", content: prompt || "Design a premium thermos" }
      ]
    }
  };

  const res = await fetch(`${KIE_API_BASE}/createTask`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${API_KEY}`
    },
    body: JSON.stringify(payload)
  });

  const data = await res.json();
  if (data.code !== 200) throw new Error("Enhancement failed");

  return await pollTextResult(data.data.taskId);
}

async function pollTextResult(taskId: string): Promise<string> {
  const maxAttempts = 10;
  for (let i = 0; i < maxAttempts; i++) {
    const res = await fetch(`${KIE_API_BASE}/recordInfo?taskId=${taskId}`, {
      headers: { 'Authorization': `Bearer ${API_KEY}` }
    });
    const data = await res.json();
    if (data.data.state === 'success') {
      return data.data.resultJson || "";
    }
    await new Promise(r => setTimeout(r, 1500));
  }
  return "";
}
