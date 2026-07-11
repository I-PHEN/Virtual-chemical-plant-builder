import { NextRequest, NextResponse } from "next/server";
import ZAI from "z-ai-web-dev-sdk";

export const runtime = "nodejs";
export const maxDuration = 30;

/**
 * Text-to-Speech endpoint.
 * Priority: Cartesia (sonic-3.5) → z-ai SDK → browser TTS fallback.
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

  // ─── Cartesia (primary) ───
  const cartesiaKey = process.env.CARTESIA_API_KEY;
  if (cartesiaKey) {
    try {
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
            encoding: "pcm_s16le",
          },
        }),
      });

      if (response.ok) {
        const audioBuffer = await response.arrayBuffer();
        return new NextResponse(audioBuffer, {
          headers: {
            "Content-Type": "audio/wav",
            "Content-Length": audioBuffer.byteLength.toString(),
            "Cache-Control": "private, max-age=600",
          },
        });
      }

      // If 402 (quota), don't retry Cartesia for subsequent calls
      if (response.status === 402) {
        console.log("[tts] Cartesia quota exceeded — falling back");
      } else {
        console.error("[tts] Cartesia error:", response.status);
      }
    } catch (err) {
      console.error("[tts] Cartesia failed", err);
    }
  }

  // ─── z-ai SDK (fallback) ───
  try {
    const zai = await ZAI.create();
    const result = await zai.audio.tts.create({ input: text });

    if (result instanceof Buffer || result instanceof ArrayBuffer) {
      const buf = result instanceof Buffer ? result : Buffer.from(result);
      return new NextResponse(buf, {
        headers: { "Content-Type": "audio/wav", "Content-Length": buf.length.toString() },
      });
    }
    if (result?.data) {
      const buf = Buffer.from(result.data);
      return new NextResponse(buf, {
        headers: { "Content-Type": "audio/wav", "Content-Length": buf.length.toString() },
      });
    }
    return NextResponse.json({ fallback: true }, { status: 200 });
  } catch (err) {
    console.error("[tts] all TTS providers failed", err);
    return NextResponse.json({ fallback: true }, { status: 200 });
  }
}
