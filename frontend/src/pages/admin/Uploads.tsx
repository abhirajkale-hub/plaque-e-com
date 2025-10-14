import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Check, X, Image as ImageIcon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface GalleryUpload {
  id: string;
  image_url: string;
  caption: string | null;
  is_featured: boolean;
  is_approved: boolean;
  created_at: string;
}

const AdminUploads = () => {
  const [uploads, setUploads] = useState<GalleryUpload[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    // Load mock uploads
    setTimeout(() => {
      setUploads([]);
      setLoading(false);
    }, 300);
  }, []);

  const updateUpload = async (id: string, updates: Partial<GalleryUpload>) => {
    try {
      toast({
        title: 'Success',
        description: 'Upload would be updated (mock data)'
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">Customer Uploads</h1>
      
      {uploads.length === 0 ? (
        <Card className="p-12 text-center">
          <ImageIcon className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">No customer uploads yet</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {uploads.map((upload) => (
            <Card key={upload.id} className="overflow-hidden">
              <div className="aspect-square relative">
                <img
                  src={upload.image_url}
                  alt={upload.caption || 'Customer upload'}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="p-4 space-y-3">
                {upload.caption && (
                  <p className="text-sm text-muted-foreground">{upload.caption}</p>
                )}
                
                <div className="flex gap-2">
                  {upload.is_approved && <Badge variant="default">Approved</Badge>}
                  {upload.is_featured && <Badge variant="secondary">Featured</Badge>}
                  {!upload.is_approved && <Badge variant="outline">Pending</Badge>}
                </div>

                <div className="flex gap-2">
                  {!upload.is_approved && (
                    <Button
                      size="sm"
                      onClick={() => updateUpload(upload.id, { is_approved: true })}
                      className="flex-1"
                    >
                      <Check className="h-4 w-4 mr-1" />
                      Approve
                    </Button>
                  )}
                  
                  <Button
                    size="sm"
                    variant={upload.is_featured ? 'outline' : 'secondary'}
                    onClick={() => updateUpload(upload.id, { is_featured: !upload.is_featured })}
                    className="flex-1"
                  >
                    {upload.is_featured ? 'Unfeature' : 'Feature'}
                  </Button>

                  {upload.is_approved && (
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => updateUpload(upload.id, { is_approved: false })}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminUploads;
