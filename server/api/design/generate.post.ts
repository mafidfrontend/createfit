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

  if (!trimmed || trimmed.toLowerCase() === "null") {
    return fallback;
  }

  return trimmed;
}

function normalizeColor(value: unknown): string {
  const color = normalizeText(value, "");

  if (!color) {
    return "unspecified";
  }

  return color;
}

function detectProductType(
  productName: string,
  productType?: string,
): string {
  const name = productName.toLowerCase().trim();
  const type = (productType || "").toLowerCase().trim();

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

function isCottonFabric(fabric: string): boolean {
  const value = fabric.toLowerCase();

  return (
    value.includes("хлопок") ||
    value.includes("хб") ||
    value.includes("cotton") ||
    value.includes("пахта")
  );
}

function isBlackColor(color: string): boolean {
  const value = color.toLowerCase();

  return (
    value === "black" ||
    value.includes("черн") ||
    value.includes("чёрн") ||
    value.includes("black")
  );
}

/* ============================================================
   STABILITY IMAGE GENERATION
============================================================ */

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

  const uniqueFileName =
    `ai-generated-${Date.now()}-${Math.random()
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

  const publicUrl = publicUrlData?.publicUrl;

  if (!publicUrl) {
    throw new Error(
      "Supabase public URL yaratilmadi",
    );
  }

  return publicUrl;
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
      "Gemini API kaliti topilmadi",
    );
  }

  const ai = new GoogleGenAI({
    apiKey: geminiApiKey,
  });

  let lastError: Error | null = null;

  const instruction = `
Analyze the user's design idea and convert it into a structured
description of the VISUAL ARTWORK ONLY.

USER DESIGN IDEA:
"${userPrompt}"

RULES:

1. Return the complete JSON object required by the schema.
2. All descriptive values MUST be in English.
3. Preserve the user's original visual intent exactly.
4. Do not invent major objects, symbols, subjects, or colors.
5. Describe only the artwork.
6. Do not mention:
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
   - camera
   - lighting
   - studio
   - catalog
   - mockup
7. If the user explicitly mentions an artwork background, preserve it.
8. If the user mentions a color, preserve it.
9. If the user mentions a specific composition, preserve it.
10. artworkDescription must be one concise but visually useful English sentence.
11. Do not translate the user's idea into a different concept.

Example input:
"с белой луной на чёрном фоне"

Example interpretation:
- main subject: white moon
- colors: white, black
- style: minimalist graphic
- composition: centered
- background: solid black
`;

  for (
    let attempt = 1;
    attempt <= maxRetries;
    attempt++
  ) {
    try {
      console.log(
        `Gemini structured analysis: ${attempt}/${maxRetries}`,
      );

      const response =
        await ai.models.generateContent({
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

      console.log(
        "Gemini raw JSON:",
        rawText,
      );

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
    `Gemini structured output ishlamadi: ${lastError?.message ||
    "Noma'lum xato"
    }`,
  );
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
        "=== FABRIKA AI GENERATION ===",
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
         SUPABASE
      -------------------------------------------------------- */

      const supabaseUrl =
        process.env.SUPABASE_URL ||
        process.env.VITE_SUPABASE_URL;

      const serviceKey =
        process.env.SUPABASE_SERVICE_ROLE_KEY;

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

      const isTshirt =
        englishProductName ===
        "t-shirt";

      const isCotton =
        isCottonFabric(
          fabric,
        );

      const isBlack =
        isBlackColor(
          color,
        );

      /* --------------------------------------------------------
         GEMINI
      -------------------------------------------------------- */

      const geminiApiKey =
        process.env.GEMINI_API_KEY ||
        process.env.VITE_GEMINI_API_KEY ||
        "";

      let artwork: ArtworkAnalysis;

      if (!geminiApiKey) {
        throw createError({
          statusCode: 500,
          message:
            "GEMINI_API_KEY topilmadi.",
        });
      }

      try {
        artwork =
          await analyzeArtworkWithGemini(
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
          message:
            `Gemini structured output xatosi: ${geminiError?.message ||
            "Noma'lum xato"
            }`,
        });
      }

      /* --------------------------------------------------------
         GARMENT INSTRUCTION
      -------------------------------------------------------- */

      let garmentInstruction =
        "";

      if (isTshirt) {
        garmentInstruction = `
Both garments are classic short-sleeve t-shirts.
Standard short sleeves.
Standard crew-neck t-shirt silhouette.
`;
      } else {
        garmentInstruction = `
Both garments clearly match the exact requested
${englishProductName} silhouette.
Do not change the product type.
`;
      }

      /* --------------------------------------------------------
         PRINT STYLE
      -------------------------------------------------------- */

      let printStyleInstruction =
        "";

      if (isCotton) {
        printStyleInstruction = `
For the LEFT front-view garment:
place the artwork as a clean, clearly visible
print on the upper-left chest area.

For the RIGHT back-view garment:
place the EXACT SAME artwork in the corresponding
upper-back print position.

Keep all remaining garment fabric plain.
`;
      } else {
        printStyleInstruction = `
Apply the EXACT SAME artwork consistently
across both garments as an all-over print.

The same artwork identity, colors and composition
must remain consistent on both garments.
`;
      }

      /* --------------------------------------------------------
         ARTWORK DETAILS
      -------------------------------------------------------- */

      const artworkDetails = [
        `Main subject: ${artwork.mainSubject
        }`,

        `Colors: ${artwork.colors.length
          ? artwork.colors.join(
            ", ",
          )
          : "preserve the artwork's original colors"
        }`,

        `Style: ${artwork.style ||
        style
        }`,

        `Composition: ${artwork.composition ||
        "preserve the requested composition"
        }`,

        `Important details: ${artwork.details.length
          ? artwork.details.join(
            ", ",
          )
          : "preserve all recognizable details"
        }`,

        `Artwork background: ${artwork.background ||
        "preserve the requested background"
        }`,
      ].join(". ");

      /* --------------------------------------------------------
         BLACK BACKGROUND LOGIC
      -------------------------------------------------------- */

      let blackBackgroundInstruction =
        "";

      if (
        isBlack &&
        artwork.background
          .toLowerCase()
          .includes("black")
      ) {
        blackBackgroundInstruction = `
The garment itself is black and the artwork also describes
black background space.

Use the black garment surface as the visual black negative space
of the artwork.

Do NOT create a visible black rectangle, black square,
boxed background, panel or framed area behind the moon.
The artwork should blend naturally into the black garment.
`;
      } else {
        blackBackgroundInstruction = `
Preserve the artwork background according to the artwork description,
but keep the print naturally integrated into the garment.
`;
      }

      /* --------------------------------------------------------
         NEGATIVE PROMPT
      -------------------------------------------------------- */

      const negativePrompt = `
person, human, model, mannequin, dress form,
body, torso, head, face, hands, arms, legs, skin,

hanger, hook, clothing rack, clips, stand,

shoes, sneakers, socks, pants, jeans, shorts,
skirt, bag, sunglasses, glasses, watch,
jewelry, hat, phone, furniture, props,
accessories,

extra object, extra garment, third garment,
more than two garments, duplicate garment,
duplicate objects,

overlapping garments, touching garments,
stacked garments, one garment on another,
vertical arrangement, folded clothes,
rolled clothes, tangled fabric,

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

blank garment, plain garment,
missing print, missing graphic,
invisible design, altered graphic,
warped graphic, distorted graphic,
duplicated graphic, random graphic,
blurry print, illegible design,

black rectangle, black square,
rectangular background, background box,
printed box, artwork panel,
framed graphic, visible rectangular print background,

low resolution, pixelated, noise, artifacts,
CGI, 3D render, illustration,
cartoon, painting,

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

      /* --------------------------------------------------------
         FINAL STABILITY PROMPT
      -------------------------------------------------------- */

      const finalPrompt = `
Photorealistic commercial e-commerce flat-lay product photograph.

EXACTLY TWO identical ${englishProductName} garments.

GARMENT COLOR:
Both garments are solid ${color}.
Both garments have exactly the same garment color.

PRODUCT CONSISTENCY:
Both garments are two physical copies of the exact same product.

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
They are completely separate.
There is clear empty white space between them.
They do not overlap or touch.

VIEW:
LEFT garment = complete front view.
RIGHT garment = complete back view.

${garmentInstruction}

ARTWORK:
${artwork.artworkDescription}

ARTWORK DETAILS:
${artworkDetails}

PRINT CONSISTENCY:
The EXACT SAME artwork must appear on BOTH garments.

Preserve:
- the same subject
- the same colors
- the same composition
- the same proportions
- the same recognizable visual identity

Do not redesign the artwork.
Do not reinterpret it.
Do not simplify it.
Do not create a different version for the second garment.

PRINT PLACEMENT:
${printStyleInstruction}

${blackBackgroundInstruction}

The artwork is a real physical print directly integrated
into the textile surface.

The print follows the natural surface of the fabric.
The print remains sharp and recognizable.

COMPOSITION:
The complete garments are visible edge to edge.
Straight overhead 90-degree camera.
Horizontal side-by-side composition.
LEFT = front.
RIGHT = back.
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
Accurate proportions.
Natural realistic colors.
Sharp print details.
Photorealistic commercial e-commerce product photography.
`
        .replace(/\n{3,}/g, "\n\n")
        .trim();

      /* --------------------------------------------------------
         LOGS
      -------------------------------------------------------- */

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

      console.log(
        finalPrompt,
      );

      /* --------------------------------------------------------
         STABILITY KEYS
      -------------------------------------------------------- */

      const keysEnv =
        process.env.STABILITY_API_KEYS ||
        process.env.STABILITY_API_KEY ||
        "";

      const stabilityKeys =
        keysEnv
          .split(",")
          .map(
            (key) =>
              key.trim(),
          )
          .filter(Boolean);

      if (
        stabilityKeys.length === 0
      ) {
        throw createError({
          statusCode: 500,
          message:
            "Stability AI kalitlari topilmadi.",
        });
      }

      /* --------------------------------------------------------
         STABILITY GENERATION
      -------------------------------------------------------- */

      let generatedImageUrl = "";

      const stabilityErrors: string[] =
        [];

      for (
        let i = 0;
        i <
        stabilityKeys.length;
        i++
      ) {
        try {
          console.log(
            `Stability AI: ${i + 1
            }/${stabilityKeys.length}`,
          );

          generatedImageUrl =
            await generateAndUpload(
              finalPrompt,
              negativePrompt,
              stabilityKeys[i],
              supabase,
            );

          console.log(
            `Stability AI muvaffaqiyatli: key ${i + 1
            }`,
          );

          break;
        } catch (error: any) {
          const message =
            error?.message ||
            "Noma'lum Stability xatosi";

          stabilityErrors.push(
            `Key ${i + 1
            }: ${message}`,
          );

          console.error(
            "STABILITY AI XATOLIGI:",
            message,
          );
        }
      }

      if (
        !generatedImageUrl
      ) {
        throw createError({
          statusCode: 500,
          message:
            `Stability AI ishlamadi. ${stabilityErrors.join(
              " | ",
            )
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

        negativePrompt,

        metadata: {
          aspectRatio:
            "16:9",

          hasReferenceImage:
            Boolean(
              uploadedImageUrl,
            ),

          provider:
            "stability-ai",

          textAnalyzer:
            "gemini-3.6-flash",
        },
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