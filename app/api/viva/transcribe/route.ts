import { NextResponse } from "next/server";
import { aiClient } from "@/lib/api/ai-client";

export async function POST(request: Request) {
  try {
    const contentType = request.headers.get("content-type") || "";
    let audioBase64 = "";
    let audioMimeType = "audio/webm";

    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      const audioEntry = formData.get("audio");
      if (audioEntry && typeof audioEntry === "object" && "arrayBuffer" in audioEntry) {
        const arrayBuf = await (audioEntry as Blob).arrayBuffer();
        if (arrayBuf.byteLength > 0) {
          audioBase64 = Buffer.from(arrayBuf).toString("base64");
          audioMimeType = (audioEntry as Blob).type || "audio/webm";
        }
      }
    } else {
      const body = await request.json().catch(() => ({}));
      audioBase64 = body.audioBase64 || body.audio_base64 || "";
      audioMimeType = body.audioMimeType || body.audio_mime_type || "audio/webm";
    }

    if (!audioBase64) {
      return NextResponse.json(
        { success: false, message: "No audio data provided" },
        { status: 400 }
      );
    }

    const result = await aiClient.transcribeAudio({
      audioBase64,
      audioMimeType,
    });

    return NextResponse.json({
      success: true,
      transcription: result.transcription || "",
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to transcribe audio";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
