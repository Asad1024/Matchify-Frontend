import { useState, useRef, useEffect, useCallback, useLayoutEffect } from "react";
import { Button } from "@/components/ui/button";
import { Mic, Trash2, Send, Pause, Play } from "lucide-react";
import { cn } from "@/lib/utils";

/** Live bars that scroll forward (new audio on the right) while recording. */
function ScrollingRecordingWaveform({
  stream,
  active,
  height = 36,
  barWidth = 2,
  gap = 1,
  color = "hsl(330 70% 52%)",
}: {
  stream: MediaStream;
  active: boolean;
  height?: number;
  barWidth?: number;
  gap?: number;
  color?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const barsRef = useRef<number[]>([]);
  const rafRef = useRef(0);
  const audioRef = useRef<{
    ctx: AudioContext;
    analyser: AnalyserNode;
    source: MediaStreamAudioSourceNode;
    data: Uint8Array;
  } | null>(null);

  useEffect(() => {
    if (!stream || !active) return;
    let cancelled = false;
    const AC =
      window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const audioCtx = new AC();
    const analyser = audioCtx.createAnalyser();
    analyser.fftSize = 512;
    analyser.smoothingTimeConstant = 0.62;
    const source = audioCtx.createMediaStreamSource(stream);
    source.connect(analyser);
    const data = new Uint8Array(analyser.fftSize);
    audioRef.current = { ctx: audioCtx, analyser, source, data };
    barsRef.current = [];

    const draw = () => {
      if (cancelled) return;
      const node = audioRef.current;
      const canvas = canvasRef.current;
      const wrap = wrapRef.current;
      if (!node || !canvas || !wrap) return;

      const rect = wrap.getBoundingClientRect();
      const wCss = rect.width;
      const hCss = height;
      if (wCss <= 1) {
        rafRef.current = requestAnimationFrame(draw);
        return;
      }

      const maxBars = Math.max(10, Math.floor(wCss / (barWidth + gap)));
      node.analyser.getByteTimeDomainData(node.data);
      let sum = 0;
      for (let i = 0; i < node.data.length; i++) {
        const v = (node.data[i]! - 128) / 128;
        sum += v * v;
      }
      const rms = Math.sqrt(sum / node.data.length);
      const amp = Math.min(1, rms * 5);
      barsRef.current.push(amp);
      if (barsRef.current.length > maxBars) barsRef.current.shift();

      const dpr = window.devicePixelRatio || 1;
      canvas.width = Math.floor(wCss * dpr);
      canvas.height = Math.floor(hCss * dpr);
      canvas.style.width = `${wCss}px`;
      canvas.style.height = `${hCss}px`;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, wCss, hCss);
      const mid = hCss / 2;
      const maxBarH = hCss * 0.44;
      barsRef.current.forEach((a2, i) => {
        const bh = Math.max(2, a2 * maxBarH);
        const x = i * (barWidth + gap);
        ctx.fillStyle = color;
        ctx.beginPath();
        const y = mid - bh / 2;
        if (typeof ctx.roundRect === "function") {
          ctx.roundRect(x, y, barWidth, bh, 2);
        } else {
          ctx.rect(x, y, barWidth, bh);
        }
        ctx.fill();
      });
      rafRef.current = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      cancelled = true;
      cancelAnimationFrame(rafRef.current);
      const a = audioRef.current;
      audioRef.current = null;
      barsRef.current = [];
      if (a) {
        try {
          a.source.disconnect();
          a.analyser.disconnect();
        } catch {
          /* ignore */
        }
        void a.ctx.close();
      }
    };
  }, [stream, active, height, barWidth, gap, color]);

  return (
    <div ref={wrapRef} className="h-full w-full min-w-0">
      <canvas ref={canvasRef} className="block" aria-hidden />
    </div>
  );
}

type Props = {
  onRecordComplete: (blob: Blob) => void;
  autoStart?: boolean;
  onCancel?: () => void;
  /** Single-row layout for the chat composer (WhatsApp-style). */
  layout?: "panel" | "inline";
  className?: string;
};

function pickMimeType(): string {
  const candidates = [
    "audio/webm;codecs=opus",
    "audio/webm",
    "audio/mp4",
    "audio/ogg;codecs=opus",
  ];
  for (const c of candidates) {
    if (typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported(c)) return c;
  }
  return "";
}

const canMediaRecorderPause =
  typeof MediaRecorder !== "undefined" &&
  typeof MediaRecorder.prototype.pause === "function";

function formatTimer(ms: number) {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${r.toString().padStart(2, "0")}`;
}

export function VoiceNoteRecorder({
  onRecordComplete,
  autoStart = false,
  onCancel,
  layout = "panel",
  className,
}: Props) {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [liveRecorder, setLiveRecorder] = useState<MediaRecorder | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [elapsedMs, setElapsedMs] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordingStreamRef = useRef<MediaStream | null>(null);
  const recordedMimeRef = useRef<string>("audio/webm");
  const chunksRef = useRef<Blob[]>([]);
  const autoStartedRef = useRef(false);
  const discardResultRef = useRef(false);
  const onCompleteRef = useRef(onRecordComplete);
  onCompleteRef.current = onRecordComplete;

  const waveWrapRef = useRef<HTMLDivElement>(null);

  const stopTracks = useCallback((stream?: MediaStream | null) => {
    const s = stream ?? recordingStreamRef.current ?? mediaRecorderRef.current?.stream;
    s?.getTracks().forEach((t) => t.stop());
    recordingStreamRef.current = null;
  }, []);

  const stopRecordingCore = useCallback(() => {
    const mr = mediaRecorderRef.current;
    if (!mr || mr.state === "inactive") return;
    try {
      if ((mr.state === "recording" || mr.state === "paused") && typeof mr.requestData === "function") {
        mr.requestData();
      }
    } catch {
      /* ignore */
    }
    try {
      mr.stop();
    } catch {
      /* ignore */
    }
  }, []);

  const startRecording = useCallback(async () => {
    setError(null);
    setElapsedMs(0);
    setIsPaused(false);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      recordingStreamRef.current = stream;

      const mimeType = pickMimeType();
      recordedMimeRef.current = mimeType || "audio/webm";
      const mediaRecorder =
        mimeType && typeof MediaRecorder !== "undefined"
          ? new MediaRecorder(stream, { mimeType })
          : new MediaRecorder(stream);

      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        setLiveRecorder(null);
        setIsRecording(false);
        setIsPaused(false);
        const type = recordedMimeRef.current || mediaRecorder.mimeType || "audio/webm";
        const blob = new Blob(chunksRef.current, { type });
        chunksRef.current = [];
        stopTracks(stream);
        mediaRecorderRef.current = null;
        const discard = discardResultRef.current;
        discardResultRef.current = false;
        if (discard) return;
        if (blob.size > 0) {
          onCompleteRef.current(blob);
        } else {
          setError("No audio captured — try a little longer.");
        }
      };

      mediaRecorder.start(200);
      setLiveRecorder(mediaRecorder);
      setIsRecording(true);
    } catch {
      setError("Microphone access denied or unavailable.");
      recordingStreamRef.current = null;
    }
  }, [stopTracks]);

  useEffect(() => {
    if (!autoStart || autoStartedRef.current) return;
    autoStartedRef.current = true;
    void startRecording();
  }, [autoStart, startRecording]);

  useEffect(() => {
    return () => {
      discardResultRef.current = true;
      const mr = mediaRecorderRef.current;
      if (mr && mr.state !== "inactive") {
        try {
          mr.stop();
        } catch {
          /* ignore */
        }
      }
      stopTracks();
      setLiveRecorder(null);
    };
  }, [stopTracks]);

  useEffect(() => {
    if (!isRecording || isPaused) return;
    const id = window.setInterval(() => setElapsedMs((t) => t + 100), 100);
    return () => clearInterval(id);
  }, [isRecording, isPaused]);

  const cancelRecording = useCallback(() => {
    discardResultRef.current = true;
    stopRecordingCore();
    onCancel?.();
  }, [onCancel, stopRecordingCore]);

  const sendRecording = useCallback(() => {
    discardResultRef.current = false;
    stopRecordingCore();
  }, [stopRecordingCore]);

  const togglePause = useCallback(() => {
    const mr = mediaRecorderRef.current;
    if (!mr || !canMediaRecorderPause) return;
    try {
      if (mr.state === "recording") {
        mr.pause();
        setIsPaused(true);
      } else if (mr.state === "paused") {
        mr.resume();
        setIsPaused(false);
      }
    } catch {
      setIsPaused(false);
    }
  }, []);

  const inline = layout === "inline";

  return (
    <div
      className={cn(
        inline ? "flex flex-1 min-w-0 items-center gap-1.5 py-0.5" : "flex flex-col gap-2 px-4 py-3",
        className,
      )}
    >
      {error ? <p className="text-sm text-destructive shrink-0">{error}</p> : null}

      {liveRecorder && isRecording ? (
        <div
          className={cn(
            "flex items-center gap-2 min-w-0 w-full",
            inline
              ? "rounded-full bg-gray-100 pl-1 pr-1 py-1 border border-gray-200/80"
              : "rounded-2xl bg-gray-100 px-2 py-2 border border-gray-200/80",
          )}
        >
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-9 w-9 shrink-0 rounded-full text-red-500 hover:bg-red-50 hover:text-red-600"
            onClick={() => cancelRecording()}
            aria-label="Delete recording"
          >
            <Trash2 className="w-4 h-4" />
          </Button>

          <div ref={waveWrapRef} className="flex-1 min-w-0 h-9 overflow-hidden rounded-lg bg-white/70">
            {!isPaused && liveRecorder?.stream ? (
              <ScrollingRecordingWaveform stream={liveRecorder.stream} active height={36} />
            ) : (
              <div className="h-full flex items-center justify-center text-xs font-medium text-gray-500">
                Paused
              </div>
            )}
          </div>

          <span className="tabular-nums text-sm font-semibold text-gray-700 w-10 shrink-0 text-center">
            {formatTimer(elapsedMs)}
          </span>

          {canMediaRecorderPause ? (
            <Button
              type="button"
              size="icon"
              variant="secondary"
              className="h-9 w-9 shrink-0 rounded-full"
              onClick={togglePause}
              aria-label={isPaused ? "Resume recording" : "Pause recording"}
            >
              {isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
            </Button>
          ) : null}

          <Button
            type="button"
            size="icon"
            className="h-10 w-10 shrink-0 rounded-full bg-primary hover:bg-primary/90 shadow-md shadow-primary/25"
            onClick={sendRecording}
            aria-label="Send voice message"
          >
            <Send className="w-4 h-4 text-white" />
          </Button>
        </div>
      ) : (
        <div className={cn("flex items-center justify-between gap-2", inline && "w-full")}>
          {!autoStart ? (
            <Button type="button" size="sm" onClick={() => void startRecording()} variant="outline" className="gap-2">
              <Mic className="w-4 h-4" />
              Record voice note
            </Button>
          ) : (
            <span className="text-sm text-muted-foreground px-2">Preparing microphone…</span>
          )}
          {onCancel ? (
            <Button type="button" size="sm" variant="ghost" className="gap-1 text-muted-foreground" onClick={onCancel}>
              Cancel
            </Button>
          ) : null}
        </div>
      )}

      {liveRecorder && isRecording && !inline ? (
        <p className="text-[11px] text-center text-gray-400 px-2">
          Tap trash to cancel, or send when done
        </p>
      ) : null}
    </div>
  );
}
