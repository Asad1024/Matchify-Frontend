import { useRef, useState, useEffect, useLayoutEffect, useCallback } from "react";
import { AudioVisualizer } from "react-audio-visualize";
import { Play, Pause } from "lucide-react";
import { cn } from "@/lib/utils";

function fmtTime(sec: number) {
  if (!Number.isFinite(sec) || sec < 0) return "0:00";
  const s = Math.floor(sec);
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${r.toString().padStart(2, "0")}`;
}

type Props = {
  voiceUrl: string;
  isOutgoing: boolean;
  className?: string;
};

export function VoiceMessagePlayer({ voiceUrl, isOutgoing, className }: Props) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const [blob, setBlob] = useState<Blob | null>(null);
  const [vizW, setVizW] = useState(200);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [loadErr, setLoadErr] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoadErr(false);
    setBlob(null);
    (async () => {
      try {
        const res = await fetch(voiceUrl);
        const b = await res.blob();
        if (!cancelled) setBlob(b);
      } catch {
        if (!cancelled) {
          setBlob(null);
          setLoadErr(true);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [voiceUrl]);

  useLayoutEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      const rw = Math.floor(el.getBoundingClientRect().width);
      setVizW((p) => {
        const n = Math.max(96, rw);
        return Math.abs(n - p) >= 20 ? n : p;
      });
    });
    ro.observe(el);
    setVizW(Math.max(96, Math.floor(el.getBoundingClientRect().width)));
    return () => ro.disconnect();
  }, []);

  const toggle = useCallback(() => {
    const a = audioRef.current;
    if (!a) return;
    if (a.paused) void a.play().catch(() => {});
    else a.pause();
  }, []);

  const onTimeUpdate = useCallback(() => {
    const a = audioRef.current;
    if (a) setCurrentTime(a.currentTime);
  }, []);

  const barMuted = isOutgoing ? "rgba(255,255,255,0.28)" : "rgba(15,23,42,0.12)";
  const barPlayed = isOutgoing ? "rgba(255,255,255,0.95)" : "hsl(330 72% 52%)";

  const displayTime =
    playing || currentTime > 0.25 ? currentTime : duration > 0 ? duration : 0;

  return (
    <div className={cn("flex items-center gap-2 min-w-[200px] max-w-[min(100%,300px)] py-0.5", className)}>
      <audio
        ref={audioRef}
        src={voiceUrl}
        preload="metadata"
        className="hidden"
        onTimeUpdate={onTimeUpdate}
        onLoadedMetadata={(e) => {
          const d = e.currentTarget.duration;
          setDuration(Number.isFinite(d) ? d : 0);
        }}
        onEnded={() => {
          setPlaying(false);
          setCurrentTime(0);
          const a = audioRef.current;
          if (a) a.currentTime = 0;
        }}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
      />
      <button
        type="button"
        onClick={toggle}
        className={cn(
          "h-9 w-9 shrink-0 rounded-full flex items-center justify-center transition-colors shadow-sm",
          isOutgoing
            ? "bg-white/22 text-white hover:bg-white/32 ring-1 ring-white/20"
            : "bg-primary/10 text-primary hover:bg-primary/18 ring-1 ring-primary/15",
        )}
        aria-label={playing ? "Pause voice message" : "Play voice message"}
      >
        {playing ? (
          <Pause className="w-4 h-4 fill-current" />
        ) : (
          <Play className="w-4 h-4 fill-current ml-px" />
        )}
      </button>
      <div ref={wrapRef} className="flex-1 min-w-0 h-10 flex items-center">
        {blob && !loadErr ? (
          <AudioVisualizer
            key={vizW}
            blob={blob}
            width={vizW}
            height={40}
            barWidth={2}
            gap={1}
            currentTime={currentTime}
            backgroundColor="transparent"
            barColor={barMuted}
            barPlayedColor={barPlayed}
          />
        ) : (
          <div
            className={cn(
              "h-1.5 w-full rounded-full overflow-hidden",
              isOutgoing ? "bg-white/18" : "bg-gray-200/90",
            )}
          >
            <div
              className={cn("h-full rounded-full transition-[width] duration-100", isOutgoing ? "bg-white/70" : "bg-primary/55")}
              style={{ width: duration > 0 ? `${Math.min(100, (currentTime / duration) * 100)}%` : "0%" }}
            />
          </div>
        )}
      </div>
      <span
        className={cn(
          "tabular-nums text-[11px] font-semibold tracking-tight shrink-0 min-w-[2.5rem] text-right opacity-95",
          isOutgoing ? "text-white/90" : "text-gray-600",
        )}
      >
        {fmtTime(displayTime)}
      </span>
    </div>
  );
}
