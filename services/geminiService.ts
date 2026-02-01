import { GoogleGenAI } from "@google/genai";
import { ThermosLength, ThermosShape } from "../types";

/**
 * Converts a File object to a Base64 string.
 */
export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      // Remove data URL prefix (e.g., "data:image/jpeg;base64,")
      const base64Data = result.split(',')[1];
      resolve(base64Data);
    };
    reader.onerror = error => reject(error);
  });
};

/**
 * First, if an image is provided, we use Gemini Flash to analyze it and extract style/features.
 */
export async function analyzeReferenceImage(base64Image: string): Promise<string> {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: 'image/jpeg', // Assuming jpeg/png generic handling
              data: base64Image
            }
          },
          {
            text: "Analyze the GEOMETRY and STRUCTURE of this thermos product. Describe the silhouette, handle placement, lid type, and proportions precisely. Ignore colors and patterns. Focus only on the physical 'Type' of the object."
          }
        ]
      }
    });
    return response.text || "";
  } catch (error) {
    console.error("Error analyzing reference image:", error);
    return ""; // Fallback to no reference description
  }
}

/**
 * Enhances a short user prompt into a detailed descriptive prompt using Gemini.
 * Now considers attributes and reference description to maintain "Type".
 */
export async function enhanceThermosPrompt(
  userText: string,
  attributes: { length: string; shape: string; decoration?: string },
  referenceDescription?: string
): Promise<string> {

  // Initialize client inside function to ensure fresh config
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

  let contextInstructions = "";
  if (attributes.shape) contextInstructions += `The thermos MUST have a '${attributes.shape}' shape. `;
  if (attributes.length) contextInstructions += `The size MUST be '${attributes.length}'. `;
  if (attributes.decoration && attributes.decoration !== 'None') {
    contextInstructions += `The thermos head (lid) and handle MUST have subtle '${attributes.decoration}' style decorative patterns as a gentle enhancement. `;
  }
  if (referenceDescription) contextInstructions += `The physical structure MUST match this description: "${referenceDescription}". `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      config: {
        systemInstruction: `You are an expert industrial designer. Your goal is to generate a Variation Prompt.
        
        1. **Preserve Structure**: ${contextInstructions ? contextInstructions : "Ensure the product looks like a functional, high-end thermos."}
        2. **Apply Style**: Apply the user's text input ("${userText}") as the aesthetic coating, material, color, or pattern ON TOP of that structure.
        3. **Output Language**: If the input is Arabic, the output MUST be in Arabic. If English, use English.
        4. **Format**: Output a clean, comma-separated list of visual descriptors. No conversational filler.`
      },
      contents: userText || "Create a high-quality design"
    });
    return response.text?.trim() || userText;
  } catch (error) {
    console.error("Error enhancing prompt:", error);
    throw error;
  }
}

/**
 * Generates 4 thermos designs using Imagen model.
 */
export async function generateThermosDesigns(
  userPrompt: string,
  attributes: { length: string; shape: string; decoration?: string; color: string },
  referenceImageBase64?: string
): Promise<string[]> {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

  let finalPrompt = `Professional product photography of a high-quality thermos. 
  Style: Modern, Clean, Industrial Design. 
  Brand Context: Bas Atelier (Luxury Thermos and Tableware).
  Lighting: Studio lighting, 4k resolution, photorealistic.
  `;

  // Inject Structured Attributes
  if (attributes.length) finalPrompt += `Size: ${attributes.length}. `;
  if (attributes.shape) finalPrompt += `Shape: ${attributes.shape}. `;
  if (attributes.decoration && attributes.decoration !== 'None') finalPrompt += `Head & Handle Decoration: subtle ${attributes.decoration} patterns. `;
  if (attributes.color) finalPrompt += `Primary Color: ${attributes.color}. `;

  // Inject Reference Image Analysis (if applicable)
  if (referenceImageBase64) {
    const visualDescription = await analyzeReferenceImage(referenceImageBase64);
    if (visualDescription) {
      finalPrompt += `\nSTRUCTURAL CONSTRAINT (Keep this shape): ${visualDescription}. `;
    }
  }

  // Inject User Prompt
  finalPrompt += `\nAESTHETIC DETAILS: ${userPrompt}`;

  try {
    // Using Imagen 3 (via 'imagen-4.0-generate-001' alias or specific version as per SDK)
    const response = await ai.models.generateImages({
      model: 'imagen-4.0-generate-001',
      prompt: finalPrompt,
      config: {
        numberOfImages: 4,
        aspectRatio: '3:4', // Good for product shots
        outputMimeType: 'image/jpeg'
      }
    });

    if (!response.generatedImages) {
      throw new Error("No images generated.");
    }

    // Convert raw bytes to data URLs for display
    return response.generatedImages.map(img => {
      return `data:image/jpeg;base64,${img.image.imageBytes}`;
    });

  } catch (error) {
    console.error("Generation failed:", error);
    throw error;
  }
}