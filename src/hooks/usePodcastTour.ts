"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useAppStore } from "@/lib/store/useAppStore";

export interface TourSegment {
  text: string;
  equipmentId?: string;
  emotion?: string;
}

/**
 * usePodcastTour — pre-generated narration tour player.
 *
 * The tour is LOCKED (uninterrupted). After it finishes, the user can
 * ask questions via the chat/voice system.
 *
 * Key fixes:
 * - Uses a ref for currentSegment to avoid stale closures in setTimeout
 * - Prevents double-playback and repeating after completion
 * - Tracks "tourComplete" state so the UI knows when to switch to Q&A mode
 */
export function usePodcastTour() {
  const currentPlant = useAppStore((s) => s.currentPlant);
  const [segments, setSegments] = useState<TourSegment[]>([]);
  const [currentSegment, setCurrentSegment] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [audioBuffers, setAudioBuffers] = useState<AudioBuffer[]>([]);
  const [tourReady, setTourReady] = useState(false);
  const [tourComplete, setTourComplete] = useState(false);

  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceNodeRef = useRef<AudioBufferSourceNode | null>(null);
  const currentSegmentRef = useRef(0);
  const isPlayingRef = useRef(false);
  const advanceLockRef = useRef(false); // prevents double-advancing

  const focusEquipment = useAppStore((s) => s.focusEquipment);

  // Keep ref in sync
  useEffect(() => {
    currentSegmentRef.current = currentSegment;
  }, [currentSegment]);

  // Advance to the next segment (called from onended callbacks)
  const advanceToNext = useCallback(() => {
    if (advanceLockRef.current) return;
    advanceLockRef.current = true;

    const next = currentSegmentRef.current + 1;
    if (next < segmentsRef.current.length) {
      currentSegmentRef.current = next;
      setCurrentSegment(next);
      const nextSeg = segmentsRef.current[next];
      if (nextSeg?.equipmentId) {
        focusEquipment(nextSeg.equipmentId);
      }
      // Play next segment after a short pause
      setTimeout(() => {
        advanceLockRef.current = false;
        playSegmentRef.current?.(next);
      }, 400);
    } else {
      // Tour complete
      isPlayingRef.current = false;
      setIsPlaying(false);
      setTourComplete(true);
      advanceLockRef.current = false;
    }
  }, [focusEquipment]);

  // Play a specific segment by index
  const playSegment = useCallback((index: number) => {
    if (!audioContextRef.current || audioBuffersRef.current.length === 0) return;
    if (index >= audioBuffersRef.current.length) return;

    const ctx = audioContextRef.current;
    if (ctx.state === "suspended") {
      ctx.resume().catch(() => {});
    }

    const buffer = audioBuffersRef.current[index];
    const seg = segmentsRef.current[index];

    // Stop any existing playback
    if (sourceNodeRef.current) {
      try { sourceNodeRef.current.stop(); } catch {}
      sourceNodeRef.current = null;
    }
    // Stop browser TTS if running
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }

    isPlayingRef.current = true;
    setIsPlaying(true);

    // Focus camera
    if (seg?.equipmentId) {
      focusEquipment(seg.equipmentId);
    }

    // Check if silent fallback (duration < 2s)
    if (buffer.duration < 2 && seg?.text && typeof window !== "undefined" && "speechSynthesis" in window) {
      // Use browser TTS
      const utter = new SpeechSynthesisUtterance(seg.text);
      utter.rate = 1.0;
      utter.onend = () => {
        if (!isPlayingRef.current) return;
        advanceToNext();
      };
      utter.onerror = () => {
        if (!isPlayingRef.current) return;
        advanceToNext();
      };
      window.speechSynthesis.speak(utter);
    } else {
      // Play audio buffer
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.connect(ctx.destination);
      source.onended = () => {
        if (!isPlayingRef.current) return;
        if (sourceNodeRef.current !== source) return;
        advanceToNext();
      };
      source.start();
      sourceNodeRef.current = source;
    }
  }, [focusEquipment, advanceToNext]);

  // Refs to avoid stale closures
  const segmentsRef = useRef<TourSegment[]>([]);
  const audioBuffersRef = useRef<AudioBuffer[]>([]);
  const playSegmentRef = useRef<typeof playSegment | null>(null);

  useEffect(() => { segmentsRef.current = segments; }, [segments]);
  useEffect(() => { audioBuffersRef.current = audioBuffers; }, [audioBuffers]);
  useEffect(() => { playSegmentRef.current = playSegment; }, [playSegment]);

  // Play from current segment
  const play = useCallback(() => {
    if (tourComplete) {
      // Restart from beginning
      setTourComplete(false);
      currentSegmentRef.current = 0;
      setCurrentSegment(0);
      setTimeout(() => playSegmentRef.current?.(0), 100);
      return;
    }
    playSegment(currentSegmentRef.current);
  }, [playSegment, tourComplete]);

  // Pause
  const pause = useCallback(() => {
    isPlayingRef.current = false;
    setIsPlaying(false);
    if (sourceNodeRef.current) {
      try { sourceNodeRef.current.stop(); } catch {}
      sourceNodeRef.current = null;
    }
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
  }, []);

  // Skip forward
  const skip = useCallback(() => {
    pause();
    const next = Math.min(currentSegmentRef.current + 1, segmentsRef.current.length - 1);
    currentSegmentRef.current = next;
    setCurrentSegment(next);
    setTourComplete(false);
    setTimeout(() => playSegmentRef.current?.(next), 300);
  }, [pause]);

  // Go back
  const back = useCallback(() => {
    pause();
    const prev = Math.max(currentSegmentRef.current - 1, 0);
    currentSegmentRef.current = prev;
    setCurrentSegment(prev);
    setTourComplete(false);
    setTimeout(() => playSegmentRef.current?.(prev), 300);
  }, [pause]);

  // Generate tour (manual fallback if not pre-generated)
  const generateTour = useCallback(async () => {
    if (!currentPlant) return;
    setIsGenerating(true);
    setTourReady(false);
    try {
      const scriptRes = await fetch("/api/generate-tour", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plantId: currentPlant.id }),
      });
      if (!scriptRes.ok) throw new Error("Failed");
      const scriptData = await scriptRes.json();
      const tourSegments: TourSegment[] = scriptData.segments || [];
      setSegments(tourSegments);
      segmentsRef.current = tourSegments;

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
          if (!ttsRes.ok) throw new Error("TTS failed");
          const ct = ttsRes.headers.get("content-type") || "";
          if (!ct.includes("audio")) throw new Error("fallback");
          const ab = await ttsRes.arrayBuffer();
          const buf = await audioCtx.decodeAudioData(ab);
          buffers.push(buf);
        } catch {
          const silence = audioCtx.createBuffer(1, audioCtx.sampleRate, audioCtx.sampleRate);
          buffers.push(silence);
        }
      }
      setAudioBuffers(buffers);
      audioBuffersRef.current = buffers;
      setTourReady(true);
      setCurrentSegment(0);
      currentSegmentRef.current = 0;
      setTourComplete(false);
    } catch (err) {
      console.error("[tour] generation failed", err);
    } finally {
      setIsGenerating(false);
    }
  }, [currentPlant]);

  // Check for pre-generated tour on mount
  useEffect(() => {
    const checkPreGenerated = () => {
      const pre = (window as any).__preGeneratedTour;
      if (pre?.ready) {
        setSegments(pre.segments);
        segmentsRef.current = pre.segments;
        setAudioBuffers(pre.audioBuffers);
        audioBuffersRef.current = pre.audioBuffers;
        audioContextRef.current = pre.audioContext;
        setTourReady(true);
        setCurrentSegment(0);
        currentSegmentRef.current = 0;
        setTourComplete(false);
        return true;
      }
      return false;
    };
    if (!checkPreGenerated()) {
      let attempts = 0;
      const interval = setInterval(() => {
        attempts++;
        if (checkPreGenerated() || attempts > 30) clearInterval(interval);
      }, 2000);
      return () => clearInterval(interval);
    }
  }, [currentPlant]);

  // Cleanup
  useEffect(() => {
    return () => {
      isPlayingRef.current = false;
      if (sourceNodeRef.current) { try { sourceNodeRef.current.stop(); } catch {} }
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  return {
    segments,
    currentSegment,
    isPlaying,
    isGenerating,
    tourReady,
    tourComplete,
    audioBuffers,
    generateTour,
    play,
    pause,
    skip,
    back,
  };
}
