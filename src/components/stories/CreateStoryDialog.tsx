import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRef, useState } from "react";
import { ImagePlus, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { uploadService } from "@/services/upload.service";
import { defaultNewStoryImage } from "@/lib/humanPlaceholderImages";

const storyImageField = z
  .string()
  .optional()
  .transform((s) => (typeof s === "string" ? s.trim() : ""))
  .refine(
    (s) => {
      if (!s) return true;
      if (s.startsWith("/")) return true;
      try {
        new URL(s);
        return true;
      } catch {
        return false;
      }
    },
    { message: "Use a valid URL, a path like /uploads/…, or upload a photo" },
  );

const createStorySchema = z.object({
  name: z.string().min(1, "Name is required"),
  content: z.string().min(1, "Story content is required"),
  image: storyImageField,
});

type CreateStoryFormData = z.infer<typeof createStorySchema>;

interface CreateStoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
}

export default function CreateStoryDialog({
  open,
  onOpenChange,
  userId,
}: CreateStoryDialogProps) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  const form = useForm<CreateStoryFormData>({
    resolver: zodResolver(createStorySchema),
    defaultValues: {
      name: "",
      content: "",
      image: "",
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: CreateStoryFormData) => {
      const seed = `${userId}-${data.name}`.replace(/[^a-zA-Z0-9_-]/g, "-");
      const storyData = {
        userId,
        name: data.name,
        content: data.content,
        image: data.image?.trim() || defaultNewStoryImage(seed),
        hasUnread: true,
      };
      return apiRequest("POST", "/api/stories", storyData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        predicate: (q) => typeof q.queryKey?.[0] === "string" && q.queryKey[0].startsWith("/api/stories"),
      });
      toast({
        title: "Story created!",
        description: "Your story has been posted successfully",
      });
      form.reset();
      if (fileInputRef.current) fileInputRef.current.value = "";
      onOpenChange(false);
    },
    onError: (err) => {
      const msg =
        err instanceof Error ? err.message : "Could not create story";
      toast({
        title: "Could not create story",
        description: msg.length > 120 ? `${msg.slice(0, 117)}…` : msg,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: CreateStoryFormData) => {
    createMutation.mutate(data);
  };

  const imageValue = form.watch("image");

  const handleStoryImageFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast({ title: "Choose an image file", variant: "destructive" });
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      toast({ title: "Image must be 8MB or smaller", variant: "destructive" });
      return;
    }
    setUploadingImage(true);
    try {
      const { url } = await uploadService.uploadPhoto(file);
      form.setValue("image", url, { shouldValidate: true, shouldDirty: true });
      toast({ title: "Image uploaded" });
    } catch {
      toast({
        title: "Upload failed",
        description: "Check your connection and API URL, then try again.",
        variant: "destructive",
      });
    } finally {
      setUploadingImage(false);
    }
  };

  const formId = "create-story-form";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="flex max-h-[min(90vh,720px)] w-full max-w-md flex-col gap-0 overflow-hidden border-border bg-popover p-0 text-popover-foreground sm:rounded-xl [&>button.absolute]:z-[100]"
        data-testid="dialog-create-story"
      >
        <div className="shrink-0 border-b border-border/70 px-6 pb-4 pt-6 pr-14">
          <DialogHeader className="space-y-1.5 text-left">
            <DialogTitle>Create Story</DialogTitle>
            <DialogDescription>
              Share a moment with your network
            </DialogDescription>
          </DialogHeader>
        </div>

        <Form {...form}>
          <form
            id={formId}
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex min-h-0 flex-1 flex-col"
          >
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-6 py-4 space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Story Name</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="e.g. My Day Out"
                      data-testid="input-story-name"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Content</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      rows={4}
                      placeholder="Share your story..."
                      data-testid="input-story-content"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="image"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Story image (optional)</FormLabel>
                  <p className="text-sm text-muted-foreground mb-2">
                    Upload a photo from your device or paste an image URL.
                  </p>
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="sr-only"
                      data-testid="input-story-image-file"
                      onChange={handleStoryImageFile}
                    />
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      disabled={uploadingImage || createMutation.isPending}
                      onClick={() => fileInputRef.current?.click()}
                      data-testid="button-story-upload-image"
                    >
                      {uploadingImage ? (
                        <Loader2 className="w-4 h-4 animate-spin mr-2" aria-hidden />
                      ) : (
                        <ImagePlus className="w-4 h-4 mr-2" aria-hidden />
                      )}
                      {uploadingImage ? "Uploading…" : "Upload image"}
                    </Button>
                    {field.value?.trim() ? (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          field.onChange("");
                          form.clearErrors("image");
                        }}
                        data-testid="button-story-clear-image"
                      >
                        Remove image
                      </Button>
                    ) : null}
                  </div>
                  {imageValue?.trim() ? (
                    <div className="mb-2 max-h-36 overflow-hidden rounded-xl border border-border bg-muted/30">
                      <img
                        src={imageValue.trim()}
                        alt="Story preview"
                        className="max-h-36 w-full object-contain object-center bg-black/5"
                        referrerPolicy="strict-origin-when-cross-origin"
                      />
                    </div>
                  ) : null}
                  <span className="text-muted-foreground text-xs block mb-1.5">
                    Or image URL
                  </span>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="https://example.com/image.jpg"
                      data-testid="input-story-image"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            </div>
          </form>
        </Form>

        <DialogFooter className="shrink-0 gap-2 border-t border-border bg-popover p-4 sm:justify-end">
          <Button
            type="button"
            variant="outline"
            className="border-border bg-transparent hover:bg-muted/50"
            onClick={() => onOpenChange(false)}
            data-testid="button-cancel"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            form={formId}
            disabled={createMutation.isPending || uploadingImage}
            data-testid="button-create"
          >
            {createMutation.isPending ? "Creating..." : "Create Story"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
