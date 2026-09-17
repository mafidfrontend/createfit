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

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig();
  const body = await readBody(event);

  const geminiApiKey = config.geminiApiKey;

  if (!geminiApiKey) {
    throw createError({
      statusCode: 500,
      statusMessage: "GEMINI_API_KEY is not configured",
    });
  }

  const userPrompt = String(body?.prompt ?? "").trim();
  const productName = String(body?.productName ?? "Футболка").trim();
  const color = String(body?.color ?? "black").trim();
  const fabric = String(body?.fabric ?? "cotton").trim();
  const style = String(body?.style ?? "minimal").trim();

  if (!userPrompt) {
    throw createError({
      statusCode: 400,
      statusMessage: "prompt is required",
    });
  }

  const ai = new GoogleGenAI({
    apiKey: geminiApiKey,
  });

  // =========================================================
  // STEP 1
  // Gemini 3.6 Flash
  // Analyze and normalize the user's artwork request
  // =========================================================

  const analyzerPrompt = `
You are the design specification engine for a clothing e-commerce platform.

Your task is to convert the user's clothing design request into a precise
English artwork specification for a second image-generation model.

USER REQUEST:
${userPrompt}

PRODUCT:
${productName}

FABRIC:
${fabric}

GARMENT COLOR:
${color}

STYLE:
${style}

RULES:

1. Preserve the user's requested visual idea exactly.
2. Do not invent unrelated objects or concepts.
3. Describe the artwork clearly and concretely.
4. Separate:
   - artwork
   - garment
   - background
   - placement
5. Identify the main visual subject.
6. Identify the dominant artwork colors.
7. Describe the artistic style.
8. Describe the artwork composition.
9. List important visual details.
10. Specify the front placement.
11. Specify the back placement.
12. The final image will contain exactly two identical garments.
13. The left garment is FRONT view.
14. The right garment is BACK view.
15. Both garments are the same physical garment model.
16. Do not add people, mannequins, hands, bodies, hangers, accessories,
    or worn clothing.
17. Do not add text, logos, watermarks, or extra graphical elements
    unless explicitly requested by the user.
18. Keep the artwork suitable for printing on clothing.
19. Use English for all returned descriptive fields.

Return only the requested JSON structure.
`;

  const analysisResponse = await ai.models.generateContent({
    model: "gemini-3.6-flash",
    contents: analyzerPrompt,
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

  const rawAnalysis = analysisResponse.text;

  if (!rawAnalysis) {
    throw createError({
      statusCode: 502,
      statusMessage:
        "Gemini 3.6 did not return artwork analysis",
    });
  }

  let artwork: ArtworkAnalysis;

  try {
    artwork = JSON.parse(rawAnalysis);
  } catch {
    console.error(
      "Invalid Gemini 3.6 JSON:",
      rawAnalysis,
    );

    throw createError({
      statusCode: 502,
      statusMessage:
        "Gemini 3.6 returned invalid artwork JSON",
    });
  }

  console.log(
    "=== GEMINI 3.6 ARTWORK ANALYSIS ===",
  );

  console.log(
    JSON.stringify(artwork, null, 2),
  );

  // =========================================================
  // STEP 2
  // Build final image-generation prompt
  // =========================================================

  const englishImagePrompt = `
Create a photorealistic commercial e-commerce flat-lay
product photograph of a clothing design.

GARMENT:
- Product: ${productName}
- Color: ${color}
- Fabric: ${fabric}
- Both garments are the exact same physical garment
- Same garment model
- Same size
- Same proportions
- Same construction
- Same fabric
- Same color

OUTPUT COMPOSITION:

Generate EXACTLY TWO garments.

LEFT:
- Complete FRONT view

RIGHT:
- Complete BACK view

The two garments must clearly represent the front and back
views of the exact same garment.

GARMENT POSITIONING:
- Horizontal side-by-side arrangement
- Equal visual scale
- Similar dimensions
- Clearly separated from each other
- No overlapping
- Both garments fully visible
- Neither garment cropped

ARTWORK DESCRIPTION:
${artwork.artworkDescription}

MAIN SUBJECT:
${artwork.mainSubject}

ARTWORK COLORS:
${artwork.colors.join(", ")}

ARTWORK STYLE:
${artwork.style}

ARTWORK COMPOSITION:
${artwork.composition}

ARTWORK DETAILS:
${artwork.details.join("; ")}

FRONT PLACEMENT:
${artwork.frontPlacement}

BACK PLACEMENT:
${artwork.backPlacement}

ARTWORK CONSISTENCY:
- Preserve the same artwork concept consistently
- The artwork must look intentionally printed on the fabric
- The artwork must not look like a floating overlay
- Preserve the requested colors and visual identity
- Do not invent additional artwork

PRODUCT PRESENTATION:
- Unworn garments
- No person
- No model
- No mannequin
- No body
- No hands
- No hanger
- No accessories
- No additional garments

BACKGROUND:
- Pure white #FFFFFF
- Completely clean seamless background
- No table
- No floor
- No furniture
- No room
- No environmental objects

CAMERA:
- Exact 90-degree overhead camera
- True flat-lay photography
- No perspective distortion
- No angled camera
- No side perspective

COMPOSITION:
- Left = FRONT
- Right = BACK
- Both garments centered vertically
- Equal spacing
- Clear white space between garments
- Balanced horizontal composition

PHOTOGRAPHY:
- Professional commercial e-commerce product photography
- Photorealistic
- Highly realistic textile texture
- Natural fabric folds
- Realistic seams
- Realistic garment construction
- Subtle natural contact shadows
- Crisp garment edges
- Clean studio lighting
- High photographic realism

STRICT EXCLUSIONS:
Do not generate:
- people
- models
- mannequins
- body parts
- hands
- faces
- hangers
- accessories
- bags
- shoes
- extra garments
- extra objects
- extra artwork
- additional logos
- watermarks
- cropped garments
- overlapping garments
- different garment models
- different garment sizes
- different garment colors
- gray background
- beige background
- colored background
- table
- floor
- furniture
- room
- collage
- split-screen panels
- multiple camera angles
- additional viewpoints
`;

  console.log(
    "=== NANO BANANA 2 PROMPT ===",
  );

  console.log(englishImagePrompt);

  // =========================================================
  // STEP 3
  // Nano Banana 2 / Gemini 3.1 Flash Image
  // =========================================================

  const imageResponse = await ai.models.generateContent({
    model: "gemini-3.1-flash-image",

    contents: englishImagePrompt,

    config: {
      responseModalities: ["IMAGE"],

      responseFormat: {
        image: {
          aspectRatio: "16:9",
          imageSize: "2K",
        },
      },
    },
  });

  // =========================================================
  // STEP 4
  // Extract generated image
  // =========================================================

  const parts =
    imageResponse.candidates?.[0]?.content?.parts ?? [];

  const imagePart = parts.find(
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
      JSON.stringify(imageResponse, null, 2),
    );

    throw createError({
      statusCode: 502,
      statusMessage:
        "Nano Banana 2 did not return an image",
    });
  }

  const mimeType =
    imagePart.inlineData.mimeType ||
    "image/png";

  const base64 =
    imagePart.inlineData.data;

  console.log(
    "=== GEMINI FULL GENERATION SUCCESS ===",
  );

  console.log(
    "Analyzer:",
    "gemini-3.6-flash",
  );

  console.log(
    "Image:",
    "gemini-3.1-flash-image",
  );

  console.log(
    "Mime type:",
    mimeType,
  );

  console.log(
    "Base64 length:",
    base64.length,
  );

  // =========================================================
  // STEP 5
  // Return complete pipeline result
  // =========================================================

  return {
    success: true,

    models: {
      analyzer: "gemini-3.6-flash",
      image: "gemini-3.1-flash-image",
    },

    input: {
      prompt: userPrompt,
      productName,
      color,
      fabric,
      style,
    },

    artwork,

    imagePrompt:
      englishImagePrompt,

    image:
      `data:${mimeType};base64,${base64}`,

    mimeType,
  };
});