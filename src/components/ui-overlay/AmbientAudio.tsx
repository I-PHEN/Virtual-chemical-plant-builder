"use client";

import { useEffect, useRef } from "react";

/**
 * AmbientAudio — procedural industrial ambience using the Web Audio API.
 *
 * No external audio files needed. Generates:
 *  - Low-frequency rumble (compressor/furnace background)
 *  - Occasional steam hisses (random white noise bursts)
 *  - Subtle high-frequency hum (electrical)
 *
 * Starts on first user interaction (browser autoplay policy).
 * Muted when no plant is loaded.
 */

export function AmbientAudio({ active }: { active: boolean }) {
  const ctxRef = useRef<AudioContext | null>(null);
  const gainRef = useRef<GainNode | null>(null);
  const startedRef = useRef(false);

  useEffect(() => {
    if (!active) {
      // Fade out and suspend
      if (gainRef.current && ctxRef.current) {
        gainRef.current.gain.linearRampToValueAtTime(0, ctxRef.current.currentTime + 0.5);
      }
      return;
    }

    // Start audio on first interaction (browser requirement)
    const startAudio = () => {
      if (startedRef.current) return;
      startedRef.current = true;

      try {
        const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
        ctxRef.current = ctx;

        const masterGain = ctx.createGain();
        masterGain.gain.value = 0;
        masterGain.gain.linearRampToValueAtTime(0.15, ctx.currentTime + 1);
        masterGain.connect(ctx.destination);
        gainRef.current = masterGain;

        // 1. Low-frequency rumble (brown noise filtered)
        const rumbleBuffer = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
        const rumbleData = rumbleBuffer.getChannelData(0);
        let lastOut = 0;
        for (let i = 0; i < rumbleData.length; i++) {
          const white = Math.random() * 2 - 1;
          rumbleData[i] = (lastOut + 0.02 * white) / 1.02;
          lastOut = rumbleData[i];
          rumbleData[i] *= 3.5;
        }
        const rumbleSource = ctx.createBufferSource();
        rumbleSource.buffer = rumbleBuffer;
        rumbleSource.loop = true;
        const rumbleFilter = ctx.createBiquadFilter();
        rumbleFilter.type = "lowpass";
        rumbleFilter.frequency.value = 80;
        const rumbleGain = ctx.createGain();
        rumbleGain.gain.value = 0.6;
        rumbleSource.connect(rumbleFilter);
        rumbleFilter.connect(rumbleGain);
        rumbleGain.connect(masterGain);
        rumbleSource.start();

        // 2. Mid-frequency hum (electrical/process)
        const humOsc = ctx.createOscillator();
        humOsc.type = "sawtooth";
        humOsc.frequency.value = 60;
        const humGain = ctx.createGain();
        humGain.gain.value = 0.03;
        const humFilter = ctx.createBiquadFilter();
        humFilter.type = "lowpass";
        humFilter.frequency.value = 200;
        humOsc.connect(humFilter);
        humFilter.connect(humGain);
        humGain.connect(masterGain);
        humOsc.start();

        // 3. Occasional steam hisses (random noise bursts)
        const scheduleSteam = () => {
          if (!ctxRef.current || !gainRef.current) return;
          const delay = 5 + Math.random() * 15; // 5-20 seconds

          setTimeout(() => {
            if (!ctxRef.current || !gainRef.current || !active) return;

            // Create a short noise burst
            const duration = 1 + Math.random() * 2;
            const buffer = ctxRef.current.createBuffer(1, ctxRef.current.sampleRate * duration, ctxRef.current.sampleRate);
            const data = buffer.getChannelData(0);
            for (let i = 0; i < data.length; i++) {
              data[i] = (Math.random() * 2 - 1) * 0.3;
            }

            const source = ctxRef.current.createBufferSource();
            source.buffer = buffer;
            const filter = ctxRef.current.createBiquadFilter();
            filter.type = "highpass";
            filter.frequency.value = 2000;
            const steamGain = ctxRef.current.createGain();
            steamGain.gain.value = 0;
            steamGain.gain.linearRampToValueAtTime(0.08, ctxRef.current.currentTime + 0.1);
            steamGain.gain.linearRampToValueAtTime(0, ctxRef.current.currentTime + duration);

            source.connect(filter);
            filter.connect(steamGain);
            steamGain.connect(gainRef.current);
            source.start();

            scheduleSteam();
          }, delay * 1000);
        };
        scheduleSteam();
      } catch (err) {
        console.warn("[audio] failed to start ambience", err);
      }
    };

    // Start on first interaction
    window.addEventListener("click", startAudio, { once: true });
    window.addEventListener("touchstart", startAudio, { once: true });
    window.addEventListener("keydown", startAudio, { once: true });

    return () => {
      window.removeEventListener("click", startAudio);
      window.removeEventListener("touchstart", startAudio);
      window.removeEventListener("keydown", startAudio);
    };
  }, [active]);

  return null;
}
