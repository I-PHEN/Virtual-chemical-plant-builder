import { NextRequest, NextResponse } from "next/server";
import ZAI from "z-ai-web-dev-sdk";

export const runtime = "nodejs";
export const maxDuration = 30;

/**
 * Text-to-Speech endpoint using the z-ai SDK's neural TTS.
 * Returns audio data that the browser plays — much better quality than
 * the robotic Web Speech API voices.
 */
export async function POST(req: NextRequest) {
  let body: { text: string; voice?: string };
  try {
    body = (await req.json()) as { text: string; voice?: string };
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const text = (body.text ?? "").trim();
  if (!text) {
    return NextResponse.json({ error: "Empty text" }, { status: 400 });
  }

  try {
    const zai = await ZAI.create();
    const result = await zai.audio.tts.create({
      input: text,
    });

    // The result should contain audio data — return it as an audio blob
    // The SDK may return different formats, so we handle both
    if (result instanceof Buffer || result instanceof ArrayBuffer) {
      const buf = result instanceof Buffer ? result : Buffer.from(result);
      return new NextResponse(buf, {
        headers: {
          "Content-Type": "audio/mpeg",
          "Content-Length": buf.length.toString(),
        },
      });
    }

    // If it's a different shape, try to extract audio
    if (result?.data) {
      const buf = Buffer.from(result.data);
      return new NextResponse(buf, {
        headers: {
          "Content-Type": "audio/mpeg",
          "Content-Length": buf.length.toString(),
        },
      });
    }

    // Fallback — return JSON so the client knows to use browser TTS
    return NextResponse.json(
      { error: "TTS returned unexpected format", fallback: true },
      { status: 200 }
    );
  } catch (err) {
    console.error("[tts] error", err);
    return NextResponse.json(
      { error: "TTS failed", fallback: true },
      { status: 200 }
    );
  }
}
