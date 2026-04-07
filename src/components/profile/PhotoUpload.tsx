import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Camera, Upload, X, Loader2, Pencil } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { uploadPostPhoto } from "@/services/upload.service";
import { ImageCropDialog } from "@/components/profile/ImageCropDialog";

interface PhotoUploadProps {
  /** Wide cover preview for profile banners; default is circular avatar. */
  variant?: "avatar" | "banner";
  // Single-photo mode
  currentPhoto?: string | null;
  onPhotoChange?: (url: string) => void;
  // Multi-photo mode (used by OnboardingWizard)
  photos?: string[];
  onPhotosChange?: (photos: string[]) => void;
  maxPhotos?: number;
  userId?: string;
  size?: "sm" | "md" | "lg";
  label?: string;
  /** When the parent persists immediately (e.g. profile PATCH), skip duplicate success toast. */
  suppressSuccessToast?: boolean;
  /** Tap the image (not remove / add controls) to open full-screen preview. */
  onOpenPreview?: (url: string) => void;
  /** Multi mode: label on the dashed add tile (default "Add"). */
  multiAddLabel?: string;
  /**
   * Single avatar only: open round crop/zoom before upload so faces match the profile circle.
   * @default true
   */
  enableAvatarCrop?: boolean;
}

export default function PhotoUpload({
  variant = "avatar",
  currentPhoto,
  onPhotoChange,
  photos,
  onPhotosChange,
  maxPhotos = 1,
  userId,
  size = "md",
  label = "Upload Photo",
  suppressSuccessToast = false,
  onOpenPreview,
  multiAddLabel = "Add",
  enableAvatarCrop = true,
}: PhotoUploadProps) {
  const isMulti = onPhotosChange !== undefined;
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(currentPhoto || null);
  const [cropOpen, setCropOpen] = useState(false);
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (isMulti || uploading) return;
    setPreview(currentPhoto || null);
  }, [currentPhoto, isMulti, uploading]);

  const sizeMap = {
    sm: "w-16 h-16",
    md: "w-24 h-24",
    lg: "w-32 h-32",
  };

  const uploadFile = async (file: File) => {
    setUploading(true);
    try {
      const uploadedUrl = await uploadPostPhoto(file);
      if (isMulti) {
        const current = photos || [];
        const updated = [...current, uploadedUrl].slice(0, maxPhotos);
        onPhotosChange!(updated);
      } else {
        setPreview(uploadedUrl);
        onPhotoChange?.(uploadedUrl);
      }
      if (!suppressSuccessToast) {
        toast({ title: "Photo updated!" });
      }
    } catch (e) {
      if (isMulti) {
        toast({
          title: "Upload failed",
          description: e instanceof Error ? e.message : "Check your connection and API URL.",
          variant: "destructive",
        });
      } else {
        setPreview(currentPhoto || null);
        toast({
          title: "Upload failed",
          description: e instanceof Error ? e.message : "Could not reach the server.",
          variant: "destructive",
        });
      }
    } finally {
      setUploading(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast({ title: "Please select an image file", variant: "destructive" });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "Image must be smaller than 5MB", variant: "destructive" });
      return;
    }

    const useCrop = !isMulti && variant === "avatar" && enableAvatarCrop;
    if (useCrop) {
      const localUrl = URL.createObjectURL(file);
      setCropSrc(localUrl);
      setCropOpen(true);
      return;
    }

    const localUrl = URL.createObjectURL(file);
    setPreview(localUrl);
    try {
      await uploadFile(file);
    } finally {
      URL.revokeObjectURL(localUrl);
    }
  };

  const handleCropDialogChange = (open: boolean) => {
    setCropOpen(open);
    if (!open && cropSrc) {
      if (cropSrc.startsWith("blob:")) {
        URL.revokeObjectURL(cropSrc);
      }
      setCropSrc(null);
    }
  };

  /** Re-open crop editor on the current picture, or pick a new file if none / crop disabled. */
  const openReCropEditor = () => {
    if (uploading) return;
    const raw = (preview || currentPhoto || "").trim();
    if (!raw) {
      fileInputRef.current?.click();
      return;
    }
    if (enableAvatarCrop) {
      setCropSrc(raw);
      setCropOpen(true);
      return;
    }
    fileInputRef.current?.click();
  };

  const handleRemove = (urlToRemove?: string) => {
    if (isMulti && urlToRemove) {
      const updated = (photos || []).filter((p) => p !== urlToRemove);
      onPhotosChange!(updated);
    } else {
      setPreview(null);
      onPhotoChange?.("");
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  if (!isMulti && variant === "banner") {
    return (
      <div className="flex w-full max-w-full flex-col items-stretch gap-3">
        <div className="relative w-full">
          <div className="relative h-28 w-full overflow-hidden rounded-xl border-2 border-primary/30 bg-muted">
            {preview && onOpenPreview && !uploading ? (
              <button
                type="button"
                className="absolute inset-0 z-[1] cursor-zoom-in bg-transparent"
                onClick={() => onOpenPreview(preview)}
                aria-label="View full size"
              />
            ) : null}
            {preview ? (
              <img src={preview} alt="" className="relative z-0 h-full w-full object-cover pointer-events-none" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                {uploading ? <Loader2 className="h-8 w-8 animate-spin" /> : <Camera className="h-8 w-8" />}
              </div>
            )}
          </div>
          {preview && !uploading && (
            <button
              type="button"
              onClick={() => handleRemove()}
              className="absolute right-2 top-2 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-gray-800 text-white transition-colors hover:bg-red-500"
              aria-label="Remove banner"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={uploading}
          onClick={() => fileInputRef.current?.click()}
          className="w-full rounded-full text-xs sm:w-auto"
        >
          {uploading ? (
            <>
              <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
              Uploading...
            </>
          ) : (
            <>
              <Upload className="mr-1.5 h-3.5 w-3.5" />
              {label}
            </>
          )}
        </Button>
      </div>
    );
  }

  if (isMulti) {
    const currentPhotos = photos || [];
    const canAdd = currentPhotos.length < maxPhotos;
    return (
      <div className="w-full space-y-3">
        <div className="grid grid-cols-3 gap-2">
          {currentPhotos.map((photo, i) => (
            <div key={`${photo}-${i}`} className="relative aspect-square rounded-xl overflow-hidden border-2 border-primary/20">
              {onOpenPreview ? (
                <button
                  type="button"
                  className="absolute inset-0 z-[1] cursor-zoom-in bg-transparent"
                  onClick={() => onOpenPreview(photo)}
                  aria-label="View full size"
                />
              ) : null}
              <img
                src={photo}
                alt=""
                className="relative z-0 h-full w-full object-cover pointer-events-none"
                onError={() => handleRemove(photo)}
              />
              <button
                type="button"
                onClick={() => handleRemove(photo)}
                className="absolute top-1 right-1 z-10 flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-white hover:bg-red-500"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
          {canAdd && (
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="aspect-square rounded-xl border-2 border-dashed border-primary/30 flex flex-col items-center justify-center gap-1 text-primary/60 hover:border-primary hover:text-primary transition-colors"
            >
              {uploading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <Camera className="w-5 h-5" />
                  <span className="text-[10px] font-semibold">{multiAddLabel}</span>
                </>
              )}
            </button>
          )}
        </div>
        <p className="text-xs text-center text-muted-foreground">{currentPhotos.length}/{maxPhotos} photos</p>
        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <ImageCropDialog
        open={cropOpen}
        onOpenChange={handleCropDialogChange}
        imageSrc={cropSrc}
        title="Adjust main photo"
        onApply={async (file) => {
          await uploadFile(file);
        }}
      />
      <div className="relative inline-flex">
        <Avatar className={`${sizeMap[size]} border-2 border-primary/30`}>
          <AvatarImage src={preview || undefined} />
          <AvatarFallback className="bg-primary/10 text-primary">
            {uploading ? (
              <Loader2 className="w-6 h-6 animate-spin" />
            ) : (
              <Camera className="w-6 h-6" />
            )}
          </AvatarFallback>
        </Avatar>
        {preview && onOpenPreview && !uploading ? (
          <button
            type="button"
            className="absolute inset-0 z-[1] cursor-zoom-in rounded-full border-0 bg-transparent p-0"
            onClick={() => onOpenPreview(preview)}
            aria-label="View full size"
          />
        ) : null}
        {preview && !uploading && (
          <button
            type="button"
            onClick={() => handleRemove()}
            className="absolute -top-1 -right-1 z-10 flex h-5 w-5 items-center justify-center rounded-full bg-gray-800 text-white transition-colors hover:bg-red-500"
          >
            <X className="w-3 h-3" />
          </button>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />

      <div className="flex flex-wrap items-center justify-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={uploading}
          onClick={() => fileInputRef.current?.click()}
          className="rounded-full text-xs"
        >
          {uploading ? (
            <>
              <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
              Uploading...
            </>
          ) : (
            <>
              <Upload className="mr-1.5 h-3.5 w-3.5" />
              {label}
            </>
          )}
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={uploading}
          onClick={openReCropEditor}
          className="rounded-full px-3 text-xs"
          aria-label="Adjust crop of current photo"
          title="Adjust crop"
        >
          <Pencil className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
        </Button>
      </div>
    </div>
  );
}
