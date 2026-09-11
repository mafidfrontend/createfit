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
        let geminiInstruction = `Act as an expert AI prompt engineer and content sanitizer. 
        Translate the user's Russian clothing design description into a highly detailed English prompt for Stable Diffusion.

        CRITICAL RULES YOU MUST FOLLOW:
        1. SANITIZE: REMOVE ANY AND ALL mentions of people, humans, models, girls, boys, faces, or bodies from the translation. The image MUST be of an empty garment.
        2. GARMENT LOCK: The user selected a "${productName}". If it's a T-shirt, force words like "short sleeves", "t-shirt". NEVER allow words like "long sleeves", "hoodie", "sweatshirt", "sweater" even if the user typed them.
        3. If the user mentions "адрас" or "икат", translate as "traditional Central Asian ikat/adras pattern".
        4. If the user mentions colors/patterns, prioritize them over default values.

        User description: ${prompt}.
        Return ONLY the clean, enhanced English description. NO conversational text.`;

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

    // ===== 4. YAKUNIY STABILITY PROMPT =====
    const finalPrompt = `Professional e-commerce product mockup of a single ${productName}. ${sleeveInstruction} STRICTLY SPLIT-SCREEN LAYOUT: The LEFT side shows the FRONT view, the RIGHT side shows the BACK view. ${englishDesignDescription}. ${printStyleInstruction} Flat-lay style, completely empty garment, seamless pure white background, studio catalog lighting, highly detailed fabric texture, photorealistic, 8k resolution. STRICTLY NO HANGERS, NO STANDS, NO HUMANS, NO MODELS, NO FACES, NO BODY PARTS.`;

    const negativePrompt = `grid, 4 images, collage, multiple items, quadruplicate, split into four, hanger, coat hanger, wooden stand, pole, mannequin, dummy, human, person, model, girl, boy, face, wearing, single view, folded, shadows, messy background, text, watermark, 3d render, long sleeves`;

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
