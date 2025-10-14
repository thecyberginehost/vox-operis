import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Slider } from '@/components/ui/slider';
import {
  Image as ImageIcon,
  Palette,
  Eye,
  Upload,
  X,
  Check,
  User
} from 'lucide-react';
import { BackgroundOptions } from '@/hooks/useBackgroundReplacement';
import { cn } from '@/lib/utils';

interface BackgroundSelectorProps {
  currentBackground: BackgroundOptions;
  onBackgroundChange: (background: BackgroundOptions) => void;
  className?: string;
}

// Preset backgrounds
const PRESET_COLORS = [
  { value: '#ffffff', name: 'White' },
  { value: '#000000', name: 'Black' },
  { value: '#1f2937', name: 'Dark Gray' },
  { value: '#3b82f6', name: 'Blue' },
  { value: '#10b981', name: 'Green' },
  { value: '#8b5cf6', name: 'Purple' },
  { value: '#ef4444', name: 'Red' },
  { value: '#f59e0b', name: 'Orange' }
];

const PRESET_IMAGES = [
  {
    url: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=640&h=480&fit=crop',
    name: 'Office',
    thumbnail: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=150&h=100&fit=crop'
  },
  {
    url: 'https://images.unsplash.com/photo-1524758631624-e2822e304c36?w=640&h=480&fit=crop',
    name: 'Library',
    thumbnail: 'https://images.unsplash.com/photo-1524758631624-e2822e304c36?w=150&h=100&fit=crop'
  },
  {
    url: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=640&h=480&fit=crop',
    name: 'Living Room',
    thumbnail: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=150&h=100&fit=crop'
  },
  {
    url: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=640&h=480&fit=crop',
    name: 'Meeting Room',
    thumbnail: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=150&h=100&fit=crop'
  },
  {
    url: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=640&h=480&fit=crop',
    name: 'Tech Office',
    thumbnail: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=150&h=100&fit=crop'
  },
  {
    url: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=640&h=480&fit=crop',
    name: 'Cafe',
    thumbnail: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=150&h=100&fit=crop'
  }
];

export const BackgroundSelector: React.FC<BackgroundSelectorProps> = ({
  currentBackground,
  onBackgroundChange,
  className
}) => {
  const [customColor, setCustomColor] = useState('#00ff00');
  const [blurIntensity, setBlurIntensity] = useState([10]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleColorSelect = (color: string, name: string) => {
    onBackgroundChange({
      type: 'color',
      value: color,
      name
    });
  };

  const handleImageSelect = (imageUrl: string, name: string) => {
    onBackgroundChange({
      type: 'image',
      value: imageUrl,
      name
    });
  };

  const handleBlurChange = (intensity: number[]) => {
    setBlurIntensity(intensity);
    onBackgroundChange({
      type: 'blur',
      value: intensity[0].toString(),
      name: `Blur ${intensity[0]}px`
    });
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const url = URL.createObjectURL(file);
      onBackgroundChange({
        type: 'image',
        value: url,
        name: `Custom: ${file.name}`
      });
    }
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const isBackgroundSelected = (type: string, value?: string) => {
    return currentBackground.type === type && currentBackground.value === value;
  };

  return (
    <Card className={cn("w-full max-w-md bg-background/95 backdrop-blur-sm border-border/50", className)}>
      <CardContent className="p-4">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Background</h3>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onBackgroundChange({ type: 'none' })}
              className={cn(
                "gap-2",
                currentBackground.type === 'none' && "bg-primary text-primary-foreground"
              )}
            >
              <User className="h-4 w-4" />
              None
              {currentBackground.type === 'none' && <Check className="h-3 w-3" />}
            </Button>
          </div>

          <Tabs defaultValue="colors" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="colors" className="gap-1">
                <Palette className="h-4 w-4" />
                Colors
              </TabsTrigger>
              <TabsTrigger value="images" className="gap-1">
                <ImageIcon className="h-4 w-4" />
                Images
              </TabsTrigger>
              <TabsTrigger value="effects" className="gap-1">
                <Eye className="h-4 w-4" />
                Effects
              </TabsTrigger>
            </TabsList>

            {/* Color Backgrounds */}
            <TabsContent value="colors" className="space-y-3">
              <div className="grid grid-cols-4 gap-2">
                {PRESET_COLORS.map((color) => (
                  <button
                    key={color.value}
                    onClick={() => handleColorSelect(color.value, color.name)}
                    className={cn(
                      "relative w-12 h-12 rounded-lg border-2 transition-all hover:scale-105",
                      isBackgroundSelected('color', color.value)
                        ? "border-primary ring-2 ring-primary/20"
                        : "border-border hover:border-primary/50"
                    )}
                    style={{ backgroundColor: color.value }}
                    title={color.name}
                  >
                    {isBackgroundSelected('color', color.value) && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Check className="h-4 w-4 text-white drop-shadow" />
                      </div>
                    )}
                  </button>
                ))}
              </div>

              {/* Custom Color */}
              <div className="space-y-2">
                <Label htmlFor="custom-color">Custom Color</Label>
                <div className="flex space-x-2">
                  <Input
                    id="custom-color"
                    type="color"
                    value={customColor}
                    onChange={(e) => setCustomColor(e.target.value)}
                    className="w-16 h-10 p-1 border"
                  />
                  <Button
                    variant="outline"
                    onClick={() => handleColorSelect(customColor, 'Custom Color')}
                    className="flex-1"
                  >
                    Apply Custom Color
                  </Button>
                </div>
              </div>
            </TabsContent>

            {/* Image Backgrounds */}
            <TabsContent value="images" className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                {PRESET_IMAGES.map((image) => (
                  <button
                    key={image.url}
                    onClick={() => handleImageSelect(image.url, image.name)}
                    className={cn(
                      "relative aspect-video rounded-lg overflow-hidden border-2 transition-all hover:scale-105",
                      isBackgroundSelected('image', image.url)
                        ? "border-primary ring-2 ring-primary/20"
                        : "border-border hover:border-primary/50"
                    )}
                    title={image.name}
                  >
                    <img
                      src={image.thumbnail}
                      alt={image.name}
                      className="w-full h-full object-cover"
                    />
                    {isBackgroundSelected('image', image.url) && (
                      <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                        <Check className="h-4 w-4 text-white drop-shadow" />
                      </div>
                    )}
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2">
                      <p className="text-white text-xs font-medium">{image.name}</p>
                    </div>
                  </button>
                ))}
              </div>

              {/* Custom Image Upload */}
              <div className="border-2 border-dashed border-border rounded-lg p-4 text-center">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  ref={fileInputRef}
                  className="hidden"
                />
                <Button
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Custom Image
                </Button>
                <p className="text-xs text-muted-foreground mt-2">
                  JPG, PNG, WebP up to 5MB
                </p>
              </div>
            </TabsContent>

            {/* Effects */}
            <TabsContent value="effects" className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Background Blur</Label>
                  <span className="text-sm text-muted-foreground">
                    {blurIntensity[0]}px
                  </span>
                </div>
                <Slider
                  value={blurIntensity}
                  onValueChange={handleBlurChange}
                  max={30}
                  min={0}
                  step={1}
                  className="w-full"
                />
                <p className="text-xs text-muted-foreground">
                  Blur the entire background for a softer look
                </p>
              </div>
            </TabsContent>
          </Tabs>

          {/* Current Selection Display */}
          {currentBackground.type !== 'none' && (
            <div className="pt-3 border-t">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Current:</span>
                <div className="flex items-center space-x-2">
                  <span className="font-medium">
                    {currentBackground.name || currentBackground.type}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onBackgroundChange({ type: 'none' })}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};