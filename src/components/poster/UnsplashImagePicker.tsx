import { useState, useEffect } from "react";
import { RefreshCw, Check, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface UnsplashImage {
  id: string;
  urls: {
    regular: string;
    small: string;
    thumb: string;
  };
  author: {
    name: string;
    username: string;
    link: string;
  };
  alt: string;
  color: string;
}

interface UnsplashImagePickerProps {
  templateKey: string;
  onImageSelect: (imageUrl: string, author?: { name: string; link: string }) => void;
  selectedImageUrl?: string;
}

const templateKeywords: Record<string, string[]> = {
  emotion_button: ['calm', 'peaceful', 'nature', 'meditation', 'zen'],
  emotion_coach: ['mindfulness', 'wellness', 'self-care', 'mental health', 'peaceful'],
  parent_coach: ['family', 'parenting', 'love', 'children', 'warmth'],
  communication_coach: ['conversation', 'connection', 'people', 'relationship', 'teamwork'],
  training_camp: ['growth', 'learning', 'journey', 'success', 'motivation'],
  '365_member': ['premium', 'lifestyle', 'success', 'elegant', 'luxury'],
  partner_recruit: ['business', 'opportunity', 'entrepreneurship', 'success', 'growth'],
};

const colorOptions = [
  { value: '', label: '全部', color: 'bg-gradient-to-r from-rose-400 via-amber-400 to-teal-400' },
  { value: 'green', label: '绿色', color: 'bg-green-500' },
  { value: 'blue', label: '蓝色', color: 'bg-blue-500' },
  { value: 'purple', label: '紫色', color: 'bg-purple-500' },
  { value: 'orange', label: '橙色', color: 'bg-orange-500' },
  { value: 'teal', label: '青色', color: 'bg-teal-500' },
];

export const UnsplashImagePicker = ({ 
  templateKey, 
  onImageSelect, 
  selectedImageUrl 
}: UnsplashImagePickerProps) => {
  const [images, setImages] = useState<UnsplashImage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedColor, setSelectedColor] = useState('');

  const fetchImages = async (color?: string) => {
    setIsLoading(true);
    try {
      const keywords = templateKeywords[templateKey] || ['inspiration', 'beautiful'];
      
      const { data, error } = await supabase.functions.invoke('fetch-unsplash-image', {
        body: { 
          keywords: keywords.slice(0, 3),
          orientation: 'portrait',
          color: color || undefined,
          perPage: 6
        }
      });

      if (error) throw error;
      
      if (data?.images) {
        setImages(data.images);
      }
    } catch (error) {
      console.error('Error fetching Unsplash images:', error);
      toast.error('获取图片失败，请重试');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchImages(selectedColor);
  }, [templateKey]);

  const handleColorChange = (color: string) => {
    setSelectedColor(color);
    fetchImages(color);
  };

  const handleRefresh = () => {
    fetchImages(selectedColor);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          {colorOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => handleColorChange(option.value)}
              className={cn(
                "w-6 h-6 rounded-full transition-all",
                option.color,
                selectedColor === option.value 
                  ? "ring-2 ring-offset-2 ring-primary" 
                  : "opacity-70 hover:opacity-100"
              )}
              title={option.label}
            />
          ))}
        </div>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={handleRefresh}
          disabled={isLoading}
        >
          <RefreshCw className={cn("w-4 h-4 mr-1", isLoading && "animate-spin")} />
          换一批
        </Button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-3 gap-2">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="aspect-[9/16] bg-muted animate-pulse rounded-lg" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-2">
          {images.map((image) => (
            <button
              key={image.id}
              onClick={() => onImageSelect(image.urls.regular, { 
                name: image.author.name, 
                link: image.author.link 
              })}
              className={cn(
                "relative aspect-[9/16] rounded-lg overflow-hidden group transition-all",
                selectedImageUrl === image.urls.regular 
                  ? "ring-2 ring-primary ring-offset-2" 
                  : "hover:ring-2 hover:ring-muted-foreground/30"
              )}
            >
              <img
                src={image.urls.small}
                alt={image.alt}
                className="w-full h-full object-cover"
              />
              {selectedImageUrl === image.urls.regular && (
                <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                  <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                    <Check className="w-5 h-5 text-primary-foreground" />
                  </div>
                </div>
              )}
              <div className="absolute bottom-0 left-0 right-0 p-1.5 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                <a 
                  href={image.author.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="text-[10px] text-white/80 flex items-center gap-0.5 hover:text-white"
                >
                  {image.author.name}
                  <ExternalLink className="w-2.5 h-2.5" />
                </a>
              </div>
            </button>
          ))}
        </div>
      )}

      <p className="text-xs text-muted-foreground text-center">
        图片来自 <a href="https://unsplash.com" target="_blank" rel="noopener noreferrer" className="underline">Unsplash</a>
      </p>
    </div>
  );
};
