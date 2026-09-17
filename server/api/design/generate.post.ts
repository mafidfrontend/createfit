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
  frontPlacement: string;
  backPlacement: string;
};

type GenerateRequestBody = {
  productType?: string;
  productName?: string;
  fabric?: string;
  color?: string | null;
  style?: string;
  prompt?: string;
  uploadedImageUrl?: string | null;
};

/* ============================================================
   HELPERS
============================================================ */

function normalizeText(
  value: unknown,
  fallback = "",
): string {
  if (typeof value !== "string") {
    return fallback;
  }

  const trimmed = value.trim();

  if (
    !trimmed ||
    trimmed.toLowerCase() === "null"
  ) {
    return fallback;
  }

  return trimmed;
}

function normalizeColor(value: unknown): string {
  const color = normalizeText(value, "");

  return color || "unspecified";
}

function detectProductType(
  productName: string,
  productType?: string,
): string {
  const name = productName
    .toLowerCase()
    .trim();

  const type = (productType || "")
    .toLowerCase()
    .trim();

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

function getGarmentInstruction(
  productType: string,
): string {
  switch (productType) {
    case "t-shirt":
      return `
Classic short-sleeve t-shirt silhouette.
Standard crew neckline.
Short sleeves with natural symmetrical proportions.
Clean retail-ready construction.
`;

    case "hoodie":
      return `
Classic hoodie silhouette.
Proper hood construction.
Long sleeves.
Natural hoodie proportions.
Clean retail-ready construction.
`;

    case "sweatshirt":
      return `
Classic sweatshirt silhouette.
Crew neckline.
Long sleeves.
Natural sweatshirt proportions.
Clean retail-ready construction.
`;

    case "long sleeve shirt":
      return `
Classic long-sleeve shirt silhouette.
Long sleeves with natural proportions.
Correct neckline and garment construction.
Clean retail-ready construction.
`;

    default:
      return `
Use an accurate silhouette and construction appropriate
for the requested garment type.
`;
  }
}

function isBlackColor(
  color: string,
): boolean {
  const value = color.toLowerCase();

  return (
    value === "black" ||
    value.includes("черн") ||
    value.includes("чёрн") ||
    value.includes("black")
  );
}

function mimeTypeToExtension(
  mimeType: string,
): string {
  const value =
    mimeType.toLowerCase();

  if (value.includes("jpeg")) {
    return "jpg";
  }

  if (value.includes("webp")) {
    return "webp";
  }

  return "png";
}

/* ============================================================
   GEMINI STRUCTURED ARTWORK ANALYSIS
============================================================ */

async function analyzeArtworkWithGemini(
  geminiApiKey: string,
  userPrompt: string,
  maxRetries = 3,
): Promise<ArtworkAnalysis> {
  if (!geminiApiKey) {
    throw new Error(
      "Gemini API kaliti topilmadi.",
    );
  }

  const ai = new GoogleGenAI({
    apiKey: geminiApiKey,
  });

  let lastError: Error | null = null;

  const instruction = `
You are the visual artwork specification engine for Fabrika,
a custom clothing e-commerce platform.

Convert the user's design request into a precise structured
description of the VISUAL ARTWORK ONLY.

USER DESIGN IDEA:
"${userPrompt}"

IMPORTANT:
The user may write in Russian, Uzbek, or English.

Your job is NOT to redesign the idea.
Your job is to understand it and preserve its original intent.

RULES:

1. Return the complete JSON object required by the schema.
2. All descriptive values must be in English.
3. Preserve the user's original visual intent.
4. Do not invent major objects, symbols, subjects, colors,
   typography, or decorative elements.
5. Describe the artwork itself, not the garment.
6. Do not mention clothing, garments, t-shirts, hoodies,
   sweatshirts, people, models, mannequins, bodies,
   fabric, product photography, camera, lighting, studio,
   catalog, or mockup inside artworkDescription.
7. If the user explicitly requests a background for the artwork,
   preserve it.
8. If the user explicitly requests colors, preserve them.
9. If the user explicitly requests a composition, preserve it.
10. If the user explicitly requests a placement, preserve it.
11. mainSubject must identify the primary visual subject.
12. colors must contain the important visible artwork colors.
13. style must describe the visual style.
14. composition must describe arrangement and visual structure.
15. details must contain important recognizable details.
16. artworkDescription must be one concise but useful English sentence.
17. frontPlacement must describe where the artwork should appear
    on the FRONT garment.
18. backPlacement must describe where the artwork should appear
    on the BACK garment.
19. If the user does not specify front/back placement,
    choose a simple commercially reasonable placement,
    but do not change the artwork itself.
20. Never turn a simple requested artwork into a different design.

Example input:
"с белой луной на чёрном фоне"

Correct interpretation:
- mainSubject: white moon
- colors: white, black
- style: minimalist graphic
- composition: centered
- background: solid black
- frontPlacement: centered chest
- backPlacement: centered upper back
`;

  for (
    let attempt = 1;
    attempt <= maxRetries;
    attempt++
  ) {
    try {
      console.log(
        `Gemini artwork analysis: ${attempt}/${maxRetries}`,
      );

      const response =
        await ai.models.generateContent({
          model: "gemini-3.6-flash",
          contents: instruction,
          config: {
            responseMimeType:
              "application/json",

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

                frontPlacement: {
                  type: Type.STRING,
                },

                backPlacement: {
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
                "frontPlacement",
                "backPlacement",
              ],
            },
          },
        });

      const rawText =
        response?.text?.trim();

      if (!rawText) {
        throw new Error(
          "Gemini dan bo'sh JSON javob keldi.",
        );
      }

      console.log(
        "Gemini raw artwork JSON:",
        rawText,
      );

      let parsed: Partial<ArtworkAnalysis>;

      try {
        parsed =
          JSON.parse(rawText);
      } catch {
        throw new Error(
          `Gemini JSON parse xatosi: ${rawText}`,
        );
      }

      const result: ArtworkAnalysis = {
        language:
          typeof parsed.language ===
          "string"
            ? parsed.language.trim()
            : "unknown",

        artworkDescription:
          typeof parsed.artworkDescription ===
          "string"
            ? parsed.artworkDescription.trim()
            : "",

        mainSubject:
          typeof parsed.mainSubject ===
          "string"
            ? parsed.mainSubject.trim()
            : "",

        colors:
          Array.isArray(parsed.colors)
            ? parsed.colors
                .filter(
                  (
                    item,
                  ): item is string =>
                    typeof item ===
                    "string",
                )
                .map((item) =>
                  item.trim(),
                )
                .filter(Boolean)
            : [],

        style:
          typeof parsed.style ===
          "string"
            ? parsed.style.trim()
            : "",

        composition:
          typeof parsed.composition ===
          "string"
            ? parsed.composition.trim()
            : "",

        details:
          Array.isArray(
            parsed.details,
          )
            ? parsed.details
                .filter(
                  (
                    item,
                  ): item is string =>
                    typeof item ===
                    "string",
                )
                .map((item) =>
                  item.trim(),
                )
                .filter(Boolean)
            : [],

        background:
          typeof parsed.background ===
          "string"
            ? parsed.background.trim()
            : "",

        frontPlacement:
          typeof parsed.frontPlacement ===
          "string"
            ? parsed.frontPlacement.trim()
            : "centered chest",

        backPlacement:
          typeof parsed.backPlacement ===
          "string"
            ? parsed.backPlacement.trim()
            : "centered upper back",
      };

      if (
        !result.artworkDescription
      ) {
        throw new Error(
          "Gemini artworkDescription qaytarmadi.",
        );
      }

      if (
        !result.mainSubject
      ) {
        throw new Error(
          "Gemini mainSubject qaytarmadi.",
        );
      }

      console.log(
        "Gemini structured result:",
        JSON.stringify(
          result,
          null,
          2,
        ),
      );

      return result;
    } catch (error: any) {
      lastError =
        error instanceof Error
          ? error
          : new Error(
              error?.message ||
                "Noma'lum Gemini xatosi",
            );

      const errorMessage =
        lastError.message;

      const normalized =
        errorMessage.toLowerCase();

      const isAuthError =
        normalized.includes(
          "api key",
        ) ||
        normalized.includes(
          "api_key",
        ) ||
        normalized.includes(
          "authentication",
        ) ||
        normalized.includes(
          "unauthorized",
        ) ||
        normalized.includes(
          "forbidden",
        ) ||
        errorMessage.includes(
          "401",
        ) ||
        errorMessage.includes(
          "403",
        );

      if (isAuthError) {
        throw new Error(
          `Gemini autentifikatsiya xatosi: ${errorMessage}`,
        );
      }

      console.warn(
        `Gemini xatosi (${attempt}-urinish): ${errorMessage}`,
      );

      if (
        attempt === maxRetries
      ) {
        break;
      }

      const waitTime =
        Math.min(
          1000 *
            Math.pow(
              2,
              attempt - 1,
            ),
          8000,
        );

      await new Promise(
        (resolve) =>
          setTimeout(
            resolve,
            waitTime,
          ),
      );
    }
  }

  throw new Error(
    `Gemini structured output ishlamadi: ${
      lastError?.message ||
      "Noma'lum xato"
    }`,
  );
}

/* ============================================================
   GEMINI IMAGE GENERATION
============================================================ */

async function generateGeminiImage(
  geminiApiKey: string,
  prompt: string,
): Promise<{
  mimeType: string;
  base64: string;
}> {
  const ai = new GoogleGenAI({
    apiKey: geminiApiKey,
  });

  console.log(
    "Starting Nano Banana 2 generation...",
  );

  const response =
    await ai.models.generateContent({
      model:
        "gemini-3.1-flash-image",

      contents: prompt,

      config: {
        responseModalities: [
          "IMAGE",
        ],

        responseFormat: {
          image: {
            aspectRatio:
              "16:9",

            imageSize:
              "2K",
          },
        },
      },
    });

  const parts =
    response.candidates?.[0]
      ?.content?.parts ?? [];

  const imagePart =
    parts.find(
      (part) =>
        "inlineData" in part &&
        !!part.inlineData?.data,
    );

  if (
    !imagePart ||
    !("inlineData" in imagePart) ||
    !imagePart.inlineData?.data
  ) {
    console.error(
      "Nano Banana 2 response:",
      JSON.stringify(
        response,
        null,
        2,
      ),
    );

    throw new Error(
      "Nano Banana 2 rasm qaytarmadi.",
    );
  }

  return {
    mimeType:
      imagePart.inlineData
        .mimeType ||
      "image/png",

    base64:
      imagePart.inlineData.data,
  };
}

/* ============================================================
   SUPABASE IMAGE UPLOAD
============================================================ */

async function uploadGeneratedImage(
  supabase: any,
  base64: string,
  mimeType: string,
): Promise<string> {
  const imageBuffer =
    Buffer.from(
      base64,
      "base64",
    );

  if (
    imageBuffer.length === 0
  ) {
    throw new Error(
      "Generated image bo'sh.",
    );
  }

  const extension =
    mimeTypeToExtension(
      mimeType,
    );

  const uniqueFileName =
    `gemini-generated/${Date.now()}-${crypto.randomUUID()}.${extension}`;

  console.log(
    "Uploading generated image:",
    {
      fileName:
        uniqueFileName,

      sizeMB:
        (
          imageBuffer.length /
          1024 /
          1024
        ).toFixed(2),

      mimeType,
    },
  );

  const {
    error: uploadError,
  } =
    await supabase.storage
      .from("designs")
      .upload(
        uniqueFileName,
        imageBuffer,
        {
          contentType:
            mimeType,

          upsert: false,
        },
      );

  if (uploadError) {
    throw new Error(
      `Supabase Storage xatosi: ${uploadError.message}`,
    );
  }

  const {
    data: publicUrlData,
  } =
    supabase.storage
      .from("designs")
      .getPublicUrl(
        uniqueFileName,
      );

  const publicUrl =
    publicUrlData?.publicUrl;

  if (!publicUrl) {
    throw new Error(
      "Supabase public URL yaratilmadi.",
    );
  }

  return publicUrl;
}

/* ============================================================
   MAIN ENDPOINT
============================================================ */

export default defineEventHandler(
  async (event) => {
    try {
      const body =
        await readBody<GenerateRequestBody>(
          event,
        );

      /* --------------------------------------------------------
         INPUT
      -------------------------------------------------------- */

      const productType =
        normalizeText(
          body?.productType,
          "",
        );

      const productName =
        normalizeText(
          body?.productName,
          productType ||
            "garment",
        );

      const fabric =
        normalizeText(
          body?.fabric,
          "textile",
        );

      const color =
        normalizeColor(
          body?.color,
        );

      const style =
        normalizeText(
          body?.style,
          "minimal",
        );

      const userPrompt =
        normalizeText(
          body?.prompt,
          "minimalist modern abstract graphic",
        );

      const uploadedImageUrl =
        normalizeText(
          body?.uploadedImageUrl,
          "",
        );

      console.log(
        "=== FABRIKA GEMINI GENERATION ===",
      );

      console.log(
        "productName:",
        productName,
      );

      console.log(
        "productType:",
        productType,
      );

      console.log(
        "fabric:",
        fabric,
      );

      console.log(
        "color:",
        color,
      );

      console.log(
        "style:",
        style,
      );

      console.log(
        "userPrompt:",
        userPrompt,
      );

      console.log(
        "uploadedImageUrl:",
        uploadedImageUrl
          ? "provided"
          : "not provided",
      );

      /* --------------------------------------------------------
         ENVIRONMENT
      -------------------------------------------------------- */

      const geminiApiKey =
        process.env.GEMINI_API_KEY ||
        process.env.NUXT_GEMINI_API_KEY ||
        "";

      if (!geminiApiKey) {
        throw createError({
          statusCode: 500,
          message:
            "GEMINI_API_KEY topilmadi.",
        });
      }

      const supabaseUrl =
        process.env.SUPABASE_URL ||
        process.env.VITE_SUPABASE_URL ||
        "";

      const serviceKey =
        process.env.SUPABASE_SERVICE_ROLE_KEY ||
        "";

      if (
        !supabaseUrl ||
        !serviceKey
      ) {
        throw createError({
          statusCode: 500,
          message:
            "Supabase kalitlari topilmadi.",
        });
      }

      const supabase =
        createClient(
          supabaseUrl,
          serviceKey,
          {
            auth: {
              persistSession:
                false,
            },
          },
        );

      /* --------------------------------------------------------
         PRODUCT
      -------------------------------------------------------- */

      const englishProductName =
        detectProductType(
          productName,
          productType,
        );

      const garmentInstruction =
        getGarmentInstruction(
          englishProductName,
        );

      const isBlack =
        isBlackColor(
          color,
        );

      /* --------------------------------------------------------
         STEP 1: GEMINI 3.6 ANALYSIS
      -------------------------------------------------------- */

      let artwork: ArtworkAnalysis;

      try {
        artwork =
          await analyzeArtworkWithGemini(
            geminiApiKey,
            userPrompt,
            3,
          );
      } catch (
        geminiError: any
      ) {
        console.error(
          "GEMINI STRUCTURED OUTPUT ERROR:",
          geminiError,
        );

        throw createError({
          statusCode: 502,
          message:
            `Gemini artwork analysis xatosi: ${
              geminiError?.message ||
              "Noma'lum xato"
            }`,
        });
      }

      /* --------------------------------------------------------
         STEP 2: ARTWORK NORMALIZATION
      -------------------------------------------------------- */

      let normalizedArtworkDescription =
        artwork.artworkDescription;

      let normalizedArtworkBackground =
        artwork.background;

      const artworkBackground =
        artwork.background.toLowerCase();

      const artworkDescription =
        artwork.artworkDescription.toLowerCase();

      const hasBlackBackground =
        artworkBackground.includes(
          "black",
        ) ||
        artworkDescription.includes(
          "black background",
        );

      if (
        isBlack &&
        hasBlackBackground
      ) {
        normalizedArtworkDescription =
          normalizedArtworkDescription
            .replace(
              /solid black background/gi,
              "black negative space",
            )
            .replace(
              /stark black background/gi,
              "black negative space",
            )
            .replace(
              /black background/gi,
              "black negative space",
            );

        normalizedArtworkBackground =
          "black negative space integrated with the natural black garment";
      }

      /* --------------------------------------------------------
         STEP 3: PRINT INSTRUCTION
      -------------------------------------------------------- */

      const printInstruction =
        `
PRINTING REQUIREMENTS:

The artwork must appear as an actual printed graphic
on the garment surface.

FRONT:
- Front artwork placement: ${artwork.frontPlacement}

BACK:
- Back artwork placement: ${artwork.backPlacement}

The front and back artworks represent the same design identity.

Do not replace the requested artwork with another graphic.

Do not add unrelated decorative elements.

Do not turn the artwork into embroidery, a patch, sticker,
poster, floating graphic, or separate rectangular object.

The artwork must visually follow the natural surface of the garment.
`;

      /* --------------------------------------------------------
         STEP 4: FINAL IMAGE PROMPT
      -------------------------------------------------------- */

      const finalPrompt = `
Create a photorealistic commercial e-commerce flat-lay
product photograph.

EXACTLY TWO IDENTICAL GARMENTS.

GARMENT:
- Product type: ${englishProductName}
- Product name: ${productName}
- Color: ${color}
- Fabric: ${fabric}

${garmentInstruction}

The two garments must be the exact same physical garment design.

LAYOUT:

Place exactly two garments horizontally side by side.

LEFT GARMENT:
Complete FRONT view.

RIGHT GARMENT:
Complete BACK view.

Both garments must have:
- identical color
- identical size
- identical proportions
- identical construction
- identical fabric
- identical silhouette
- equal visual scale

Do not show a third garment.

ARTWORK:

${normalizedArtworkDescription}

MAIN SUBJECT:
${artwork.mainSubject}

ARTWORK COLORS:
${
  artwork.colors.length
    ? artwork.colors.join(", ")
    : "preserve the user's artwork colors"
}

ARTWORK STYLE:
${artwork.style || style}

ARTWORK COMPOSITION:
${artwork.composition || "clear and intentional composition"}

ARTWORK DETAILS:
${
  artwork.details.length
    ? artwork.details.join("; ")
    : "preserve all important recognizable visual details"
}

ARTWORK BACKGROUND:
${normalizedArtworkBackground}

${printInstruction}

${
  isBlack &&
  hasBlackBackground
    ? `
IMPORTANT BLACK GARMENT RULE:

The garment itself is black.

If the requested artwork uses black as its surrounding background,
do NOT create a visible rectangular black print area.

The natural black fabric should act as the black negative space.

Only the intended visible artwork elements should appear as printed
elements on the garment.
`
    : ""
}

PRODUCT PRESENTATION:

- Unworn garments
- No people
- No models
- No mannequins
- No body parts
- No hands
- No hanger
- No accessories
- No additional clothing

BACKGROUND:

Pure white #FFFFFF seamless background.

No room.
No furniture.
No table.
No floor.
No colored background.

CAMERA:

- Exact 90-degree overhead camera
- True flat-lay photography
- No perspective distortion
- No side angle
- No close-up crop

COMPOSITION:

- Left garment = front
- Right garment = back
- Both garments completely visible
- Equal visual scale
- Clear white space between garments
- No overlap
- Balanced centered horizontal composition

PHOTOGRAPHY:

Professional commercial e-commerce photography.

Realistic textile texture.

Natural fabric folds.

Realistic seams and garment construction.

Subtle natural contact shadows.

Crisp garment edges.

High photographic realism.

STRICTLY DO NOT GENERATE:

- people
- models
- mannequins
- faces
- hands
- body parts
- hangers
- accessories
- bags
- shoes
- extra clothing
- third garment
- different garment designs
- different garment colors
- different garment sizes
- cropped garments
- overlapping garments
- gray background
- beige background
- colored background
- table
- floor
- furniture
- room
- collage
- split-screen panels
- multiple viewpoints
- additional camera angles
- unrelated objects
- unrelated artwork
- watermarks
- logos unless explicitly requested
- text unless explicitly requested
`;

      console.log(
        "=== GEMINI 3.6 ARTWORK ===",
      );

      console.log(
        JSON.stringify(
          artwork,
          null,
          2,
        ),
      );

      console.log(
        "=== NANO BANANA 2 PROMPT ===",
      );

      console.log(
        finalPrompt,
      );

      /* --------------------------------------------------------
         STEP 5: NANO BANANA 2
      -------------------------------------------------------- */

      let generatedImage;

      try {
        generatedImage =
          await generateGeminiImage(
            geminiApiKey,
            finalPrompt,
          );
      } catch (
        imageError: any
      ) {
        console.error(
          "NANO BANANA 2 ERROR:",
          imageError,
        );

        throw createError({
          statusCode: 502,
          message:
            `Nano Banana 2 xatosi: ${
              imageError?.message ||
              "Rasm yaratilmadi"
            }`,
        });
      }

      /* --------------------------------------------------------
         STEP 6: SUPABASE STORAGE
      -------------------------------------------------------- */

      let generatedImageUrl: string;

      try {
        generatedImageUrl =
          await uploadGeneratedImage(
            supabase,
            generatedImage.base64,
            generatedImage.mimeType,
          );
      } catch (
        uploadError: any
      ) {
        console.error(
          "IMAGE STORAGE ERROR:",
          uploadError,
        );

        throw createError({
          statusCode: 502,
          message:
            `Rasmni saqlashda xatolik: ${
              uploadError?.message ||
              "Supabase Storage xatosi"
            }`,
        });
      }

      /* --------------------------------------------------------
         RESPONSE
      -------------------------------------------------------- */

      return {
        success: true,

        frontImage:
          generatedImageUrl,

        imageUrl:
          generatedImageUrl,

        product: {
          productType:
            englishProductName,

          productName,

          fabric,

          color,

          style,
        },

        artwork,

        translatedPrompt:
          artwork.artworkDescription,

        prompt:
          finalPrompt,

        metadata: {
          aspectRatio:
            "16:9",

          imageSize:
            "2K",

          hasReferenceImage:
            Boolean(
              uploadedImageUrl,
            ),

          provider:
            "google-gemini",

          analyzer:
            "gemini-3.6-flash",

          imageModel:
            "gemini-3.1-flash-image",
        },

        mimeType:
          generatedImage.mimeType,
      };
    } catch (error: any) {
      console.error(
        "DESIGN GENERATION ERROR:",
        error,
      );

      throw createError({
        statusCode:
          error?.statusCode ||
          500,

        message:
          error?.message ||
          "Dizayn yaratishda xatolik yuz berdi",
      });
    }
  },
);