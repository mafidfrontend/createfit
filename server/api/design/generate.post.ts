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
  formData.append("aspect_ratio", "4:5");

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
        `Gemini (3.8-flash) so'rovi: urinish ${attempt}/${maxRetries}`,
      );

      const interaction = await ai.interactions.create({
        model: "gemini-3.8-flash",
        input: promptText,
      });

      if (!interaction || !interaction.output_text) {
        throw new Error("Gemini dan bo'sh javob keldi");
      }

      console.log(
        `Gemini muvaffaqiyatli: ${interaction.output_text.substring(0, 50)}...`,
      );
      return interaction.output_text;
    } catch (error: any) {
      lastError = error;
      const errorMessage = error.message || "";
      const isAuthError =
        errorMessage.includes("key") ||
        errorMessage.includes("auth") ||
        errorMessage.includes("403");
      if (isAuthError)
        throw new Error(`Gemini autentifikatsiya xatosi: ${errorMessage}`);
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
    const isCotton =
      fabric?.toLowerCase().includes("хлопок") ||
      fabric?.toLowerCase().includes("хб");
    const printStyleInstruction = isCotton
      ? "Design requirement: Place the design ONLY as a small, neat logo strictly on the left chest area. The rest of the garment MUST remain completely blank and plain."
      : "Design requirement: Create a seamless ALL-OVER print. The design and pattern MUST cover the entire fabric of the garment completely from edge to edge.";

    // ===== 3. FUTBOLKANI MAJBURLASH (Longsleeve bo'lib ketmasligi uchun) =====
    const isTshirt =
      productName?.toLowerCase().includes("футболка") ||
      productName?.toLowerCase().includes("t-shirt");
    const sleeveInstruction = isTshirt
      ? "SHORT SLEEVES ONLY, strictly a t-shirt shape, NO long sleeves."
      : "";

        // ===== YAKUNIY STABILITY PROMPT (STABILITY AI UCHUN MOSLASHTIRILGAN) =====
    const finalPrompt = `Two identical ${productName}s laid flat on a pure white background side-by-side. The left ${productName} shows the front view, the right ${productName} shows the back view. Pure flat-lay clothing photography, completely empty garments, nobody wearing it. ${sleeveInstruction} Design on the fabric: ${englishDesignDescription}. ${printStyleInstruction} Top-down camera angle, highly detailed fabric texture, studio lighting.`;

    // ===== JUUDA QAT'IY NEGATIVE PROMPT =====
    const negativePrompt = `human, person, model, girl, boy, mannequin, dummy, ghost mannequin, body, face, hands, arms, legs, neck, wearing, 3d render, illustration, drawing, wrinkles forming a body, hanger, coat hanger, stand, rack, grid, 4 images, collage, overlapping garments, messy background, text, watermark, long sleeves, outfit, multiple items, shoes, pants, sunglasses, watch, accessories`;
    
       
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
      } catch (err: any) {
        lastError = err;
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
