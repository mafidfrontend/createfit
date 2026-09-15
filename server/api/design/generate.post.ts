import { createClient } from "@supabase/supabase-js";
import { GoogleGenAI } from "@google/genai";

async function generateAndUpload(
  prompt: string,
  negativePrompt: string,
  stabilityApiKey: string,
  supabase: any,
): Promise<string> {
  const formData = new FormData();
  formData.append("prompt", prompt);
  formData.append("negative_prompt", negativePrompt);
  formData.append("output_format", "png");
  formData.append("aspect_ratio", "16:9");

  const response = await fetch(
    "https://api.stability.ai/v2beta/stable-image/generate/core",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${stabilityApiKey}`,
        Accept: "image/*",
      },
      body: formData,
    },
  );

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Stability xatosi: ${errText}`);
  }

  const imageArrayBuffer = await response.arrayBuffer();
  const imageBuffer = Buffer.from(imageArrayBuffer);
  const uniqueFileName = `ai-generated-${Date.now()}.png`;

  const { error: uploadError } = await supabase.storage
    .from("designs")
    .upload(uniqueFileName, imageBuffer, {
      contentType: "image/png",
      upsert: false,
    });

  if (uploadError) throw new Error(`Supabase xatosi: ${uploadError.message}`);

  const { data: publicUrlData } = supabase.storage
    .from("designs")
    .getPublicUrl(uniqueFileName);
  return publicUrlData.publicUrl;
}

// ===== GEMINI QAYTA URINISH FUNKSIYASI =====
async function callGeminiWithRetry(
  geminiApiKey: string,
  promptText: string,
  maxRetries: number = 3,
): Promise<string> {
  if (!geminiApiKey) {
    throw new Error("Gemini API kaliti topilmadi");
  }

  const ai = new GoogleGenAI({ apiKey: geminiApiKey });
  let lastError = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(
        `Gemini (1.5-flash) so'rovi: urinish ${attempt}/${maxRetries}`,
      );

      // To'g'ri SDK metodi va to'g'ri model nomi
      const response = await ai.models.generateContent({
        model: "gemini-3.8-flash",
        contents: promptText,
      });

      if (!response || !response.text) {
        throw new Error("Gemini dan bo'sh javob keldi");
      }

      console.log(
        `Gemini muvaffaqiyatli: ${response.text.substring(0, 50)}...`,
      );
      return response.text;
    } catch (error: any) {
      lastError = error;
      const errorMessage = error.message || "";
      const isAuthError =
        errorMessage.includes("key") ||
        errorMessage.includes("auth") ||
        errorMessage.includes("403");
      if (isAuthError)
        throw new Error(`Gemini autentifikatsiya xatosi: ${errorMessage}`);

      console.warn(`Gemini xatosi (${attempt}-urinish):`, errorMessage);
      if (attempt === maxRetries) break;
      const waitTime = Math.min(1000 * Math.pow(2, attempt - 1), 8000);
      await new Promise((resolve) => setTimeout(resolve, waitTime));
    }
  }

  throw new Error(`Gemini ishlamadi: ${lastError?.message || "Noma'lum xato"}`);
}

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event);
    const { productName, fabric, color, style, prompt, uploadedImageUrl } =
      body;

    const supabaseUrl =
      process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceKey) {
      throw createError({
        statusCode: 500,
        message: "Supabase kalitlari topilmadi.",
      });
    }

    const supabase = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false },
    });

    let englishDesignDescription = `${color} ${productName}, made of ${fabric}. Style: ${style}. Concept: ${prompt}`;
    const geminiApiKey =
      process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;

    // ===== 1. GEMINI SANITAR-PROMPT (Odamlarni yo'qotish va kiyimni majburlash) =====
    if (geminiApiKey) {
      try {
        let geminiInstruction = `Act as an expert AI prompt engineer. The user wants a specific graphic, pattern, or text printed on a garment.
        
        User description: "${prompt}"
        
        CRITICAL RULES:
        1. Describe ONLY the artwork, graphic, pattern, or logo itself. 
        2. DO NOT describe the garment type.
        3. DO NOT mention people, models, mannequins, faces, or bodies.
        4. DO NOT mention backgrounds, grids, collages, or catalogs.
        5. If the user prompt is vague (like "Make me design"), default to describing a "minimalist modern abstract graphic".
        
        Return ONLY the English description of the PRINT/ARTWORK. Nothing else.`;

        if (uploadedImageUrl) {
          geminiInstruction += `\n\nPlease also consider the visual style of this reference image: ${uploadedImageUrl}`;
        }

        const translatedText = await callGeminiWithRetry(
          geminiApiKey,
          geminiInstruction,
          3,
        );
        if (translatedText && translatedText.trim().length > 0) {
          englishDesignDescription = translatedText.trim();
        }
      } catch (geminiError: any) {
        console.error("Gemini xatosi:", geminiError.message);
      }
    }

    // ===== 2. MATOGA QARAB MANTIQ (Antonina qoidasi) =====
    const fabricName = fabric?.toLowerCase() || "";

    const isCotton =
      fabricName.includes("хлопок") ||
      fabricName.includes("хб") ||
      fabricName.includes("cotton") ||
      fabricName.includes("пахта");

    const printStyleInstruction = isCotton
      ? "For the front garment, place the artwork as a small, clean logo on the left chest area. For the back garment, place the same artwork in the corresponding upper-back print area. Keep all other fabric plain."
      : "Apply the same artwork as a continuous all-over print across the visible fabric of both garments, covering the fabric naturally from edge to edge.";

    // ===== 3. FUTBOLKANI MAJBURLASH (Longsleeve bo'lib ketmasligi uchun) =====
    const isTshirt =
      productName?.toLowerCase().includes("футболка") ||
      productName?.toLowerCase().includes("t-shirt");
    const sleeveInstruction = isTshirt
      ? "SHORT SLEEVES ONLY, strictly a t-shirt shape, NO long sleeves."
      : "";

    // ===== 1. MAHSULOT NOMINI INGLIZ TILIGA O'GIRISH =====
    let englishProductName = 'garment';
    const prodName = productName?.toLowerCase() || '';
    if (prodName.includes('футболка') || prodName.includes('t-shirt')) {
      englishProductName = 't-shirt';
    } else if (prodName.includes('худи') || prodName.includes('hoodie')) {
      englishProductName = 'hoodie';
    } else if (prodName.includes('свитшот') || prodName.includes('sweatshirt')) {
      englishProductName = 'sweatshirt';
    } else if (prodName.includes('лонгслив') || prodName.includes('longsleeve')) {
      englishProductName = 'long sleeve shirt';
    }

    // ===== 2. NEGATIVE PROMPT (BIRINCHI NAVBATDA, MAXSIMAL DETALLASHGAN) =====
    const negativePrompt = `
person, human, model, mannequin, dress form, body, head, face, hands, arms, legs, skin,
hanger, rack, clips, stand, shoes, pants, jeans, shorts, skirt, bag, accessories, furniture, props,
packaging, extra objects, extra garment, third garment, more than two garments, duplicate objects,
overlap, touching garments, stacked garments, folded clothing, cropped garment, partial garment,
angled view, perspective view, side view, three-quarter view, hanging garment, standing garment,
floating garment, body-shaped clothing, 3D clothing,
deformed garment, distorted proportions, malformed sleeves, malformed collar, extra sleeves,
different colors, different garment shapes, different sizes, different artwork,
blank garment, missing print, missing graphic, invisible design, altered graphic,
warped graphic, duplicated graphic, random graphic, blurry print, illegible design,
low resolution, pixelated, noise, artifacts, CGI, 3D render, illustration, cartoon, painting,
gray background, colored background, textured background, non-white background,
room, scenery, studio equipment, collage, montage, grid, multiple panels,
split screen, border, dividing line, watermark, text overlay, UI
`.replace(/\s+/g, " ").trim();

    // ===== 3. POSITIVE PROMPT (HAR BIR DETAL ALOHIDA BLOKDA) =====
    const finalPrompt = `
Photorealistic commercial e-commerce flat-lay photograph of exactly two identical ${englishProductName} garments on a completely pure white background.

Two garments only. They are placed side by side horizontally, with clear empty white space between them. The garments do not overlap, touch, stack, or intersect.

The LEFT garment is a front view, showing the complete front of the garment.
The RIGHT garment is a back view, showing the complete back of the garment.

Both garments are the same physical product: identical color, identical fabric, identical cut, identical size, identical proportions, identical sleeves, identical collar, identical construction and identical design treatment. They must look like two copies of the same garment.

The artwork is "${englishDesignDescription}".

The same artwork is visibly printed on BOTH garments. The print must look like a real physical garment print integrated into the fabric, with sharp edges, accurate colors and recognizable details.

${printStyleInstruction}

The print must remain attached to the garment surface and follow the natural shape of the fabric. Do not invent a second different artwork. Do not change the artwork between the two garments.

The garments are naturally laid flat with realistic textile texture and only subtle natural fabric wrinkles. The full garments are visible from edge to edge.

Straight overhead 90-degree camera. Front view on the left, back view on the right. Balanced horizontal composition. Equal visual scale. Equal distance from the camera. Pure white seamless background. Soft diffused studio lighting. Very soft contact shadows beneath the garments. Realistic textile material. Photorealistic product photography. Clean commercial catalog aesthetic. High detail and natural proportions.
`.trim();

    const keysEnv =
      process.env.STABILITY_API_KEYS || process.env.STABILITY_API_KEY || "";
    const stabilityKeys = keysEnv
      .split(",")
      .map((k) => k.trim())
      .filter(Boolean);

    if (stabilityKeys.length === 0) {
      throw createError({
        statusCode: 500,
        message: "Stability AI kalitlari topilmadi.",
      });
    }

    let generatedImageUrl = "";
    let lastError = null;

    for (let i = 0; i < stabilityKeys.length; i++) {
      const key = stabilityKeys[i];
      try {
        generatedImageUrl = await generateAndUpload(
          finalPrompt,
          negativePrompt,
          key,
          supabase,
        );
        break;
      } catch (error: any) {
        console.error("STABILITY AI XATOLIGI:", error.data || error.message || error);
        throw createError({ statusCode: 500, statusMessage: 'Xatolik yuz berdi' });
      }
    }

    if (!generatedImageUrl) {
      throw createError({
        statusCode: 500,
        message: `Stability ishlamadi: ${lastError?.message}`,
      });
    }

    return {
      success: true,
      frontImage: generatedImageUrl,
      prompt: finalPrompt,
      translatedPrompt: englishDesignDescription,
    };
  } catch (error: any) {
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || "Dizayn yaratishda xatolik yuz berdi",
    });
  }
});
