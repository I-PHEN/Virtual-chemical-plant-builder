import { NextRequest, NextResponse } from "next/server";
import ZAI from "z-ai-web-dev-sdk";

export const runtime = "nodejs";
export const maxDuration = 30;

/**
 * Text-to-Speech endpoint.
 * Priority: Cartesia (sonic-3.5) → z-ai SDK → browser TTS fallback.
 * Cartesia returns WAV audio at 24kHz — sub-90ms TTFB.
 */
export async function POST(req: NextRequest) {
  let body: { text: string; voice?: string; emotion?: string };
  try {
    body = (await req.json()) as { text: string; voice?: string; emotion?: string };
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const text = (body.text ?? "").trim();
  if (!text) {
    return NextResponse.json({ error: "Empty text" }, { status: 400 });
  }

  // ─── Cartesia (primary) ───
  const cartesiaKey = process.env.CARTESIA_API_KEY;
  if (cartesiaKey) {
    try {
      // Use sonic-3.5 model — best quality + sub-90ms TTFB
      // Default voice: "Skylar - Friendly Guide" (natural conversational female)
      // Other options: Corey (male), Katie, Gemma
      const voiceId = body.voice || "db6b0ed5-d5d3-463d-ae85-518a07d3c2b4"; // Skylar

      const response = await fetch("https://api.cartesia.ai/tts/bytes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${cartesiaKey}`,
          "Cartesia-Version": "2026-03-01",
        },
        body: JSON.stringify({
          model_id: "sonic-3.5",
          transcript: text,
          voice: voiceId,
          output_format: {
            container: "wav",
            sample_rate: 24000,
            encoding: "pcm_f32le",
          },
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        console.error("[tts] Cartesia error:", response.status, errText);
        throw new Error(`Cartesia returned ${response.status}`);
      }

      const audioBuffer = await response.arrayBuffer();
      return new NextResponse(audioBuffer, {
        headers: {
          "Content-Type": "audio/wav",
          "Content-Length": audioBuffer.byteLength.toString(),
          "Cache-Control": "private, max-age=600",
        },
      });
    } catch (err) {
      console.error("[tts] Cartesia failed, falling back to z-ai SDK", err);
    }
  }

  // ─── z-ai SDK (fallback) ───
  try {
    const zai = await ZAI.create();
    const result = await zai.audio.tts.create({ input: text });

    if (result instanceof Buffer || result instanceof ArrayBuffer) {
      const buf = result instanceof Buffer ? result : Buffer.from(result);
      return new NextResponse(buf, {
        headers: { "Content-Type": "audio/mpeg", "Content-Length": buf.length.toString() },
      });
    }

    if (result?.data) {
      const buf = Buffer.from(result.data);
      return new NextResponse(buf, {
        headers: { "Content-Type": "audio/mpeg", "Content-Length": buf.length.toString() },
      });
    }

    // If TTS returned unexpected format, signal fallback to browser TTS
    return NextResponse.json({ fallback: true, message: "TTS returned unexpected format" }, { status: 200 });
  } catch (err) {
    console.error("[tts] all TTS providers failed", err);
    // Signal the client to use browser TTS as a last resort
    return NextResponse.json({
      fallback: true,
      message: "All TTS providers failed — use browser SpeechSynthesis",
    }, { status: 200 });
  }
}

// ─── Cartesia voice IDs ───
// These are the built-in voices available on all plans:
// Skylar (female, friendly guide): db6b0ed5-d5d3-463d-ae85-518a07d3c2b4
// Corey (male, supportive buddy): 630ed21c-2c5c-41cf-9d82-10a7fd668370
