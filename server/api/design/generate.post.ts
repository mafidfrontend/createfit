import { createClient } from "@supabase/supabase-js";
import { GoogleGenAI, Type } from "@google/genai";

type ArtworkAnalysis = {
  language: string;
  artworkDescription: string;
  mainSubject: string;
  colors: string[];
  style: string;
  composition: string;
  details: string[];
  background: string;
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
    throw new Error(
      `Supabase Storage xatosi: ${uploadError.message}`,
    );
  }

  const { data: publicUrlData } = supabase.storage
    .from("designs")
    .getPublicUrl(uniqueFileName);

  if (!publicUrlData?.publicUrl) {
    throw new Error("Supabase public URL yaratilmadi");
  }

  return publicUrlData.publicUrl;
}

async function analyzeArtworkWithGemini(
  geminiApiKey: string,
  userPrompt: string,
  maxRetries = 3,
): Promise<ArtworkAnalysis> {
  if (!geminiApiKey) {
    throw new Error("Gemini API kaliti topilmadi");
  }

  const ai = new GoogleGenAI({
    apiKey: geminiApiKey,
  });

  let lastError: Error | null = null;

  const instruction = `
Analyze the user's clothing design idea and convert it into a structured
description of the VISUAL ARTWORK only.

USER DESIGN IDEA:
"${userPrompt}"

IMPORTANT:
- Return the complete JSON object requested by the schema.
- All descriptive values MUST be in English.
- Do not mention clothing, garments, t-shirts, hoodies, sweatshirts,
  people, models, mannequins, bodies, fabric, cameras, photography,
  studio, catalog, mockup, or product presentation.
- Describe only the artwork itself.
- Preserve the user's original intent.
- Do not invent major objects, subjects, symbols, or colors.
- If the user explicitly mentions a background, preserve it.
- If some detail is not specified, use a concise neutral description.
- Keep artworkDescription concise but visually useful for an image model.
`;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(
        `Gemini structured analysis: ${attempt}/${maxRetries}`,
      );

      const response = await ai.models.generateContent({
        model: "gemini-3.6-flash",
        contents: instruction,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              language: {
                type: Type.STRING,
              },
              artworkDescription: {
                type: Type.STRING,
              },
              mainSubject: {
                type: Type.STRING,
              },
              colors: {
                type: Type.ARRAY,
                items: {
                  type: Type.STRING,
                },
              },
              style: {
                type: Type.STRING,
              },
              composition: {
                type: Type.STRING,
              },
              details: {
                type: Type.ARRAY,
                items: {
                  type: Type.STRING,
                },
              },
              background: {
                type: Type.STRING,
              },
            },
            required: [
              "language",
              "artworkDescription",
              "mainSubject",
              "colors",
              "style",
              "composition",
              "details",
              "background",
            ],
          },
        },
      });

      const rawText = response?.text?.trim();

      if (!rawText) {
        throw new Error(
          "Gemini dan bo'sh JSON javob keldi",
        );
      }

      console.log("Gemini raw JSON:", rawText);

      let parsed: Partial<ArtworkAnalysis>;

      try {
        parsed = JSON.parse(rawText);
      } catch {
        throw new Error(
          `Gemini JSON parse xatosi: ${rawText}`,
        );
      }

      const result: ArtworkAnalysis = {
        language:
          typeof parsed.language === "string"
            ? parsed.language.trim()
            : "unknown",

        artworkDescription:
          typeof parsed.artworkDescription === "string"
            ? parsed.artworkDescription.trim()
            : "",

        mainSubject:
          typeof parsed.mainSubject === "string"
            ? parsed.mainSubject.trim()
            : "",

        colors:
          Array.isArray(parsed.colors)
            ? parsed.colors
              .filter(
                (item): item is string =>
                  typeof item === "string",
              )
              .map((item) => item.trim())
              .filter(Boolean)
            : [],

        style:
          typeof parsed.style === "string"
            ? parsed.style.trim()
            : "",

        composition:
          typeof parsed.composition === "string"
            ? parsed.composition.trim()
            : "",

        details:
          Array.isArray(parsed.details)
            ? parsed.details
              .filter(
                (item): item is string =>
                  typeof item === "string",
              )
              .map((item) => item.trim())
              .filter(Boolean)
            : [],

        background:
          typeof parsed.background === "string"
            ? parsed.background.trim()
            : "",
      };

      if (!result.artworkDescription) {
        throw new Error(
          "Gemini artworkDescription qaytarmadi",
        );
      }

      console.log(
        "Gemini structured result:",
        JSON.stringify(result, null, 2),
      );

      return result;
    } catch (error: any) {
      lastError =
        error instanceof Error
          ? error
          : new Error(
            error?.message || "Noma'lum Gemini xatosi",
          );

      const errorMessage = lastError.message;
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

      await new Promise((resolve) =>
        setTimeout(resolve, waitTime),
      );
    }
  }

  throw new Error(
    `Gemini structured output ishlamadi: ${lastError?.message || "Noma'lum xato"
    }`,
  );
}

function normalizeText(
  value: unknown,
  fallback = "",
): string {
  if (typeof value !== "string") {
    return fallback;
  }

  const trimmed = value.trim();

  if (!trimmed || trimmed.toLowerCase() === "null") {
    return fallback;
  }

  return trimmed;
}

function detectProductType(
  productName: string,
  productType?: string,
): string {
  const name = productName.toLowerCase();
  const type = (productType || "").toLowerCase();

  if (
    type === "tee" ||
    type === "t-shirt" ||
    type === "tshirt" ||
    name.includes("футболка") ||
    name.includes("t-shirt") ||
    name.includes("tshirt")
  ) {
    return "t-shirt";
  }

  if (
    type === "hoodie" ||
    name.includes("худи") ||
    name.includes("hoodie")
  ) {
    return "hoodie";
  }

  if (
    type === "sweatshirt" ||
    name.includes("свитшот") ||
    name.includes("sweatshirt")
  ) {
    return "sweatshirt";
  }

  if (
    type === "longsleeve" ||
    type === "long sleeve" ||
    name.includes("лонгслив") ||
    name.includes("long sleeve") ||
    name.includes("longsleeve")
  ) {
    return "long sleeve shirt";
  }

  return "garment";
}

function isCottonFabric(
  fabric: string,
): boolean {
  const value = fabric.toLowerCase();

  return (
    value.includes("хлопок") ||
    value.includes("хб") ||
    value.includes("cotton") ||
    value.includes("пахта")
  );
}

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody<{
      productType?: string;
      productName?: string;
      fabric?: string;
      color?: string | null;
      style?: string;
      prompt?: string;
      uploadedImageUrl?: string | null;
    }>(event);

    const productName = normalizeText(
      body?.productName,
      body?.productType || "garment",
    );

    const productType = normalizeText(
      body?.productType,
      "",
    );

    const fabric = normalizeText(
      body?.fabric,
      "textile",
    );

    const color = normalizeText(
      body?.color,
      "unspecified color",
    );

    const style = normalizeText(
      body?.style,
      "minimal",
    );

    const userPrompt = normalizeText(
      body?.prompt,
      "minimalist modern abstract graphic",
    );

    const uploadedImageUrl = normalizeText(
      body?.uploadedImageUrl,
      "",
    );

    console.log("=== FABRIKA AI GENERATION ===");
    console.log("productName:", productName);
    console.log("productType:", productType);
    console.log("fabric:", fabric);
    console.log("color:", color);
    console.log("style:", style);
    console.log("userPrompt:", userPrompt);
    console.log(
      "uploadedImageUrl:",
      uploadedImageUrl
        ? "provided"
        : "not provided",
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
    // PRODUCT TYPE
    // ============================================================

    const englishProductName =
      detectProductType(
        productName,
        productType,
      );

    const isTshirt =
      englishProductName === "t-shirt";

    // ============================================================
    // GEMINI STRUCTURED ANALYSIS
    // ============================================================

    const geminiApiKey =
      process.env.GEMINI_API_KEY ||
      process.env.VITE_GEMINI_API_KEY ||
      "";

    let artwork: ArtworkAnalysis = {
      language: "unknown",
      artworkDescription: userPrompt,
      mainSubject: userPrompt,
      colors: [],
      style,
      composition: "unspecified",
      details: [],
      background: "unspecified",
    };

    if (geminiApiKey) {
      try {
        artwork = await analyzeArtworkWithGemini(
          geminiApiKey,
          userPrompt,
          3,
        );
      } catch (geminiError: any) {
        console.error(
          "GEMINI STRUCTURED OUTPUT ERROR:",
          geminiError,
        );

        throw createError({
          statusCode: 500,
          message: `Gemini structured output xatosi: ${geminiError?.message || "Noma'lum xato"
            }`,
        });
      }
    } else {
      console.warn(
        "GEMINI_API_KEY topilmadi. Original prompt ishlatiladi.",
      );
    }

    // ============================================================
    // PRINT STYLE
    // ============================================================

    const cotton = isCottonFabric(fabric);

    const printStyleInstruction = cotton
      ? `
For the LEFT front-view garment, place the artwork as a clean,
clearly visible print on the upper-left chest area.

For the RIGHT back-view garment, place the EXACT SAME artwork
in the corresponding upper-back print area.

Preserve the artwork's exact subject, colors, composition
and visual identity.

Keep all remaining garment fabric plain.
`
      : `
Apply the EXACT SAME artwork to BOTH garments as a continuous
all-over print covering the visible garment fabric.

Preserve the same artwork identity, colors and composition
on both garments.
`;

    // ============================================================
    // GARMENT
    // ============================================================

    const garmentInstruction = isTshirt
      ? `
Both garments are classic short-sleeve t-shirts.
Standard short sleeves.
Standard crew-neck t-shirt silhouette.
`
      : `
Both garments clearly match the requested
${englishProductName} silhouette.
`;

    // ============================================================
    // NEGATIVE PROMPT
    // ============================================================

    const negativePrompt = `
person, human, model, mannequin, dress form,
body, torso, head, face, hands, arms, legs, skin,

hanger, hook, clothing rack, clips, stand,

shoes, sneakers, socks, pants, jeans, shorts,
skirt, bag, sunglasses, glasses, watch, jewelry,
hat, phone, furniture, props, accessories,

black rectangle, black square, rectangular background,
background box, printed box, artwork panel, framed graphic,
visible rectangular print background

packaging, boxes, extra objects,
extra garment, third garment,
more than two garments, duplicate garments,

overlapping garments, touching garments,
stacked garments, one garment on another,
vertical arrangement, folded clothing,
rolled clothing, tangled fabric,

cropped garment, partial garment,
angled view, perspective view, side view,
three-quarter view, standing garment,
hanging garment, floating garment,

body-shaped clothing, 3D clothing shape,
deformed garment, malformed garment,
distorted proportions, malformed sleeves,
malformed collar, malformed neckline,
extra sleeves,

different colors, different shapes,
different sizes, different fabric,
different artwork, mismatched artwork,

blank garment, missing print, missing graphic,
invisible design, altered graphic,
warped graphic, distorted graphic,
duplicated graphic, random graphic,
blurry print, illegible design,

low resolution, pixelated, noise, artifacts,
CGI, 3D render, illustration, cartoon, painting,

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
    // STABILITY PROMPT
    // ============================================================

    const artworkDetails = [
      `Main subject: ${artwork.mainSubject}`,
      `Colors: ${artwork.colors.length
        ? artwork.colors.join(", ")
        : "preserve the artwork's original colors"
      }`,
      `Style: ${artwork.style || style}`,
      `Composition: ${artwork.composition || "preserve the user's composition"
      }`,
      `Important details: ${artwork.details.length
        ? artwork.details.join(", ")
        : "preserve all recognizable details"
      }`,
      `Artwork background: ${artwork.background || "preserve the requested background"
      }`,
    ].join(". ");

    const garmentInstruction = isTshirt
      ? `
Both garments are classic short-sleeve t-shirts.
Standard short sleeves.
Standard crew-neck t-shirt silhouette.
`
      : `
Both garments must clearly match the requested ${englishProductName} silhouette.
`;

    const finalPrompt = `
Photorealistic commercial e-commerce flat-lay photograph.

EXACTLY TWO identical ${englishProductName} garments.

GARMENT COLOR:
Both garments are solid ${color} in color.
Both garments have exactly the same garment color.

PRODUCT CONSISTENCY:
Both garments are two physical copies of the same exact product.
They have identical:
- color
- fabric
- cut
- size
- proportions
- construction
- sleeves
- collar

PLACEMENT:
The two garments are placed side by side horizontally.
They are fully separated with visible white space between them.
They do not overlap or touch.

VIEW:
LEFT garment = complete front view.
RIGHT garment = complete back view.

${garmentInstruction}

ARTWORK:
${artwork.artworkDescription}

ARTWORK COLORS:
${artwork.colors.length
        ? artwork.colors.join(", ")
        : "preserve the artwork's described colors"
      }

ARTWORK COMPOSITION:
${artwork.composition}

ARTWORK DETAILS:
${artwork.details.length
        ? artwork.details.join(", ")
        : "preserve all recognizable visual details"
      }

PRINT CONSISTENCY:
The EXACT SAME artwork must appear on both garments.
Preserve the same subject, colors, composition, proportions and visual identity.
Do not redesign, reinterpret, simplify or replace the artwork on the second garment.

PRINT PLACEMENT:
For the LEFT front garment, place the artwork as a clean upper-left chest print.

For the RIGHT back garment, place the EXACT SAME artwork in the corresponding upper-back position.

Keep all other garment areas plain.

BLACK BACKGROUND HANDLING:
If the artwork includes a black background and the garment itself is black,
treat the black garment surface as the visual negative space of the artwork.
Do not create a visible rectangular, square or boxed black background around the print.

The artwork must appear directly printed onto the fabric.
It must follow the natural textile surface.

COMPOSITION:
Complete garments visible from edge to edge.
Straight overhead 90-degree camera.
Horizontal side-by-side composition.
Equal visual scale.
Equal spacing.
Centered composition.

BACKGROUND:
Pure white seamless background.

PHOTOGRAPHY:
Soft diffused studio lighting.
Very soft contact shadows.
Realistic textile texture.
Subtle natural wrinkles.
Accurate garment proportions.
Sharp print details.
Natural realistic colors.
Photorealistic commercial e-commerce product photography.
`
      .replace(/\n{3,}/g, "\n\n")
      .trim();

    console.log(
      "=== GEMINI STRUCTURED ARTWORK ===",
    );

    console.log(
      JSON.stringify(
        artwork,
        null,
        2,
      ),
    );

    console.log(
      "=== FINAL STABILITY PROMPT ===",
    );

    console.log(finalPrompt);

    // ============================================================
    // STABILITY KEYS
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
    // STABILITY GENERATION
    // ============================================================

    let generatedImageUrl = "";

    const stabilityErrors: string[] = [];

    for (
      let i = 0;
      i < stabilityKeys.length;
      i++
    ) {
      try {
        console.log(
          `Stability AI: ${i + 1}/${stabilityKeys.length}`,
        );

        generatedImageUrl =
          await generateAndUpload(
            finalPrompt,
            negativePrompt,
            stabilityKeys[i],
            supabase,
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
      }
    }

    if (!generatedImageUrl) {
      throw createError({
        statusCode: 500,
        message:
          `Stability AI ishlamadi. ${stabilityErrors.join(
            " | ",
          )}`,
      });
    }

    // ============================================================
    // FULL RESPONSE
    // ============================================================

    return {
      success: true,

      frontImage: generatedImageUrl,

      product: {
        productType: englishProductName,
        productName,
        fabric,
        color,
        style,
      },

      artwork,

      translatedPrompt:
        artwork.artworkDescription,

      prompt: finalPrompt,

      negativePrompt,

      metadata: {
        aspectRatio: "16:9",
        hasReferenceImage:
          Boolean(uploadedImageUrl),
        provider: "stability-ai",
        textAnalyzer: "gemini-3.6-flash",
      },
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