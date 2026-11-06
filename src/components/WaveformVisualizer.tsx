import React, { useRef, useEffect, useState } from 'react';
import { Play, Pause, RotateCcw, Volume2, Sparkles, Download } from 'lucide-react';
import { AudioSynthesisResult } from '../utils/audioSynthesizer';

interface WaveformVisualizerProps {
  audioResult: AudioSynthesisResult | null;
  textToSpeak: string;
  lang: 'fr' | 'en';
}

export const WaveformVisualizer: React.FC<WaveformVisualizerProps> = ({
  audioResult,
  textToSpeak,
  lang,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioBufferRef = useRef<AudioBuffer | null>(null);
  const sourceNodeRef = useRef<AudioBufferSourceNode | null>(null);
  const startTimeRef = useRef<number>(0);
  const pauseOffsetRef = useRef<number>(0);
  const animFrameRef = useRef<number | null>(null);

  // Initialize Web Audio Buffer when audioResult changes
  useEffect(() => {
    if (!audioResult) return;

    const initAudio = async () => {
      try {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        const ctx = new AudioCtx();
        audioContextRef.current = ctx;

        // Decode WAV bytes into AudioBuffer
        const bufferCopy = audioResult.wavBytes.buffer.slice(
          audioResult.wavBytes.byteOffset,
          audioResult.wavBytes.byteOffset + audioResult.wavBytes.byteLength
        ) as ArrayBuffer;
        const decoded = await ctx.decodeAudioData(bufferCopy);
        audioBufferRef.current = decoded;
      } catch (err) {
        console.warn("Audio decoding error:", err);
      }
    };

    initAudio();

    return () => {
      stopPlayback();
      if (audioContextRef.current) {
        audioContextRef.current.close().catch(() => {});
      }
    };
  }, [audioResult]);

  // Draw Waveform on Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !audioResult) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    ctx.clearRect(0, 0, width, height);

    const peaks = audioResult.peaks;
    if (peaks.length === 0) return;

    // Background grid lines
    ctx.strokeStyle = '#262626';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, height / 2);
    ctx.lineTo(width, height / 2);
    ctx.stroke();

    // Calculate progression ratio
    const progressRatio = audioResult.durationSeconds > 0 
      ? Math.min(1, currentTime / audioResult.durationSeconds) 
      : 0;
    const progressX = progressRatio * width;

    // Draw min-max peak bars
    const barWidth = Math.max(1, width / peaks.length);
    for (let i = 0; i < peaks.length; i++) {
      const x = (i / peaks.length) * width;
      const peak = peaks[i];

      const minY = (height / 2) + (peak.min * (height / 2) * 0.92);
      const maxY = (height / 2) + (peak.max * (height / 2) * 0.92);
      const barHeight = Math.max(2, maxY - minY);

      // Color depends on whether it's played or pending
      if (x <= progressX) {
        ctx.fillStyle = '#06b6d4'; // Cyan-500
      } else {
        ctx.fillStyle = '#525252'; // Neutral-600
      }

      ctx.fillRect(x, minY, Math.max(1.2, barWidth - 0.5), barHeight);
    }

    // Draw scrubber playhead
    if (progressX > 0) {
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(progressX, 0);
      ctx.lineTo(progressX, height);
      ctx.stroke();

      // Scrubber head diamond
      ctx.fillStyle = '#38bdf8';
      ctx.beginPath();
      ctx.arc(progressX, 5, 4, 0, Math.PI * 2);
      ctx.fill();
    }
  }, [audioResult, currentTime]);

  const startPlayback = () => {
    if (!audioContextRef.current || !audioBufferRef.current || !audioResult) return;

    if (audioContextRef.current.state === 'suspended') {
      audioContextRef.current.resume();
    }

    // Stop current source
    if (sourceNodeRef.current) {
      try { sourceNodeRef.current.stop(); } catch {}
    }

    const source = audioContextRef.current.createBufferSource();
    source.buffer = audioBufferRef.current;
    source.playbackRate.value = playbackRate;
    source.connect(audioContextRef.current.destination);

    const offset = pauseOffsetRef.current >= audioResult.durationSeconds ? 0 : pauseOffsetRef.current;
    source.start(0, offset);
    startTimeRef.current = audioContextRef.current.currentTime - (offset / playbackRate);
    sourceNodeRef.current = source;
    setIsPlaying(true);

    source.onended = () => {
      // If reached end
      if (audioContextRef.current && (audioContextRef.current.currentTime - startTimeRef.current) * playbackRate >= audioResult.durationSeconds - 0.1) {
        setIsPlaying(false);
        pauseOffsetRef.current = 0;
        setCurrentTime(0);
        if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      }
    };

    // Tracking loop
    const trackTime = () => {
      if (!audioContextRef.current || !audioResult) return;
      const elapsed = (audioContextRef.current.currentTime - startTimeRef.current) * playbackRate;
      const clamped = Math.min(audioResult.durationSeconds, Math.max(0, elapsed));
      setCurrentTime(clamped);
      pauseOffsetRef.current = clamped;

      if (clamped < audioResult.durationSeconds && isPlaying) {
        animFrameRef.current = requestAnimationFrame(trackTime);
      } else if (clamped >= audioResult.durationSeconds) {
        setIsPlaying(false);
      }
    };

    animFrameRef.current = requestAnimationFrame(trackTime);
  };

  const pausePlayback = () => {
    if (sourceNodeRef.current) {
      try { sourceNodeRef.current.stop(); } catch {}
      sourceNodeRef.current = null;
    }
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
    }
    setIsPlaying(false);
  };

  const stopPlayback = () => {
    pausePlayback();
    pauseOffsetRef.current = 0;
    setCurrentTime(0);
  };

  const handleSeek = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!audioResult || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const ratio = Math.max(0, Math.min(1, clickX / rect.width));
    const targetTime = ratio * audioResult.durationSeconds;

    pauseOffsetRef.current = targetTime;
    setCurrentTime(targetTime);

    if (isPlaying) {
      startPlayback();
    }
  };

  if (!audioResult) {
    return (
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-8 text-center text-neutral-400 font-mono text-xs">
        {lang === 'fr'
          ? "Génération de la forme d'onde et calcul des crêtes PKF en attente..."
          : "Waveform generation & PKF peak calculations pending..."}
      </div>
    );
  }

  const formatDuration = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${mins}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 sm:p-5 space-y-4">
      {/* Header telemetry & status */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-neutral-200">
            {lang === 'fr' ? 'Forme d’onde & Niveaux de Crêtes .PKF' : 'Waveform & .PKF Peak Data'}
          </span>
          <span className="text-neutral-500">·</span>
          <span className="text-cyan-400 font-mono">
            {audioResult.peaks.length.toLocaleString()} {lang === 'fr' ? 'échantillons crêtes' : 'peak samples'}
          </span>
        </div>

        <div className="flex items-center gap-3 font-mono text-neutral-400">
          <span>{audioResult.sampleRate} Hz</span>
          <span>·</span>
          <span>{audioResult.samplesPerPeak} spl/pk</span>
          <span>·</span>
          <span className="text-neutral-200">
            {formatDuration(currentTime)} / {formatDuration(audioResult.durationSeconds)}
          </span>
        </div>
      </div>

      {/* Canvas Waveform */}
      <div className="relative bg-neutral-950 rounded-lg border border-neutral-800/80 p-2 overflow-hidden">
        <canvas
          ref={canvasRef}
          width={800}
          height={120}
          onClick={handleSeek}
          className="w-full h-28 cursor-pointer rounded block"
          title={lang === 'fr' ? "Cliquez sur l'onde pour naviguer" : "Click waveform to seek"}
        />

        <div className="absolute bottom-2 right-3 text-[10px] font-mono text-neutral-500 bg-neutral-900/80 px-1.5 py-0.5 rounded border border-neutral-800 pointer-events-none">
          Structure binaire PK01 Adobe Audition
        </div>
      </div>

      {/* Playback Controls & Speed */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
        <div className="flex items-center gap-2">
          {isPlaying ? (
            <button
              onClick={pausePlayback}
              className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm shadow-cyan-950"
            >
              <Pause className="w-4 h-4 fill-current" />
              <span>{lang === 'fr' ? 'Pause' : 'Pause'}</span>
            </button>
          ) : (
            <button
              onClick={startPlayback}
              className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm shadow-cyan-950"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>{lang === 'fr' ? 'Écouter la piste audio' : 'Play Audio Track'}</span>
            </button>
          )}

          <button
            onClick={stopPlayback}
            className="p-2 text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 rounded-lg transition-colors border border-neutral-800"
            title={lang === 'fr' ? 'Réinitialiser au début' : 'Reset to start'}
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Speed toggle */}
        <div className="flex items-center gap-1 bg-neutral-950 p-1 rounded-lg border border-neutral-800 text-xs font-mono">
          <span className="text-neutral-400 px-1.5">{lang === 'fr' ? 'Vitesse :' : 'Speed:'}</span>
          {[1, 1.25, 1.5].map((rate) => (
            <button
              key={rate}
              onClick={() => {
                setPlaybackRate(rate);
                if (sourceNodeRef.current) {
                  sourceNodeRef.current.playbackRate.value = rate;
                }
              }}
              className={`px-2 py-0.5 rounded transition-colors ${
                playbackRate === rate
                  ? 'bg-neutral-800 text-cyan-400 font-semibold'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              {rate}x
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
