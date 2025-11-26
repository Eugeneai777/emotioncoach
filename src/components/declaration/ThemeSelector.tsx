import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { themes } from "@/config/themes";
import { useToast } from "@/hooks/use-toast";

interface ThemeSelectorProps {
  selectedTheme: string;
  onThemeChange: (themeId: string) => void;
  customBackground: string | null;
  onCustomBackgroundChange: (imageUrl: string | null) => void;
}

export const ThemeSelector = ({
  selectedTheme,
  onThemeChange,
  customBackground,
  onCustomBackgroundChange,
}: ThemeSelectorProps) => {
  const { toast } = useToast();

  const handleCustomImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: "文件过大",
          description: "请上传小于10MB的图片",
          variant: "destructive",
        });
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        onCustomBackgroundChange(result);
        onThemeChange('custom');
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="space-y-2">
      <Label className="text-xs sm:text-sm font-semibold text-foreground">选择主题</Label>
      <div className="grid grid-cols-4 gap-2">
        {themes.map((theme) => (
          <button
            key={theme.id}
            onClick={() => {
              if (theme.id === 'custom') {
                document.getElementById('custom-bg-upload')?.click();
              } else {
                onThemeChange(theme.id);
              }
            }}
            className={`relative aspect-square rounded-lg overflow-hidden transition-all ${
              selectedTheme === theme.id
                ? 'ring-2 ring-primary ring-offset-2 scale-105'
                : 'hover:scale-105'
            }`}
            style={{
              background: theme.id === 'custom' && customBackground
                ? `url(${customBackground})`
                : theme.gradient,
              backgroundSize: 'cover',
              backgroundPosition: 'center'
            }}
          >
            <div className="absolute inset-0 flex items-center justify-center text-2xl">
              {theme.emoji}
            </div>
          </button>
        ))}
      </div>
      <Input
        type="file"
        accept="image/*"
        onChange={handleCustomImageUpload}
        className="hidden"
        id="custom-bg-upload"
      />
    </div>
  );
};
