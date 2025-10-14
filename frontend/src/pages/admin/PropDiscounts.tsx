import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { usePropDiscounts } from '@/contexts/PropDiscountsContext';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Pencil, Trash2, Plus, AlertCircle } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { PropDiscount, PropBanner } from '@/data/mockPropDiscounts';
import { Alert, AlertDescription } from '@/components/ui/alert';

const AdminPropDiscounts = () => {
  const { 
    discounts, 
    banners, 
    availableTags,
    addDiscount, 
    updateDiscount, 
    deleteDiscount,
    addBanner,
    updateBanner,
    deleteBanner
  } = usePropDiscounts();

  return (
    <div className="container py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Prop Firm Discounts</h1>
        <p className="text-muted-foreground">Manage discount codes and banner slides (mock data - resets on refresh)</p>
      </div>

      <Alert className="mb-6">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          <strong>Mock Mode:</strong> This module runs on in-memory JSON. Changes will reset on page refresh. For persistence, connect a backend later.
        </AlertDescription>
      </Alert>

      <Tabs defaultValue="discounts" className="space-y-6">
        <TabsList>
          <TabsTrigger value="discounts">Discounts</TabsTrigger>
          <TabsTrigger value="banners">Banner Slider</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        {/* Discounts Tab */}
        <TabsContent value="discounts" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold">Discount Codes</h2>
            <DiscountDialog mode="add" onSave={addDiscount} availableTags={availableTags} />
          </div>

          <div className="grid gap-4">
            {discounts.map(discount => (
              <DiscountCard
                key={discount.id}
                discount={discount}
                onUpdate={updateDiscount}
                onDelete={deleteDiscount}
                availableTags={availableTags}
              />
            ))}
          </div>
        </TabsContent>

        {/* Banners Tab */}
        <TabsContent value="banners" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold">Banner Slides</h2>
            <BannerDialog mode="add" onSave={addBanner} />
          </div>

          <div className="grid gap-4">
            {banners.map(banner => (
              <BannerCard
                key={banner.id}
                banner={banner}
                onUpdate={updateBanner}
                onDelete={deleteBanner}
              />
            ))}
          </div>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle>Module Information</CardTitle>
              <CardDescription>Mock data configuration</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                This module runs on mock JSON data stored in-memory. All changes are temporary and will reset when you refresh the page.
              </p>
              <p className="text-sm text-muted-foreground">
                To enable persistence, you would need to connect this to a backend database (Supabase, etc.).
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

// Discount Card Component
const DiscountCard = ({ 
  discount, 
  onUpdate, 
  onDelete,
  availableTags 
}: { 
  discount: PropDiscount; 
  onUpdate: (id: string, data: Partial<PropDiscount>) => void;
  onDelete: (id: string) => void;
  availableTags: string[];
}) => {
  const endDate = new Date(discount.endDate);
  const isExpired = endDate < new Date();

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h3 className="font-bold text-lg">{discount.firmName}</h3>
              <Switch
                checked={discount.active}
                onCheckedChange={(active) => onUpdate(discount.id, { active })}
              />
              {isExpired && <Badge variant="destructive">Expired</Badge>}
              <Badge variant="outline">Priority: {discount.priority}</Badge>
            </div>
            <p className="text-sm text-muted-foreground mb-2">{discount.short}</p>
            <div className="flex gap-2 mb-2">
              <code className="text-sm bg-primary/10 px-2 py-1 rounded">{discount.code}</code>
              <a 
                href={discount.linkUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-sm text-primary hover:underline"
              >
                {discount.linkUrl}
              </a>
            </div>
            <div className="flex flex-wrap gap-1 mb-2">
              {discount.tags.map(tag => (
                <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              Valid: {discount.startDate} → {discount.endDate}
            </p>
            {discount.notes && (
              <p className="text-xs text-muted-foreground mt-1">Notes: {discount.notes}</p>
            )}
          </div>

          <div className="flex gap-2">
            <DiscountDialog 
              mode="edit" 
              discount={discount}
              onSave={(data) => onUpdate(discount.id, data)}
              availableTags={availableTags}
            />
            <Button
              variant="destructive"
              size="icon"
              onClick={() => {
                if (confirm(`Delete discount for ${discount.firmName}?`)) {
                  onDelete(discount.id);
                  toast({ title: "Discount deleted" });
                }
              }}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Discount Dialog Component
const DiscountDialog = ({ 
  mode, 
  discount, 
  onSave,
  availableTags 
}: { 
  mode: 'add' | 'edit'; 
  discount?: PropDiscount;
  onSave: (data: any) => void;
  availableTags: string[];
}) => {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState<Partial<PropDiscount>>(
    discount || {
      firmName: '',
      logo: '/placeholder.svg',
      short: '',
      code: '',
      linkUrl: '',
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      active: true,
      tags: [],
      priority: 5,
      notes: ''
    }
  );

  const handleSave = () => {
    onSave(formData);
    setOpen(false);
    toast({ title: mode === 'add' ? 'Discount added' : 'Discount updated' });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant={mode === 'add' ? 'default' : 'outline'} size={mode === 'add' ? 'default' : 'icon'}>
          {mode === 'add' ? (
            <>
              <Plus className="w-4 h-4 mr-2" />
              Add Discount
            </>
          ) : (
            <Pencil className="w-4 h-4" />
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{mode === 'add' ? 'Add' : 'Edit'} Discount</DialogTitle>
          <DialogDescription>
            {mode === 'add' ? 'Create a new' : 'Update the'} prop firm discount
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="firmName">Firm Name *</Label>
            <Input
              id="firmName"
              value={formData.firmName}
              onChange={(e) => setFormData({ ...formData, firmName: e.target.value })}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="logo">Logo URL</Label>
            <Input
              id="logo"
              value={formData.logo}
              onChange={(e) => setFormData({ ...formData, logo: e.target.value })}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="short">Short Description *</Label>
            <Input
              id="short"
              value={formData.short}
              onChange={(e) => setFormData({ ...formData, short: e.target.value })}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="code">Discount Code *</Label>
            <Input
              id="code"
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value })}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="linkUrl">Link URL *</Label>
            <Input
              id="linkUrl"
              type="url"
              value={formData.linkUrl}
              onChange={(e) => setFormData({ ...formData, linkUrl: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="endDate">End Date</Label>
              <Input
                id="endDate"
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
              />
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="tags">Tags (comma-separated)</Label>
            <Input
              id="tags"
              value={formData.tags?.join(', ')}
              onChange={(e) => setFormData({ 
                ...formData, 
                tags: e.target.value.split(',').map(t => t.trim()).filter(Boolean)
              })}
              placeholder="e.g., instant funding, 2-phase, forex"
            />
            <p className="text-xs text-muted-foreground">
              Available: {availableTags.join(', ')}
            </p>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="priority">Priority (higher = shows first)</Label>
            <Input
              id="priority"
              type="number"
              value={formData.priority}
              onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) })}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="notes">Notes (admin only)</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            />
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="active"
              checked={formData.active}
              onCheckedChange={(active) => setFormData({ ...formData, active })}
            />
            <Label htmlFor="active">Active</Label>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={handleSave}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// Banner Card Component
const BannerCard = ({ 
  banner, 
  onUpdate, 
  onDelete 
}: { 
  banner: PropBanner; 
  onUpdate: (id: string, data: Partial<PropBanner>) => void;
  onDelete: (id: string) => void;
}) => {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="font-bold text-lg mb-2">{banner.title}</h3>
            <p className="text-sm text-muted-foreground mb-2">{banner.subtitle}</p>
            <p className="text-xs text-muted-foreground mb-1">Image: {banner.image}</p>
            <div className="flex gap-4 text-xs">
              <span>Primary: {banner.primaryCta.label} → {banner.primaryCta.href}</span>
              <span>Secondary: {banner.secondaryCta.label} → {banner.secondaryCta.href}</span>
            </div>
          </div>

          <div className="flex gap-2">
            <BannerDialog 
              mode="edit" 
              banner={banner}
              onSave={(data) => onUpdate(banner.id, data)}
            />
            <Button
              variant="destructive"
              size="icon"
              onClick={() => {
                if (confirm(`Delete banner "${banner.title}"?`)) {
                  onDelete(banner.id);
                  toast({ title: "Banner deleted" });
                }
              }}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Banner Dialog Component
const BannerDialog = ({ 
  mode, 
  banner, 
  onSave 
}: { 
  mode: 'add' | 'edit'; 
  banner?: PropBanner;
  onSave: (data: any) => void;
}) => {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState<Partial<PropBanner>>(
    banner || {
      image: '/placeholder.svg',
      title: '',
      subtitle: '',
      primaryCta: { label: 'Buy Now', href: '', target: '_blank' },
      secondaryCta: { label: 'Learn More', href: '', target: '_self' }
    }
  );

  const handleSave = () => {
    onSave(formData);
    setOpen(false);
    toast({ title: mode === 'add' ? 'Banner added' : 'Banner updated' });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant={mode === 'add' ? 'default' : 'outline'} size={mode === 'add' ? 'default' : 'icon'}>
          {mode === 'add' ? (
            <>
              <Plus className="w-4 h-4 mr-2" />
              Add Banner
            </>
          ) : (
            <Pencil className="w-4 h-4" />
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{mode === 'add' ? 'Add' : 'Edit'} Banner Slide</DialogTitle>
          <DialogDescription>
            {mode === 'add' ? 'Create a new' : 'Update the'} hero banner slide
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="image">Image URL</Label>
            <Input
              id="image"
              value={formData.image}
              onChange={(e) => setFormData({ ...formData, image: e.target.value })}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="subtitle">Subtitle</Label>
            <Input
              id="subtitle"
              value={formData.subtitle}
              onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
            />
          </div>

          <div className="grid gap-2">
            <Label>Primary CTA</Label>
            <div className="grid grid-cols-3 gap-2">
              <Input
                placeholder="Label"
                value={formData.primaryCta?.label}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  primaryCta: { ...formData.primaryCta!, label: e.target.value }
                })}
              />
              <Input
                placeholder="URL"
                value={formData.primaryCta?.href}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  primaryCta: { ...formData.primaryCta!, href: e.target.value }
                })}
              />
              <Input
                placeholder="Target (_blank/_self)"
                value={formData.primaryCta?.target}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  primaryCta: { ...formData.primaryCta!, target: e.target.value }
                })}
              />
            </div>
          </div>

          <div className="grid gap-2">
            <Label>Secondary CTA</Label>
            <div className="grid grid-cols-3 gap-2">
              <Input
                placeholder="Label"
                value={formData.secondaryCta?.label}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  secondaryCta: { ...formData.secondaryCta!, label: e.target.value }
                })}
              />
              <Input
                placeholder="URL"
                value={formData.secondaryCta?.href}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  secondaryCta: { ...formData.secondaryCta!, href: e.target.value }
                })}
              />
              <Input
                placeholder="Target (_blank/_self)"
                value={formData.secondaryCta?.target}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  secondaryCta: { ...formData.secondaryCta!, target: e.target.value }
                })}
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={handleSave}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AdminPropDiscounts;
