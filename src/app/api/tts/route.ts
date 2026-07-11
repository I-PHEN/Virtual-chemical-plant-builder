import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 30;

/**
 * Text-to-Speech endpoint.
 * Priority: Cartesia → Deepgram → z-ai SDK → browser TTS fallback.
 * 
 * Deepgram Aura-2: natural neural voices, $200 free credit, no CC needed.
 * Uses WebSocket API for low latency (~150-250ms TTFB).
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

  // ─── 1. Cartesia (primary — best quality when credits available) ───
  const cartesiaKey = process.env.CARTESIA_API_KEY;
  if (cartesiaKey) {
    try {
      const voiceId = body.voice || "db6b0ed5-d5d3-463d-ae85-518a07d3c2b4";
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
          output_format: { container: "wav", sample_rate: 24000, encoding: "pcm_s16le" },
        }),
      });
      if (response.ok) {
        const audioBuffer = await response.arrayBuffer();
        return new NextResponse(audioBuffer, {
          headers: { "Content-Type": "audio/wav", "Content-Length": audioBuffer.byteLength.toString(), "Cache-Control": "private, max-age=600" },
        });
      }
    } catch (err) {
      console.error("[tts] Cartesia failed", err);
    }
  }

  // ─── 2. Deepgram Aura-2 (secondary — free $200 credit) ───
  const deepgramKey = process.env.DEEPGRAM_API_KEY;
  if (deepgramKey) {
    try {
      // Deepgram Aura TTS API — REST endpoint
      // Available voices: aura-asteria-en (female), aura-luna-en (female),
      // aura-stella-en (female), aura-athena-en (female), aura-hera-en (female),
      // aura-orion-en (male), aura-arcas-en (male), aura-perseus-en (male),
      // aura-boreas-en (male), aura-helios-en (male)
      const voice = body.voice === "male" ? "aura-orion-en" : "aura-asteria-en";
      
      const response = await fetch("https://api.deepgram.com/v1/speak?model=aura-asteria-en", {
        method: "POST",
        headers: {
          "Authorization": `Token ${deepgramKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: text,
        }),
      });

      if (response.ok) {
        const audioBuffer = await response.arrayBuffer();
        return new NextResponse(audioBuffer, {
          headers: { "Content-Type": "audio/mpeg", "Content-Length": audioBuffer.byteLength.toString(), "Cache-Control": "private, max-age=600" },
        });
      } else {
        const errText = await response.text();
        console.error("[tts] Deepgram error:", response.status, errText.substring(0, 200));
      }
    } catch (err) {
      console.error("[tts] Deepgram failed", err);
    }
  }

  // ─── 3. z-ai SDK (fallback) ───
  try {
    const ZAI = (await import("z-ai-web-dev-sdk")).default;
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
