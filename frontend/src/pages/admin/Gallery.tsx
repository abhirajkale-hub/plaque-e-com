import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Trash2, Plus, Image as ImageIcon } from 'lucide-react';

interface GalleryImage {
  id: string;
  url: string;
  alt: string;
}

const AdminGallery = () => {
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [newImageUrl, setNewImageUrl] = useState('');
  const [newImageAlt, setNewImageAlt] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    loadImages();
  }, []);

  const loadImages = () => {
    const stored = localStorage.getItem('galleryImages');
    if (stored) {
      setImages(JSON.parse(stored));
    } else {
      // Default images
      const defaultImages: GalleryImage[] = [
        { id: '1', url: '/src/assets/gallery-1.jpg', alt: 'Trader Setup 1' },
        { id: '2', url: '/src/assets/gallery-2.jpg', alt: 'Trader Setup 2' },
        { id: '3', url: '/src/assets/gallery-3.jpg', alt: 'Trader Setup 3' }
      ];
      setImages(defaultImages);
      localStorage.setItem('galleryImages', JSON.stringify(defaultImages));
    }
  };

  const addImage = () => {
    if (!newImageUrl.trim()) {
      toast({
        title: 'URL required',
        description: 'Please enter an image URL',
        variant: 'destructive',
      });
      return;
    }

    const newImage: GalleryImage = {
      id: Date.now().toString(),
      url: newImageUrl,
      alt: newImageAlt || 'Gallery Image'
    };

    const updated = [...images, newImage];
    setImages(updated);
    localStorage.setItem('galleryImages', JSON.stringify(updated));
    
    // Trigger update event
    window.dispatchEvent(new Event('galleryUpdated'));

    setNewImageUrl('');
    setNewImageAlt('');

    toast({
      title: 'Image added',
      description: 'Gallery image has been added successfully',
    });
  };

  const deleteImage = (id: string) => {
    const updated = images.filter(img => img.id !== id);
    setImages(updated);
    localStorage.setItem('galleryImages', JSON.stringify(updated));
    
    // Trigger update event
    window.dispatchEvent(new Event('galleryUpdated'));

    toast({
      title: 'Image deleted',
      description: 'Gallery image has been removed',
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Gallery Images</h1>
        <p className="text-muted-foreground">Manage trader setup images shown on the homepage</p>
      </div>

      {/* Add New Image */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Add New Image
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="imageUrl">Image URL *</Label>
              <Input
                id="imageUrl"
                placeholder="https://example.com/image.jpg or /src/assets/image.jpg"
                value={newImageUrl}
                onChange={(e) => setNewImageUrl(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="imageAlt">Alt Text</Label>
              <Input
                id="imageAlt"
                placeholder="Trader Setup Description"
                value={newImageAlt}
                onChange={(e) => setNewImageAlt(e.target.value)}
              />
            </div>
          </div>
          <Button onClick={addImage}>
            <Plus className="h-4 w-4 mr-2" />
            Add Image
          </Button>
        </CardContent>
      </Card>

      {/* Current Images */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ImageIcon className="h-5 w-5" />
            Current Gallery Images ({images.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {images.map((image) => (
              <div key={image.id} className="space-y-3">
                <div className="aspect-square bg-muted rounded-lg overflow-hidden">
                  <img
                    src={image.url}
                    alt={image.alt}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.src = 'https://placehold.co/400x400?text=Image+Not+Found';
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium truncate">{image.alt}</p>
                  <p className="text-xs text-muted-foreground truncate">{image.url}</p>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => deleteImage(image.id)}
                    className="w-full"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </Button>
                </div>
              </div>
            ))}
          </div>
          
          {images.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <ImageIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No gallery images yet. Add your first image above.</p>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="bg-muted/50 p-4 rounded-lg text-sm space-y-2">
        <p className="font-medium">💡 Tips:</p>
        <ul className="list-disc list-inside space-y-1 text-muted-foreground">
          <li>Use high-quality images (at least 800x800px)</li>
          <li>Images should show trader setups with your awards</li>
          <li>Changes reflect on homepage in real-time</li>
          <li>You can use external URLs or local paths like /src/assets/image.jpg</li>
        </ul>
      </div>
    </div>
  );
};

export default AdminGallery;