export function useSpeechToText() {
  const isRecording = ref(false);
  const isTranscribing = ref(false);
  const transcript = ref("");
  const error = ref("");

  let mediaRecorder: MediaRecorder | null = null;
  let mediaStream: MediaStream | null = null;
  let audioChunks: Blob[] = [];

  function getSupportedMimeType(): string {
    const types = [
      "audio/webm;codecs=opus",
      "audio/webm",
      "audio/mp4",
      "audio/ogg;codecs=opus",
    ];

    for (const type of types) {
      if (
        typeof MediaRecorder !== "undefined" &&
        MediaRecorder.isTypeSupported(type)
      ) {
        return type;
      }
    }

    return "";
  }

  function getFileExtension(mimeType: string): string {
    const baseType = mimeType.split(";")[0].toLowerCase();

    if (baseType === "audio/mp4") return "m4a";
    if (baseType === "audio/ogg") return "ogg";
    if (baseType === "audio/mpeg") return "mp3";
    if (baseType === "audio/wav") return "wav";

    return "webm";
  }

  async function startRecording(): Promise<void> {
    error.value = "";
    transcript.value = "";

    if (!import.meta.client) return;

    if (!navigator.mediaDevices?.getUserMedia) {
      error.value =
        "Ваш браузер не поддерживает запись голоса.";
      return;
    }

    if (typeof MediaRecorder === "undefined") {
      error.value =
        "Запись голоса не поддерживается.";
      return;
    }

    try {
      mediaStream =
        await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
        });

      const mimeType = getSupportedMimeType();

      mediaRecorder = mimeType
        ? new MediaRecorder(mediaStream, { mimeType })
        : new MediaRecorder(mediaStream);

      audioChunks = [];

      mediaRecorder.ondataavailable = (
        event: BlobEvent,
      ) => {
        if (event.data?.size > 0) {
          audioChunks.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const actualMimeType =
          mediaRecorder?.mimeType ||
          mimeType ||
          "audio/webm";

        const blob = new Blob(audioChunks, {
          type: actualMimeType,
        });

        await transcribe(blob);

        mediaRecorder = null;
      };

      mediaRecorder.start();

      isRecording.value = true;
    } catch (err: any) {
      console.error(
        "Microphone error:",
        err,
      );

      error.value =
        err?.name === "NotAllowedError"
          ? "Разрешите доступ к микрофону."
          : "Не удалось получить доступ к микрофону.";
    }
  }

  function stopRecording(): void {
    if (
      !mediaRecorder ||
      mediaRecorder.state === "inactive"
    ) {
      return;
    }

    mediaRecorder.stop();

    isRecording.value = false;

    if (mediaStream) {
      mediaStream.getTracks().forEach((track) => {
        track.stop();
      });

      mediaStream = null;
    }
  }

  async function transcribe(
    audioBlob: Blob,
  ): Promise<string | null> {
    isTranscribing.value = true;
    error.value = "";

    try {
      const formData = new FormData();

      const mimeType =
        audioBlob.type || "audio/webm";

      const extension =
        getFileExtension(mimeType);

      formData.append(
        "audio",
        audioBlob,
        `voice.${extension}`,
      );

      const response = await $fetch<{
        success: boolean;
        text: string;
        language: string;
        model: string;
      }>("/api/design/transcribe", {
        method: "POST",
        body: formData,
      });

      if (
        !response.success ||
        !response.text?.trim()
      ) {
        throw new Error(
          "Не удалось распознать речь.",
        );
      }

      transcript.value =
        response.text.trim();

      return transcript.value;
    } catch (err: any) {
      console.error(
        "Speech transcription error:",
        err,
      );

      error.value =
        err?.data?.message ||
        err?.message ||
        "Не удалось распознать речь.";

      return null;
    } finally {
      isTranscribing.value = false;
    }
  }

  function reset(): void {
    if (
      mediaRecorder &&
      mediaRecorder.state !== "inactive"
    ) {
      mediaRecorder.stop();
    }

    if (mediaStream) {
      mediaStream.getTracks().forEach((track) => {
        track.stop();
      });

      mediaStream = null;
    }

    mediaRecorder = null;
    audioChunks = [];

    isRecording.value = false;
    isTranscribing.value = false;
    transcript.value = "";
    error.value = "";
  }

  onBeforeUnmount(() => {
    reset();
  });

  return {
    isRecording: readonly(isRecording),
    isTranscribing: readonly(isTranscribing),
    transcript: readonly(transcript),
    error: readonly(error),

    startRecording,
    stopRecording,
    reset,
  };
}