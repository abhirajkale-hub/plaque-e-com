import { useState, useEffect } from 'react';
import { mockSettings } from '@/data/mockProducts';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Save } from 'lucide-react';

const AdminSettings = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const [settings, setSettings] = useState({
    contact_email: '',
    contact_phone: '',
    contact_address: '',
    gst_number: '',
    shipping_india_text: '',
    shipping_international_text: ''
  });

  useEffect(() => {
    // Load mock settings
    setTimeout(() => {
      setSettings({
        contact_email: mockSettings.contact_email,
        contact_phone: mockSettings.contact_phone,
        contact_address: mockSettings.contact_address,
        gst_number: mockSettings.gst_number || '',
        shipping_india_text: mockSettings.shipping_india_text,
        shipping_international_text: mockSettings.shipping_international_text
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
        description: 'Settings would be updated (mock data)'
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
      <h1 className="text-3xl font-bold mb-8">Site Settings</h1>
      
      <Card className="p-6 max-w-2xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold mb-4">Contact Information</h3>
            <div className="space-y-4">
              <div>
                <Label htmlFor="contact_email">Contact Email</Label>
                <Input
                  id="contact_email"
                  type="email"
                  value={settings.contact_email}
                  onChange={(e) => setSettings({ ...settings, contact_email: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="contact_phone">Contact Phone</Label>
                <Input
                  id="contact_phone"
                  value={settings.contact_phone}
                  onChange={(e) => setSettings({ ...settings, contact_phone: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="contact_address">Contact Address</Label>
                <Textarea
                  id="contact_address"
                  value={settings.contact_address}
                  onChange={(e) => setSettings({ ...settings, contact_address: e.target.value })}
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="gst_number">GST Number</Label>
                <Input
                  id="gst_number"
                  value={settings.gst_number}
                  onChange={(e) => setSettings({ ...settings, gst_number: e.target.value })}
                />
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-4">Shipping Information</h3>
            <div className="space-y-4">
              <div>
                <Label htmlFor="shipping_india_text">India Shipping Text</Label>
                <Input
                  id="shipping_india_text"
                  value={settings.shipping_india_text}
                  onChange={(e) => setSettings({ ...settings, shipping_india_text: e.target.value })}
                  placeholder="India: 5-7 days"
                />
              </div>

              <div>
                <Label htmlFor="shipping_international_text">International Shipping Text</Label>
                <Input
                  id="shipping_international_text"
                  value={settings.shipping_international_text}
                  onChange={(e) => setSettings({ ...settings, shipping_international_text: e.target.value })}
                  placeholder="International: 10–15 business days"
                />
              </div>
            </div>
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
                Save Settings
              </>
            )}
          </Button>
        </form>
      </Card>
    </div>
  );
};

export default AdminSettings;
