import { useState, useEffect } from 'react';
import { mockSettings } from '@/data/mockProducts';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Save } from 'lucide-react';

const AdminSEO = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const [settings, setSettings] = useState({
    ga4_id: '',
    meta_pixel_id: ''
  });

  useEffect(() => {
    // Load mock settings
    setTimeout(() => {
      setSettings({
        ga4_id: mockSettings.ga4_id || '',
        meta_pixel_id: mockSettings.meta_pixel_id || ''
      });
      setLoading(false);
    }, 300);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      toast({
        title: 'Success',
        description: 'SEO settings would be updated (mock data)'
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
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
      <h1 className="text-3xl font-bold mb-8">SEO Settings</h1>
      
      <Card className="p-6 max-w-2xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Label htmlFor="ga4_id">Google Analytics 4 ID</Label>
            <Input
              id="ga4_id"
              value={settings.ga4_id}
              onChange={(e) => setSettings({ ...settings, ga4_id: e.target.value })}
              placeholder="G-XXXXXXXXXX"
            />
            <p className="text-sm text-muted-foreground mt-1">
              Add your GA4 measurement ID to track website analytics
            </p>
          </div>

          <div>
            <Label htmlFor="meta_pixel_id">Meta (Facebook) Pixel ID</Label>
            <Input
              id="meta_pixel_id"
              value={settings.meta_pixel_id}
              onChange={(e) => setSettings({ ...settings, meta_pixel_id: e.target.value })}
              placeholder="XXXXXXXXXXXXXXX"
            />
            <p className="text-sm text-muted-foreground mt-1">
              Add your Meta Pixel ID to track conversions and retargeting
            </p>
          </div>

          <Button type="submit" disabled={saving} className="w-full">
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save SEO Settings
              </>
            )}
          </Button>
        </form>
      </Card>
    </div>
  );
};

export default AdminSEO;
