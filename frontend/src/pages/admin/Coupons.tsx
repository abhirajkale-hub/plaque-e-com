import { useState, useEffect } from "react";
import {
  couponService,
  type Coupon as CouponType,
} from "@/services/CouponService";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus, Edit, Trash, Percent } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const AdminCoupons = () => {
  const [coupons, setCoupons] = useState<CouponType[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<CouponType | null>(null);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    code: "",
    discount_type: "percentage" as "percentage" | "fixed",
    discount_value: "",
    min_order_amount: "",
    max_discount_amount: "",
    usage_limit: "",
    unlimited_usage: false,
    never_expires: false,
    is_active: true,
    starts_at: "",
    expires_at: "",
    description: "",
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const result = await couponService.getAllCoupons();
        setCoupons(result.data);
      } catch (error) {
        console.error("Failed to load coupons:", error);
        toast({
          title: "Error",
          description: "Failed to load coupons. Please try again.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [toast]);

  const loadCoupons = async () => {
    try {
      setLoading(true);
      const result = await couponService.getAllCoupons();
      setCoupons(result.data);
    } catch (error) {
      console.error("Failed to load coupons:", error);
      toast({
        title: "Error",
        description: "Failed to load coupons. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setSubmitting(true);

      const couponData = {
        code: formData.code.toUpperCase(),
        discount_type: formData.discount_type,
        discount_value: parseFloat(formData.discount_value),
        min_order_amount: formData.min_order_amount
          ? parseFloat(formData.min_order_amount)
          : undefined,
        max_discount_amount: formData.max_discount_amount
          ? parseFloat(formData.max_discount_amount)
          : undefined,
        usage_limit: formData.unlimited_usage
          ? undefined
          : formData.usage_limit
          ? parseInt(formData.usage_limit)
          : undefined,
        is_active: formData.is_active,
        starts_at: formData.starts_at || undefined,
        expires_at: formData.never_expires
          ? undefined
          : formData.expires_at || undefined,
        description: formData.description || undefined,
      };

      if (editingCoupon) {
        await couponService.updateCoupon(editingCoupon._id, couponData);
        toast({
          title: "Success",
          description: "Coupon updated successfully",
        });
      } else {
        await couponService.createCoupon(couponData);
        toast({
          title: "Success",
          description: "Coupon created successfully",
        });
      }

      setDialogOpen(false);
      resetForm();
      loadCoupons();
    } catch (error) {
      console.error("Failed to save coupon:", error);
      const errorMessage =
        error instanceof Error && "response" in error
          ? (error as { response?: { data?: { message?: string } } }).response
              ?.data?.message
          : "Failed to save coupon. Please try again.";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this coupon?")) return;

    try {
      await couponService.deleteCoupon(id);
      toast({ title: "Success", description: "Coupon deleted successfully" });
      loadCoupons();
    } catch (error) {
      console.error("Failed to delete coupon:", error);
      const errorMessage =
        error instanceof Error && "response" in error
          ? (error as { response?: { data?: { message?: string } } }).response
              ?.data?.message
          : "Failed to delete coupon. Please try again.";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const toggleActive = async (id: string, isActive: boolean) => {
    try {
      await couponService.updateCoupon(id, { is_active: !isActive });
      toast({
        title: "Success",
        description: `Coupon ${
          !isActive ? "activated" : "deactivated"
        } successfully`,
      });
      loadCoupons();
    } catch (error) {
      console.error("Failed to toggle coupon status:", error);
      const errorMessage =
        error instanceof Error && "response" in error
          ? (error as { response?: { data?: { message?: string } } }).response
              ?.data?.message
          : "Failed to update coupon status. Please try again.";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setFormData({
      code: "",
      discount_type: "percentage",
      discount_value: "",
      min_order_amount: "",
      max_discount_amount: "",
      usage_limit: "",
      unlimited_usage: false,
      never_expires: false,
      is_active: true,
      starts_at: "",
      expires_at: "",
      description: "",
    });
    setEditingCoupon(null);
  };

  const handleEdit = (coupon: CouponType) => {
    setEditingCoupon(coupon);
    setFormData({
      code: coupon.code,
      discount_type: coupon.discount_type,
      discount_value: coupon.discount_value.toString(),
      min_order_amount: coupon.min_order_amount?.toString() || "",
      max_discount_amount: coupon.max_discount_amount?.toString() || "",
      usage_limit: coupon.usage_limit?.toString() || "",
      unlimited_usage: !coupon.usage_limit,
      never_expires: !coupon.expires_at,
      is_active: coupon.is_active,
      starts_at: coupon.starts_at || "",
      expires_at: coupon.expires_at || "",
      description: coupon.description || "",
    });
    setDialogOpen(true);
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Coupons</h2>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => resetForm()}>
              <Plus className="h-4 w-4 mr-2" />
              Add Coupon
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingCoupon ? "Edit Coupon" : "Create New Coupon"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="code">Coupon Code</Label>
                <Input
                  id="code"
                  value={formData.code}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      code: e.target.value.toUpperCase(),
                    })
                  }
                  placeholder="WELCOME10"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="discount_type">Discount Type</Label>
                  <Select
                    value={formData.discount_type}
                    onValueChange={(value: "percentage" | "fixed") =>
                      setFormData({ ...formData, discount_type: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percentage">Percentage</SelectItem>
                      <SelectItem value="fixed">Fixed Amount</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="discount_value">
                    Discount Value{" "}
                    {formData.discount_type === "percentage" && "(%)"}
                  </Label>
                  <Input
                    id="discount_value"
                    type="number"
                    step="0.01"
                    value={formData.discount_value}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        discount_value: e.target.value,
                      })
                    }
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="min_order_amount">Min Order Amount (₹)</Label>
                  <Input
                    id="min_order_amount"
                    type="number"
                    step="0.01"
                    value={formData.min_order_amount}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        min_order_amount: e.target.value,
                      })
                    }
                  />
                </div>

                <div>
                  <Label htmlFor="max_discount_amount">
                    Max Discount Amount (₹)
                  </Label>
                  <Input
                    id="max_discount_amount"
                    type="number"
                    step="0.01"
                    value={formData.max_discount_amount}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        max_discount_amount: e.target.value,
                      })
                    }
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center space-x-2 mb-2">
                  <Switch
                    checked={formData.unlimited_usage}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, unlimited_usage: checked })
                    }
                  />
                  <Label>Unlimited Usage</Label>
                </div>
                {!formData.unlimited_usage && (
                  <div>
                    <Label htmlFor="usage_limit">Usage Limit</Label>
                    <Input
                      id="usage_limit"
                      type="number"
                      value={formData.usage_limit}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          usage_limit: e.target.value,
                        })
                      }
                    />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="starts_at">Start Date</Label>
                  <Input
                    id="starts_at"
                    type="date"
                    value={formData.starts_at}
                    onChange={(e) =>
                      setFormData({ ...formData, starts_at: e.target.value })
                    }
                  />
                </div>

                <div>
                  <div className="flex items-center space-x-2 mb-2">
                    <Switch
                      checked={formData.never_expires}
                      onCheckedChange={(checked) =>
                        setFormData({ ...formData, never_expires: checked })
                      }
                    />
                    <Label>Never Expires</Label>
                  </div>
                  {!formData.never_expires && (
                    <div>
                      <Label htmlFor="expires_at">Expiry Date</Label>
                      <Input
                        id="expires_at"
                        type="date"
                        value={formData.expires_at}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            expires_at: e.target.value,
                          })
                        }
                      />
                    </div>
                  )}
                </div>
              </div>

              <div>
                <Label htmlFor="description">Description (Optional)</Label>
                <Input
                  id="description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="Brief description of the coupon"
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  checked={formData.is_active}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, is_active: checked })
                  }
                />
                <Label>Active</Label>
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      {editingCoupon ? "Updating..." : "Creating..."}
                    </>
                  ) : (
                    `${editingCoupon ? "Update" : "Create"} Coupon`
                  )}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {coupons.length === 0 ? (
        <Card className="p-12 text-center">
          <p className="text-muted-foreground">
            No coupons yet. Create your first coupon!
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          {coupons.map((coupon) => (
            <Card key={coupon._id} className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold">{coupon.code}</h3>
                    <Badge variant={coupon.is_active ? "default" : "secondary"}>
                      {coupon.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Discount</p>
                      <p className="font-medium">
                        {coupon.discount_type === "percentage"
                          ? `${coupon.discount_value}%`
                          : `₹${coupon.discount_value}`}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Usage</p>
                      <p className="font-medium">
                        {coupon.times_used} / {coupon.usage_limit || "∞"}
                      </p>
                    </div>
                    {coupon.min_order_amount && (
                      <div>
                        <p className="text-muted-foreground">Min Order</p>
                        <p className="font-medium">
                          ₹{coupon.min_order_amount}
                        </p>
                      </div>
                    )}
                    {coupon.expires_at && (
                      <div>
                        <p className="text-muted-foreground">Expires</p>
                        <p className="font-medium">
                          {new Date(coupon.expires_at).toLocaleDateString()}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex gap-2 ml-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => toggleActive(coupon._id, coupon.is_active)}
                  >
                    <Switch checked={coupon.is_active} />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(coupon)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(coupon._id)}
                  >
                    <Trash className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminCoupons;
