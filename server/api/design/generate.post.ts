import { createClient } from "@supabase/supabase-js";

// Bir nechta kalitlardan tasodifiy bittasini tanlash funksiyasi
function getStabilityApiKey(): string {
  const keysEnv =
    process.env.STABILITY_API_KEYS || process.env.STABILITY_API_KEY || "";
  const keys = keysEnv
    .split(",")
    .map((k) => k.trim())
    .filter(Boolean);

  if (keys.length === 0) {
    throw new Error("Stability API kalitlari topilmadi");
  }

  const randomIndex = Math.floor(Math.random() * keys.length);
  return keys[randomIndex];
}

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
    throw new Error(`Stability AI xatoligi: ${errText}`);
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

  if (uploadError) {
    throw new Error(`Supabase yuklash xatosi: ${uploadError.message}`);
  }

  const { data: publicUrlData } = supabase.storage
    .from("designs")
    .getPublicUrl(uniqueFileName);

  return publicUrlData.publicUrl;
}

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event);
    const { productName, fabric, color, style, prompt, uploadedImageUrl } =
      body;

    // Supabase sozlamalari
    const supabaseUrl =
      process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !serviceKey)
      throw createError({
        statusCode: 500,
        message: "Supabase kalitlari topilmadi",
      });

    const supabase = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false },
    });

    // --- GEMINI VISION ORQALI TAHLIL QILISH ---
    let englishDesignDescription = `${color} ${productName}, made of ${fabric}. Style: ${style}. Concept: ${prompt}`;
    const geminiApiKey =
      process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;

    if (geminiApiKey) {
      try {
        let geminiInstruction = `Act as an expert AI prompt engineer. Translate and enhance the following Russian clothing design description into a highly detailed English prompt for Stable Diffusion. If words like "адрас" or "икат" are used, translate them as "traditional Central Asian ikat/adras pattern". 
        
        Original description: Color: ${color}, Item: ${productName}, Fabric: ${fabric}, Style: ${style}, Design concept: ${prompt}.
        
        Return ONLY the enhanced English description, nothing else.`;

        const parts: any[] = [];

        if (uploadedImageUrl) {
          const imgRes = await fetch(uploadedImageUrl);
          const arrayBuffer = await imgRes.arrayBuffer();
          const base64 = Buffer.from(arrayBuffer).toString("base64");
          const mimeType = imgRes.headers.get("content-type") || "image/jpeg";

          geminiInstruction = `Act as an expert AI prompt engineer. The user provided a clothing design description in Russian AND attached a reference image/logo. 
          Analyze the attached reference image carefully. Translate the Russian text and combine it with the exact visual details, colors, and shapes of the reference image to create a highly detailed English prompt for Stable Diffusion. Explain where and how this graphic should appear on the clothing.
          
          Original description: Color: ${color}, Item: ${productName}, Fabric: ${fabric}, Style: ${style}, Design concept: ${prompt}.
          
          Return ONLY the enhanced English description, nothing else.`;

          parts.push({
            inlineData: {
              data: base64,
              mimeType: mimeType,
            },
          });
        }

        parts.unshift({ text: geminiInstruction });

        const geminiRes = await $fetch<any>(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`,
          {
            method: "POST",
            body: {
              contents: [{ parts: parts }],
              generationConfig: { temperature: 0.3 },
            },
          },
        );

        const translatedText =
          geminiRes.candidates?.[0]?.content?.parts?.[0]?.text;
        if (translatedText) englishDesignDescription = translatedText.trim();
      } catch (e) {
        console.error("Gemini tarjimasida xatolik yuz berdi", e);
      }
    }
    // -------------------------------------------------------------------------

    const finalPrompt = `A high-quality, split-view professional apparel mockup showing two sides of a single ${productName} side-by-side. On the left is the front view, and on the right is the back view. ${englishDesignDescription}. Minimalist studio product shot, perfectly centered, pure solid white background. Photorealistic, highly detailed, 8k resolution.`;

    const negativePrompt = `single view, only one side, folded, distorted proportions, props, accessories, shoes, sunglasses, hats, people, text, watermark, messy background`;

    // --- STABILITY API KALITLARINI NAVBATMA-NAVBAT ISHLATISH VA ZAXIRA ---
    let generatedImageUrl = "";
    try {
      const primaryKey = getStabilityApiKey();
      generatedImageUrl = await generateAndUpload(
        finalPrompt,
        negativePrompt,
        primaryKey,
        supabase,
      );
    } catch (primaryError: any) {
      console.warn(
        "1-chi Stability kaliti ishlamadi, zaxira kalitga o'tilmoqda...",
        primaryError.message,
      );
      try {
        const backupKey = getStabilityApiKey();
        generatedImageUrl = await generateAndUpload(
          finalPrompt,
          negativePrompt,
          backupKey,
          supabase,
        );
      } catch (backupError: any) {
        throw new Error(
          `Barcha Stability kalitlari ishlamadi: ${backupError.message}`,
        );
      }
    }

    return {
      frontImage: generatedImageUrl,
    };
  } catch (error: any) {
    console.error("AI Generation Error:", error);
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || "Dizayn yaratishda xatolik yuz berdi",
    });
  }
});
