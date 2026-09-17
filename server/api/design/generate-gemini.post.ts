import { GoogleGenAI } from "@google/genai";

export default defineEventHandler(async () => {
  const config = useRuntimeConfig();

  if (!config.geminiApiKey) {
    throw createError({
      statusCode: 500,
      statusMessage: "GEMINI_API_KEY is not configured",
    });
  }

  const ai = new GoogleGenAI({
    apiKey: config.geminiApiKey,
  });

  const prompt = `
Create a photorealistic commercial e-commerce flat-lay product photograph.

CRITICAL PRODUCT REQUIREMENTS:

EXACTLY TWO physical garments.

Both garments MUST be:
- identical white t-shirts
- the exact same garment model
- the exact same size
- the exact same proportions
- the exact same fabric
- the exact same construction
- the exact same color

The two garments must look like two copies of the same t-shirt.

LAYOUT:

Place the two t-shirts horizontally side-by-side.

LEFT T-SHIRT:
- complete FRONT view
- the entire front of the shirt must be visible

RIGHT T-SHIRT:
- complete BACK view
- the entire back of the shirt must be visible

The left shirt and right shirt must be the same physical garment design shown from opposite sides.

Both shirts must have equal visual scale.

Both shirts must have approximately identical dimensions in the image.

Keep clear white space between the two garments.

GARMENT:

Plain white cotton t-shirts.

The shirts are empty and unworn.

No human body.
No person.
No mannequin.
No model.
No hanger.
No accessories.

BACKGROUND:

Completely pure white #FFFFFF seamless background.

No table.
No floor.
No studio surface.
No gray background.
No beige background.
No shadows outside the garments.

CAMERA:

Straight overhead 90-degree camera.

True flat-lay product photography.

No perspective distortion.

Both complete garments must be visible from collar to bottom hem.

ARTWORK:

Both shirts feature the same minimalist graphic:
a white full moon centered inside a solid black rectangular graphic area.

The same graphic must appear on both garments.

The graphic must be clearly visible and physically printed on the fabric.

Do not omit the graphic.

The artwork must remain consistent in:
- subject
- colors
- proportions
- placement
- visual identity

STRICT EXCLUSIONS:

Do not generate:
- people
- human arms
- human hands
- mannequins
- models
- additional garments
- extra objects
- folded shirts
- cropped shirts
- overlapping shirts
- different shirt designs
- different shirt colors
- different shirt sizes
- different shirt proportions
- black or gray backgrounds
- beige backgrounds
- furniture
- tables
- hangers
- multiple views beyond the two requested garments
- collage panels
- fashion editorial photography

The final image must contain ONLY:
1. one white t-shirt shown from the front on the left
2. one identical white t-shirt shown from the back on the right
3. pure white background
`;

  try {
    console.log("=== GEMINI NANO BANANA 2 TEST A ===");
    console.log(prompt);

    const response = await ai.models.generateContent({
      model: "gemini-3.1-flash-image",
      contents: prompt,
      config: {
        responseModalities: ["Image"],
        imageConfig: {
          aspectRatio: "16:9",
          imageSize: "2K",
        },
      },
    });

    const parts = response.candidates?.[0]?.content?.parts ?? [];

    const imagePart = parts.find(
      (part) =>
        "inlineData" in part &&
        part.inlineData?.data,
    );

    if (
      !imagePart ||
      !("inlineData" in imagePart) ||
      !imagePart.inlineData?.data
    ) {
      console.error("Gemini response:", JSON.stringify(response, null, 2));

      throw createError({
        statusCode: 502,
        statusMessage: "Gemini did not return an image",
      });
    }

    const mimeType =
      imagePart.inlineData.mimeType || "image/png";

    const base64 = imagePart.inlineData.data;

    console.log("=== GEMINI IMAGE GENERATED ===");
    console.log("mimeType:", mimeType);
    console.log("base64 length:", base64.length);

    return {
      success: true,
      model: "gemini-3.1-flash-image",
      test: "A",
      mimeType,
      image: `data:${mimeType};base64,${base64}`,
    };
  } catch (error: any) {
    console.error("=== GEMINI IMAGE ERROR ===");
    console.error(error);

    throw createError({
      statusCode: 500,
      statusMessage:
        error?.message || "Gemini image generation failed",
    });
  }
});