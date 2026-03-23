import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Camera, Upload, X, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface PhotoUploadProps {
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
}

export default function PhotoUpload({
  currentPhoto,
  onPhotoChange,
  photos,
  onPhotosChange,
  maxPhotos = 1,
  userId,
  size = "md",
  label = "Upload Photo",
}: PhotoUploadProps) {
  const isMulti = onPhotosChange !== undefined;
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(currentPhoto || null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const sizeMap = {
    sm: "w-16 h-16",
    md: "w-24 h-24",
    lg: "w-32 h-32",
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast({ title: "Please select an image file", variant: "destructive" });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "Image must be smaller than 5MB", variant: "destructive" });
      return;
    }

    // Show local preview immediately
    const localUrl = URL.createObjectURL(file);
    setPreview(localUrl);

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      if (userId) formData.append("userId", userId);

      const res = await fetch("/api/upload-photo", { method: "POST", body: formData, credentials: "include" });
      if (!res.ok) throw new Error("Upload failed");
      const data = await res.json();
      const uploadedUrl = data.url || data.fileUrl || localUrl;
      if (isMulti) {
        const current = photos || [];
        const updated = [...current, uploadedUrl].slice(0, maxPhotos);
        onPhotosChange!(updated);
      } else {
        setPreview(uploadedUrl);
        onPhotoChange?.(uploadedUrl);
      }
      toast({ title: "Photo updated!" });
    } catch {
      if (isMulti) {
        const current = photos || [];
        const updated = [...current, localUrl].slice(0, maxPhotos);
        onPhotosChange!(updated);
      } else {
        setPreview(localUrl);
        onPhotoChange?.(localUrl);
      }
      toast({ title: "Photo saved locally" });
    } finally {
      setUploading(false);
    }
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

  if (isMulti) {
    const currentPhotos = photos || [];
    const canAdd = currentPhotos.length < maxPhotos;
    return (
      <div className="w-full space-y-3">
        <div className="grid grid-cols-3 gap-2">
          {currentPhotos.map((photo, i) => (
            <div key={i} className="relative aspect-square rounded-xl overflow-hidden border-2 border-primary/20">
              <img src={photo} alt={`Photo ${i + 1}`} className="w-full h-full object-cover" />
              <button
                onClick={() => handleRemove(photo)}
                className="absolute top-1 right-1 w-5 h-5 bg-black/60 text-white rounded-full flex items-center justify-center hover:bg-red-500"
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
                  <span className="text-[10px] font-semibold">Add</span>
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
      <div className="relative">
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
        {preview && !uploading && (
          <button
            onClick={() => handleRemove()}
            className="absolute -top-1 -right-1 w-5 h-5 bg-gray-800 text-white rounded-full flex items-center justify-center hover:bg-red-500 transition-colors"
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
            <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
            Uploading...
          </>
        ) : (
          <>
            <Upload className="w-3.5 h-3.5 mr-1.5" />
            {label}
          </>
        )}
      </Button>
    </div>
  );
}
