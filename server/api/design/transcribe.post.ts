import {
    GoogleGenAI,
    createUserContent,
    createPartFromUri,
} from "@google/genai";

const MAX_AUDIO_SIZE = 15 * 1024 * 1024;

const ALLOWED_MIME_TYPES = [
    "audio/webm",
    "audio/ogg",
    "audio/opus",
    "audio/mp4",
    "audio/m4a",
    "audio/mpeg",
    "audio/mp3",
    "audio/wav",
    "audio/aac",
];

export default defineEventHandler(async (event) => {
    const config = useRuntimeConfig();

    const geminiApiKey =
        process.env.GEMINI_API_KEY ||
        process.env.NUXT_GEMINI_API_KEY ||
        config.geminiApiKey ||
        "";

    if (!geminiApiKey) {
        throw createError({
            statusCode: 500,
            statusMessage: "GEMINI_API_KEY is not configured",
        });
    }

    const form = await readMultipartFormData(event);

    if (!form) {
        throw createError({
            statusCode: 400,
            statusMessage: "Multipart form data is required",
        });
    }

    const audio = form.find(
        (item) => item.name === "audio",
    );

    if (!audio?.data?.length) {
        throw createError({
            statusCode: 400,
            statusMessage: "Audio is required",
        });
    }

    if (audio.data.length > MAX_AUDIO_SIZE) {
        throw createError({
            statusCode: 413,
            statusMessage: "Audio file is too large",
        });
    }

    const rawMimeType =
        audio.type || "audio/webm";

    const mimeType =
        rawMimeType
            .split(";")[0]
            .toLowerCase();

    if (!ALLOWED_MIME_TYPES.includes(mimeType)) {
        throw createError({
            statusCode: 400,
            statusMessage:
                `Unsupported audio format: ${rawMimeType}`,
        });
    }

    console.log(
        "=== FABRIKA TRANSCRIBE REQUEST ===",
    );

    console.log("mimeType:", mimeType);
    console.log("size:", audio.data.length);

    const ai = new GoogleGenAI({
        apiKey: geminiApiKey,
    });

    try {
        // ---------------------------------------------------------
        // 1. Upload audio to Gemini Files API
        // ---------------------------------------------------------

        const audioBlob = new Blob(
            [audio.data],
            {
                type: mimeType,
            },
        );

        const audioFile =
            await ai.files.upload({
                file: audioBlob,

                config: {
                    mimeType,
                },
            });

        if (!audioFile.uri) {
            throw new Error(
                "Gemini file upload did not return a URI",
            );
        }

        console.log(
            "Gemini file uploaded:",
            audioFile.name,
        );

        console.log(
            "Gemini file URI:",
            audioFile.uri,
        );

        // ---------------------------------------------------------
        // 2. Transcribe audio
        // ---------------------------------------------------------

        const response =
            await ai.models.generateContent({
                model:
                    "gemini-3.5-transcribe",

                contents: createUserContent([
                    createPartFromUri(
                        audioFile.uri,
                        audioFile.mimeType ||
                        mimeType,
                    ),
                ]),

                config: {
                    audioTranscriptionConfig: {
                        customVocabulary: [
                            "Fabrika",
                            "Chat Wear",
                            "Gemini",
                            "Nano Banana",
                            "AI",
                            "футболка",
                            "худи",
                            "свитшот",
                            "лонгслив",
                            "майка",
                            "принт",
                            "дизайн",
                            "рисунок",
                            "логотип",
                            "рукав",
                            "грудь",
                            "спина",
                            "капюшон",
                            "хлопок",
                            "черный",
                            "белый",
                            "красный",
                            "синий",
                            "зеленый",
                            "черный фон",
                            "белый фон",
                        ],
                    },
                },
            });

        const transcriptionTexts: string[] = [];

        for (
            const candidate of response.candidates ?? []
        ) {
            for (
                const part of candidate.content?.parts ?? []
            ) {
                const transcription =
                    part.audioTranscription;

                if (
                    transcription?.text?.trim()
                ) {
                    transcriptionTexts.push(
                        transcription.text.trim(),
                    );
                }
            }
        }

        const text =
            transcriptionTexts.join(" ").trim();

        if (!text) {
            console.error(
                "Gemini transcription response:",
                JSON.stringify(
                    response,
                    null,
                    2,
                ),
            );

            throw new Error(
                "Gemini returned empty transcription",
            );
        }

        console.log(
            "=== TRANSCRIPTION RESULT ===",
        );

        console.log(text);

        return {
            success: true,

            text,

            model:
                "gemini-3.5-transcribe",

            language: "auto",
        };
    } catch (error: any) {
        console.error(
            "TRANSCRIBE ERROR:",
            error,
        );

        throw createError({
            statusCode: 502,
            statusMessage:
                error?.message ||
                "Speech recognition failed",
        });
    }
});