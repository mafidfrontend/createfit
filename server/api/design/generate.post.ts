import { createClient } from "@supabase/supabase-js";
import { GoogleGenAI } from "@google/genai";

type GenerateBody = {
  productName?: string;
  fabric?: string;
  color?: string;
  style?: string;
  prompt?: string;
  uploadedImageUrl?: string;
};

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

    throw new Error(
      `Stability AI xatosi (${response.status}): ${errText}`,
    );
  }

  const imageArrayBuffer = await response.arrayBuffer();
  const imageBuffer = Buffer.from(imageArrayBuffer);

  const uniqueFileName = `ai-generated-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 8)}.png`;

  const { error: uploadError } = await supabase.storage
    .from("designs")
    .upload(uniqueFileName, imageBuffer, {
      contentType: "image/png",
      upsert: false,
    });

  if (uploadError) {
    throw new Error(`Supabase Storage xatosi: ${uploadError.message}`);
  }

  const { data: publicUrlData } = supabase.storage
    .from("designs")
    .getPublicUrl(uniqueFileName);

  if (!publicUrlData?.publicUrl) {
    throw new Error("Supabase public URL yaratilmadi");
  }

  return publicUrlData.publicUrl;
}

async function callGeminiWithRetry(
  geminiApiKey: string,
  promptText: string,
  maxRetries = 3,
): Promise<string> {
  if (!geminiApiKey) {
    throw new Error("Gemini API kaliti topilmadi");
  }

  const ai = new GoogleGenAI({
    apiKey: geminiApiKey,
  });

  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(
        `Gemini (2.5-flash): urinish ${attempt}/${maxRetries}`,
      );

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: promptText,
      });

      const text = response?.text?.trim();

      if (!text) {
        throw new Error("Gemini dan bo'sh javob keldi");
      }

      console.log(
        `Gemini muvaffaqiyatli: ${text.substring(0, 120)}...`,
      );

      return text;
    } catch (error: any) {
      lastError =
        error instanceof Error
          ? error
          : new Error(error?.message || "Noma'lum Gemini xatosi");

      const errorMessage = lastError.message || "";
      const normalized = errorMessage.toLowerCase();

      const isAuthError =
        normalized.includes("api key") ||
        normalized.includes("api_key") ||
        normalized.includes("authentication") ||
        normalized.includes("unauthorized") ||
        normalized.includes("forbidden") ||
        errorMessage.includes("401") ||
        errorMessage.includes("403");

      if (isAuthError) {
        throw new Error(
          `Gemini autentifikatsiya xatosi: ${errorMessage}`,
        );
      }

      console.warn(
        `Gemini xatosi (${attempt}-urinish): ${errorMessage}`,
      );

      if (attempt === maxRetries) {
        break;
      }

      const waitTime = Math.min(
        1000 * Math.pow(2, attempt - 1),
        8000,
      );

      await new Promise((resolve) => setTimeout(resolve, waitTime));
    }
  }

  throw new Error(
    `Gemini ishlamadi: ${lastError?.message || "Noma'lum xato"
    }`,
  );
}

function normalizeText(value: unknown, fallback = ""): string {
  if (typeof value !== "string") return fallback;

  const trimmed = value.trim();

  if (!trimmed || trimmed.toLowerCase() === "null") {
    return fallback;
  }

  return trimmed;
}

function detectProductType(productName: string): string {
  const name = productName.toLowerCase();

  if (
    name.includes("футболка") ||
    name.includes("t-shirt") ||
    name.includes("tshirt")
  ) {
    return "t-shirt";
  }

  if (
    name.includes("худи") ||
    name.includes("hoodie")
  ) {
    return "hoodie";
  }

  if (
    name.includes("свитшот") ||
    name.includes("sweatshirt")
  ) {
    return "sweatshirt";
  }

  if (
    name.includes("лонгслив") ||
    name.includes("long sleeve") ||
    name.includes("longsleeve")
  ) {
    return "long sleeve shirt";
  }

  return "garment";
}

function detectFabric(fabric: string): {
  isCotton: boolean;
  normalized: string;
} {
  const normalized = fabric.toLowerCase();

  const isCotton =
    normalized.includes("хлопок") ||
    normalized.includes("хб") ||
    normalized.includes("cotton") ||
    normalized.includes("пахта");

  return {
    isCotton,
    normalized,
  };
}

export default defineEventHandler(async (event) => {
  try {
    const body = (await readBody<GenerateBody>(event)) || {};

    const productName = normalizeText(
      body.productName,
      "garment",
    );

    const fabric = normalizeText(
      body.fabric,
      "textile",
    );

    const color = normalizeText(
      body.color,
      "unspecified color",
    );

    const style = normalizeText(
      body.style,
      "minimal",
    );

    const userPrompt = normalizeText(
      body.prompt,
      "minimalist modern abstract graphic",
    );

    const uploadedImageUrl = normalizeText(
      body.uploadedImageUrl,
      "",
    );

    console.log("=== FABRIKA AI GENERATION ===");
    console.log("productName:", productName);
    console.log("fabric:", fabric);
    console.log("color:", color);
    console.log("style:", style);
    console.log("userPrompt:", userPrompt);
    console.log(
      "uploadedImageUrl:",
      uploadedImageUrl ? "provided" : "not provided",
    );

    // ============================================================
    // SUPABASE
    // ============================================================

    const supabaseUrl =
      process.env.SUPABASE_URL ||
      process.env.VITE_SUPABASE_URL;

    const serviceKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceKey) {
      throw createError({
        statusCode: 500,
        message: "Supabase kalitlari topilmadi.",
      });
    }

    const supabase = createClient(
      supabaseUrl,
      serviceKey,
      {
        auth: {
          persistSession: false,
        },
      },
    );

    // ============================================================
    // GEMINI — FAQAT ARTWORK DESCRIPTION
    // ============================================================

    let englishDesignDescription =
      userPrompt;

    const geminiApiKey =
      process.env.GEMINI_API_KEY ||
      process.env.VITE_GEMINI_API_KEY ||
      "";

    if (geminiApiKey) {
      try {
        const geminiInstruction = `
Convert the user's design idea into a concise English description of the artwork to be printed on clothing.

USER DESIGN IDEA:
"${userPrompt}"

Return ONLY the artwork description.

Describe only:
- the main subject or symbol
- important colors
- visual style
- composition
- important recognizable details
- background or negative-space concept if explicitly mentioned

Do NOT mention:
- clothing
- garments
- t-shirts
- hoodies
- sweatshirts
- people
- models
- mannequins
- bodies
- fabric
- product photography
- cameras
- lighting
- studio
- mockups
- catalogs

Do not invent new objects, characters, symbols, colors, or concepts that were not requested.

Example:
Input:
"с белой луной на чёрном фоне"

Output:
"a white moon centered on a black background, minimalist high-contrast graphic"

Return ONLY one concise English sentence.
`.trim();

        const translatedText = await callGeminiWithRetry(
          geminiApiKey,
          geminiInstruction,
          3,
        );

        if (translatedText) {
          englishDesignDescription =
            translatedText
              .replace(/^["']|["']$/g, "")
              .trim();
        }
      } catch (geminiError: any) {
        console.error(
          "Gemini xatosi:",
          geminiError?.message || geminiError,
        );

        // Gemini xato bo'lsa, foydalanuvchining original
        // design promptidan foydalanamiz.
        englishDesignDescription =
          userPrompt;
      }
    } else {
      console.warn(
        "GEMINI_API_KEY topilmadi. Original design prompt ishlatiladi.",
      );
    }

    // ============================================================
    // PRODUCT TYPE
    // ============================================================

    const englishProductName =
      detectProductType(productName);

    const isTshirt =
      englishProductName === "t-shirt";

    // ============================================================
    // FABRIC
    // ============================================================

    const {
      isCotton,
    } = detectFabric(fabric);

    // ============================================================
    // PRINT STYLE
    // ============================================================

    const printStyleInstruction = isCotton
      ? `
For the LEFT front-view garment, place the artwork as a clean, clearly visible chest print on the upper-left chest area.

For the RIGHT back-view garment, place the exact same artwork in the corresponding upper-back print area.

Preserve the same artwork composition, colors, shapes and visual identity.
Keep all other fabric plain.
`
      : `
Apply the exact same artwork to BOTH garments as a continuous all-over print.

The artwork should naturally cover the visible fabric from edge to edge while remaining aligned with the garment surface.

Do not redesign or reinterpret the artwork between the two garments.
`;

    // ============================================================
    // GARMENT-SPECIFIC INSTRUCTION
    // ============================================================

    const garmentInstruction = isTshirt
      ? `
Both garments are classic short-sleeve t-shirts.
The sleeves are short.
The garments have a standard crew-neck t-shirt silhouette.
`
      : `
Both garments must clearly match the requested ${englishProductName} silhouette.
`;

    // ============================================================
    // NEGATIVE PROMPT
    // ============================================================

    const negativePrompt = `
person, human, model, mannequin, dress form,
body, torso, head, face, hands, arms, legs, skin,
hanger, hook, clothing rack, clips, stand,

shoes, sneakers, socks, pants, jeans, shorts, skirt,
bag, sunglasses, glasses, watch, jewelry, hat,
phone, furniture, props, packaging, boxes,

extra object, extra garment, third garment,
more than two garments, duplicate garment,
duplicate objects,

overlapping garments, touching garments,
stacked garments, one garment on another,
vertical arrangement, folded clothes, rolled clothes,
tangled fabric, cropped garment, partial garment,

angled view, perspective view, side view,
three-quarter view, standing garment,
hanging garment, floating garment,
body-shaped clothing, 3D clothing shape,

deformed garment, malformed garment,
distorted proportions, malformed sleeves,
malformed collar, malformed neckline,
extra sleeves, missing sleeves,

different colors, different shapes,
different sizes, different fabric,
different artwork, mismatched artwork,
blank garment, plain garment,
missing print, missing graphic,
invisible design, altered graphic,
warped graphic, distorted graphic,
duplicated graphic, random graphic,
blurry print, low detail,

low resolution, pixelated, noise, artifacts,
CGI, 3D render, illustration, cartoon,
painting,

gray background, colored background,
textured background, non-white background,
gradient background, room, scenery,
studio equipment,

collage, montage, template, mockup,
grid, split screen, multiple panels,
border, dividing line,

text overlay, captions, watermark, UI
`
      .replace(/\s+/g, " ")
      .trim();

    // ============================================================
    // FINAL POSITIVE PROMPT
    // ============================================================

    const finalPrompt = `
Photorealistic commercial e-commerce flat-lay product photograph.

Exactly TWO identical ${englishProductName} garments are shown together.

The garments are placed SIDE BY SIDE HORIZONTALLY in one continuous composition, with clear white space between them.

The LEFT garment is a complete FRONT VIEW.
The RIGHT garment is a complete BACK VIEW.

Both garments are two physical copies of the SAME exact product.

They have:
- identical color
- identical fabric
- identical cut
- identical size
- identical proportions
- identical construction
- identical sleeves
- identical collar
- identical artwork treatment

${garmentInstruction}

ARTWORK:
"${englishDesignDescription}"

The EXACT SAME artwork appears on BOTH garments.

Preserve the artwork's recognizable subject, composition, colors and visual identity.
Do not reinterpret the artwork.
Do not create a different version of the artwork for the second garment.

${printStyleInstruction}

The print looks like a real physical garment print integrated naturally into the textile surface.

The full garments are completely visible from edge to edge.

The garments are naturally laid flat on a completely pure white seamless background.

Straight overhead 90-degree camera.
Front view on the left.
Back view on the right.
Horizontal composition.
Equal visual scale.
Equal distance between garments.
Centered composition.

Realistic textile texture.
Subtle natural fabric wrinkles.
Natural fabric drape while remaining clearly flat.
Soft diffused studio lighting.
Very soft contact shadows.
Accurate garment proportions.
Sharp print details.
Natural realistic colors.
High photographic realism.
Professional commercial product photography.
`
      .replace(/\n{3,}/g, "\n\n")
      .trim();

    console.log(
      "=== GENERATED ARTWORK DESCRIPTION ===",
    );
    console.log(
      englishDesignDescription,
    );

    console.log(
      "=== FINAL STABILITY PROMPT ===",
    );
    console.log(finalPrompt);

    // ============================================================
    // STABILITY API KEYS
    // ============================================================

    const keysEnv =
      process.env.STABILITY_API_KEYS ||
      process.env.STABILITY_API_KEY ||
      "";

    const stabilityKeys = keysEnv
      .split(",")
      .map((key) => key.trim())
      .filter(Boolean);

    if (stabilityKeys.length === 0) {
      throw createError({
        statusCode: 500,
        message: "Stability AI kalitlari topilmadi.",
      });
    }

    // ============================================================
    // GENERATE WITH STABILITY
    // ============================================================

    let generatedImageUrl = "";
    const stabilityErrors: string[] = [];

    for (
      let i = 0;
      i < stabilityKeys.length;
      i++
    ) {
      const key = stabilityKeys[i];

      try {
        console.log(
          `Stability AI: ${i + 1}/${stabilityKeys.length} kalit bilan urinish`,
        );

        generatedImageUrl =
          await generateAndUpload(
            finalPrompt,
            negativePrompt,
            key,
            supabase,
          );

        console.log(
          "Stability AI muvaffaqiyatli ishladi.",
        );

        break;
      } catch (error: any) {
        const message =
          error?.message ||
          "Noma'lum Stability xatosi";

        stabilityErrors.push(
          `Key ${i + 1}: ${message}`,
        );

        console.error(
          "STABILITY AI XATOLIGI:",
          message,
        );

        // Keyingi Stability API key bilan sinaymiz.
      }
    }

    if (!generatedImageUrl) {
      throw createError({
        statusCode: 500,
        message: `Stability AI ishlamadi. ${stabilityErrors.join(
          " | ",
        )}`,
      });
    }

    // ============================================================
    // RESPONSE
    // ============================================================

    return {
      success: true,
      frontImage: generatedImageUrl,
      prompt: finalPrompt,
      translatedPrompt:
        englishDesignDescription,
      productType: englishProductName,
      fabric,
      color,
      style,
      hasReferenceImage:
        Boolean(uploadedImageUrl),
    };
  } catch (error: any) {
    console.error(
      "DESIGN GENERATION ERROR:",
      error,
    );

    throw createError({
      statusCode:
        error?.statusCode || 500,
      message:
        error?.message ||
        "Dizayn yaratishda xatolik yuz berdi",
    });
  }
});
