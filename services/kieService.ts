// Backend API Base URL (Relative for Nginx to proxy)
const BACKEND_API = '/api';

/**
 * Uploads an image to the backend
 */
export async function uploadImage(file: File): Promise<string> {
  const formData = new FormData();
  formData.append('image', file);

  const res = await fetch(`${BACKEND_API}/upload`, {
    method: 'POST',
    body: formData
  });

  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Image upload failed: ${txt}`);
  }
  const data = await res.json();
  return data.url;
}

/**
 * Enhance prompt using DeepSeek
 */
export async function enhancePrompt(prompt: string, attributes?: any, type: 'product' | 'ad' = 'product'): Promise<string> {
  const res = await fetch(`${BACKEND_API}/enhance`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt, attributes, type })
  });

  if (!res.ok) {
    console.warn("Enhancement failed, using original prompt");
    return prompt;
  }

  const data = await res.json();
  return data.enhanced || prompt;
}

/**
 * Creates a generation task via Backend (Image-to-Image only)
 */
export async function createGenerationTask(
  prompt: string,
  attributes: {
    length?: string;
    shape?: string;
    color?: string;
    model?: string;
    refImage: string; // REQUIRED now
    isAdMode?: string;
  },
  settings: {
    count: number;
    mode: 'single' | 'multi-model';
  }
): Promise<{ id: string; images: string[] }> {

  if (!attributes.refImage) {
    throw new Error("Reference image is required for all models");
  }

  const payload = {
    prompt,
    attributes,
    count: settings.count,
    mode: settings.mode
  };

  const res = await fetch(`${BACKEND_API}/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "Generation failed");
  }

  const data = await res.json();
  return { id: data.id, images: data.images };
}

/**
 * Fetch generation history
 */
export async function fetchHistory(): Promise<any[]> {
  const res = await fetch(`${BACKEND_API}/history`);
  if (!res.ok) {
    throw new Error("Failed to fetch history");
  }
  return await res.json();
}

// Legacy exports for compatibility
export async function createKieTask(): Promise<string> {
  throw new Error("Direct KIE calls deprecated. Use createGenerationTask.");
}

export async function pollKieTask(): Promise<string[]> {
  return [];
}

/**
 * Fetch image blob, handling CORS via proxy if needed
 */
export const fetchRemoteImage = async (url: string): Promise<Blob> => {
  try {
    // Try direct fetch first
    const res = await fetch(url);
    if (!res.ok) throw new Error("Direct fetch failed");
    return await res.blob();
  } catch (e) {
    console.warn("Direct fetch failed (CORS?), using proxy...", e);
    // Fallback to proxy
    const proxyRes = await fetch(`/api/proxy-image?url=${encodeURIComponent(url)}`);
    if (!proxyRes.ok) throw new Error("Proxy fetch failed");
    return await proxyRes.blob();
  }
};
