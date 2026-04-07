import { useState, useCallback, useEffect } from "react";
import Cropper, { type Area } from "react-easy-crop";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { getCroppedImageBlob } from "@/lib/getCroppedImageBlob";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type ImageCropDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Typically `URL.createObjectURL(file)` */
  imageSrc: string | null;
  /** Called with cropped JPEG; parent should revoke `imageSrc` after success. */
  onApply: (file: File) => void | Promise<void>;
  title?: string;
};

export function ImageCropDialog({
  open,
  onOpenChange,
  imageSrc,
  onApply,
  title = "Adjust photo",
}: ImageCropDialogProps) {
  const { toast } = useToast();
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [busy, setBusy] = useState(false);

  const onCropComplete = useCallback((_: Area, areaPixels: Area) => {
    setCroppedAreaPixels(areaPixels);
  }, []);

  useEffect(() => {
    if (open && imageSrc) {
      setZoom(1);
      setCrop({ x: 0, y: 0 });
      setCroppedAreaPixels(null);
    }
  }, [open, imageSrc]);

  const handleClose = (next: boolean) => {
    if (!next) {
      setZoom(1);
      setCrop({ x: 0, y: 0 });
      setCroppedAreaPixels(null);
    }
    onOpenChange(next);
  };

  const handleSave = async () => {
    if (!imageSrc || !croppedAreaPixels) return;
    setBusy(true);
    try {
      const blob = await getCroppedImageBlob(imageSrc, croppedAreaPixels);
      const file = new File([blob], "profile-photo.jpg", { type: "image/jpeg" });
      await onApply(file);
      handleClose(false);
    } catch {
      toast({ title: "Could not prepare photo", description: "Try another image.", variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  if (!imageSrc) return null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="flex max-h-[min(92dvh,calc(100dvh-1rem))] flex-col gap-0 overflow-hidden rounded-2xl border-border p-0 sm:max-w-md">
        <DialogHeader className="shrink-0 px-5 pt-5 pb-2 pr-14 text-left">
          <DialogTitle className="font-display">{title}</DialogTitle>
          <DialogDescription className="text-[13px] leading-relaxed">
            Drag to reposition and use the slider to zoom. The circle matches your profile photo.
          </DialogDescription>
        </DialogHeader>

        <div className="relative mx-auto h-[min(72vw,300px)] w-full max-w-[400px] bg-muted sm:h-[320px]">
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={1}
            cropShape="round"
            showGrid={false}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropComplete}
          />
        </div>

        <div className="shrink-0 space-y-2 px-5 py-3">
          <p className="text-[11px] font-medium text-muted-foreground">Zoom</p>
          <Slider
            value={[zoom]}
            min={1}
            max={3}
            step={0.02}
            onValueChange={(v) => setZoom(v[0] ?? 1)}
            aria-label="Zoom"
          />
        </div>

        <DialogFooter className="shrink-0 gap-2 border-t border-border/70 px-5 py-4 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            className="rounded-full"
            disabled={busy}
            onClick={() => handleClose(false)}
          >
            Cancel
          </Button>
          <Button type="button" className="rounded-full" disabled={busy || !croppedAreaPixels} onClick={() => void handleSave()}>
            {busy ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
                Saving…
              </>
            ) : (
              "Use photo"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
