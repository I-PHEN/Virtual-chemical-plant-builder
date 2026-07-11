import { NextRequest, NextResponse } from "next/server";
import ZAI from "z-ai-web-dev-sdk";

export const runtime = "nodejs";
export const maxDuration = 30;

/**
 * Text-to-Speech endpoint.
 * Tries ElevenLabs first (if API key is available), falls back to z-ai SDK.
 * Returns audio as a WAV/MP3 blob for the browser to play.
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

  // Check for ElevenLabs API key
  const elevenLabsKey = process.env.ELEVENLABS_API_KEY;

  if (elevenLabsKey) {
    try {
      // Use ElevenLabs Multilingual v2 for best quality
      const voiceId = body.voice || "pNInz6obpgDQGcFmaJgB"; // "Adam" — a good default male voice
      const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "xi-api-key": elevenLabsKey,
        },
        body: JSON.stringify({
          text,
          model_id: "eleven_multilingual_v2",
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75,
            style: 0.3,
            use_speaker_boost: true,
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`ElevenLabs returned ${response.status}`);
      }

      const audioBuffer = await response.arrayBuffer();
      return new NextResponse(audioBuffer, {
        headers: {
          "Content-Type": "audio/mpeg",
          "Content-Length": audioBuffer.byteLength.toString(),
        },
      });
    } catch (err) {
      console.error("[tts] ElevenLabs failed, falling back to z-ai SDK", err);
    }
  }

  // Fallback: z-ai SDK TTS
  try {
    const zai = await ZAI.create();
    const result = await zai.audio.tts.create({
      input: text,
    });

    if (result instanceof Buffer || result instanceof ArrayBuffer) {
      const buf = result instanceof Buffer ? result : Buffer.from(result);
      return new NextResponse(buf, {
        headers: {
          "Content-Type": "audio/mpeg",
          "Content-Length": buf.length.toString(),
        },
      });
    }

    if (result?.data) {
      const buf = Buffer.from(result.data);
      return new NextResponse(buf, {
        headers: {
          "Content-Type": "audio/mpeg",
          "Content-Length": buf.length.toString(),
        },
      });
    }

    // If TTS returned unexpected format, signal fallback to browser TTS
    return NextResponse.json({ error: "TTS returned unexpected format", fallback: true }, { status: 200 });
  } catch (err) {
    console.error("[tts] error", err);
    return NextResponse.json({ error: "TTS failed", fallback: true }, { status: 200 });
  }
}
