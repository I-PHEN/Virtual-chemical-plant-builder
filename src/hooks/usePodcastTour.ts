"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useAppStore } from "@/lib/store/useAppStore";

export interface TourSegment {
  text: string;
  equipmentId?: string;
  emotion?: string;
}

/**
 * usePodcastTour — manages a pre-generated podcast-style narration tour.
 *
 * Flow:
 * 1. When a plant loads, call generateTour() to create the narration script
 * 2. The script is rendered to audio segments via the TTS API
 * 3. Segments play sequentially, synced to camera focus on the equipment
 * 4. User can interrupt (barge-in) to ask questions, then resume
 *
 * This replaces the live TTS approach for the main tour — the audio is
 * pre-rendered so there's zero latency and maximum quality.
 */
export function usePodcastTour() {
  const currentPlant = useAppStore((s) => s.currentPlant);
  const [segments, setSegments] = useState<TourSegment[]>([]);
  const [currentSegment, setCurrentSegment] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [audioBuffers, setAudioBuffers] = useState<AudioBuffer[]>([]);
  const [tourReady, setTourReady] = useState(false);

  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceNodeRef = useRef<AudioBufferSourceNode | null>(null);
  const focusEquipment = useAppStore((s) => s.focusEquipment);

  // Generate the tour script + render audio
  const generateTour = useCallback(async () => {
    if (!currentPlant) return;
    setIsGenerating(true);
    setTourReady(false);

    try {
      // Step 1: Generate the narration script
      const scriptRes = await fetch("/api/generate-tour", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plantId: currentPlant.id }),
      });
      if (!scriptRes.ok) throw new Error("Failed to generate tour script");
      const scriptData = await scriptRes.json();
      const tourSegments: TourSegment[] = scriptData.segments || [];
      setSegments(tourSegments);

      // Step 2: Render each segment to audio via TTS
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      audioContextRef.current = audioCtx;

      const buffers: AudioBuffer[] = [];
      for (const segment of tourSegments) {
        try {
          const ttsRes = await fetch("/api/tts", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text: segment.text }),
          });

          if (!ttsRes.ok) continue;
          const contentType = ttsRes.headers.get("content-type") || "";
          if (!contentType.includes("audio")) continue;

          const arrayBuffer = await ttsRes.arrayBuffer();
          const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
          buffers.push(audioBuffer);
        } catch (err) {
          console.error("[tour] TTS failed for segment, skipping", err);
          // Add a silent placeholder so indices stay aligned
          const silence = audioCtx.createBuffer(1, audioCtx.sampleRate * 2, audioCtx.sampleRate);
          buffers.push(silence);
        }
      }

      setAudioBuffers(buffers);
      setTourReady(true);
      setCurrentSegment(0);
    } catch (err) {
      console.error("[tour] generation failed", err);
    } finally {
      setIsGenerating(false);
    }
  }, [currentPlant]);

  // Play the current segment
  const play = useCallback(() => {
    if (!audioContextRef.current || audioBuffers.length === 0) return;
    if (currentSegment >= audioBuffers.length) return;

    const ctx = audioContextRef.current;
    // Resume AudioContext if suspended (browser autoplay policy)
    if (ctx.state === "suspended") {
      ctx.resume().catch(() => { /* ignore */ });
    }

    const buffer = audioBuffers[currentSegment];
    const seg = segments[currentSegment];

    // Check if this is a silent fallback buffer (duration < 2s = likely silence)
    const isSilent = buffer.duration < 2;

    // Stop any existing playback
    if (sourceNodeRef.current) {
      try { sourceNodeRef.current.stop(); } catch { /* ignore */ }
    }

    if (isSilent && seg?.text) {
      // Use browser SpeechSynthesis as fallback for this segment
      if ("speechSynthesis" in window) {
        window.speechSynthesis.cancel();
        const utter = new SpeechSynthesisUtterance(seg.text);
        utter.rate = 1.0;
        utter.onend = () => {
          // Move to next segment
          setCurrentSegment((prev) => {
            const next = prev + 1;
            if (next < audioBuffers.length) {
              const nextSeg = segments[next];
              if (nextSeg?.equipmentId) {
                focusEquipment(nextSeg.equipmentId);
              }
              setTimeout(() => play(), 300);
              return next;
            } else {
              setIsPlaying(false);
              return prev;
            }
          });
        };
        window.speechSynthesis.speak(utter);
      }
    } else {
      // Play the audio buffer normally
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.connect(ctx.destination);
      source.onended = () => {
        // Only advance if this source is still the current one
        if (sourceNodeRef.current !== source) return;
        setCurrentSegment((prev) => {
          const next = prev + 1;
          if (next < audioBuffers.length) {
            const nextSeg = segments[next];
            if (nextSeg?.equipmentId) {
              focusEquipment(nextSeg.equipmentId);
            }
            setTimeout(() => play(), 500);
            return next;
          } else {
            setIsPlaying(false);
            return prev;
          }
        });
      };
      source.start();
      sourceNodeRef.current = source;
    }

    setIsPlaying(true);

    // Focus camera on current segment's equipment
    if (seg?.equipmentId) {
      focusEquipment(seg.equipmentId);
    }
  }, [audioBuffers, currentSegment, segments, focusEquipment]);

  // Pause playback
  const pause = useCallback(() => {
    if (sourceNodeRef.current) {
      try { sourceNodeRef.current.stop(); } catch { /* ignore */ }
      sourceNodeRef.current = null;
    }
    // Also stop browser TTS if it's running
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    setIsPlaying(false);
  }, []);

  // Skip to next segment
  const skip = useCallback(() => {
    pause();
    setCurrentSegment((prev) => Math.min(prev + 1, audioBuffers.length - 1));
    setTimeout(() => play(), 300);
  }, [pause, play, audioBuffers.length]);

  // Go back to previous segment
  const back = useCallback(() => {
    pause();
    setCurrentSegment((prev) => Math.max(prev - 1, 0));
    setTimeout(() => play(), 300);
  }, [pause, play]);

  // Restart from beginning
  const restart = useCallback(() => {
    pause();
    setCurrentSegment(0);
    setTimeout(() => play(), 300);
  }, [pause, play]);

  // Check for pre-generated tour (from build phase) on mount
  useEffect(() => {
    const checkPreGenerated = () => {
      const pre = (window as any).__preGeneratedTour;
      if (pre?.ready) {
        setSegments(pre.segments);
        setAudioBuffers(pre.audioBuffers);
        audioContextRef.current = pre.audioContext;
        setTourReady(true);
        setCurrentSegment(0);
        return true;
      }
      return false;
    };

    // Check immediately
    if (!checkPreGenerated()) {
      // Poll every 2 seconds for up to 60 seconds (while build is generating)
      let attempts = 0;
      const interval = setInterval(() => {
        attempts++;
        if (checkPreGenerated() || attempts > 30) {
          clearInterval(interval);
        }
      }, 2000);
      return () => clearInterval(interval);
    }
  }, [currentPlant]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (sourceNodeRef.current) {
        try { sourceNodeRef.current.stop(); } catch { /* ignore */ }
      }
      // Don't close the AudioContext if it came from the pre-generated tour
      // (it's shared with the global __preGeneratedTour)
      const pre = (window as any).__preGeneratedTour;
      if (audioContextRef.current && (!pre || pre.audioContext !== audioContextRef.current)) {
        try { audioContextRef.current.close(); } catch { /* ignore */ }
      }
    };
  }, []);

  return {
    segments,
    currentSegment,
    isPlaying,
    isGenerating,
    tourReady,
    audioBuffers,
    generateTour,
    play,
    pause,
    skip,
    back,
    restart,
  };
}
