import { useEffect, useState } from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { useAuth } from "@/hooks/useAuth";
import { userService, UserAddress, UserPreferences } from "@/services";
import { type User as UserType } from "@/services/UserService";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Loader2,
  User,
  Mail,
  Phone,
  Save,
  Shield,
  Package,
  TrendingUp,
  MapPin,
  Plus,
  Edit,
  Trash2,
  Settings,
  Download,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

const profileSchema = z.object({
  full_name: z
    .string()
    .trim()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name must be less than 100 characters"),
  phone: z
    .string()
    .trim()
    .min(10, "Phone must be at least 10 digits")
    .max(15, "Phone must be less than 15 digits")
    .optional()
    .or(z.literal("")),
});

type ProfileFormData = z.infer<typeof profileSchema>;

const addressSchema = z.object({
  full_name: z
    .string()
    .trim()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name must be less than 100 characters"),
  phone: z
    .string()
    .trim()
    .min(10, "Phone must be at least 10 digits")
    .max(15, "Phone must be less than 15 digits"),
  address_line_1: z
    .string()
    .trim()
    .min(5, "Address must be at least 5 characters")
    .max(200, "Address must be less than 200 characters"),
  address_line_2: z
    .string()
    .trim()
    .max(200, "Address must be less than 200 characters")
    .optional()
    .or(z.literal("")),
  city: z
    .string()
    .trim()
    .min(2, "City must be at least 2 characters")
    .max(50, "City must be less than 50 characters"),
  state: z
    .string()
    .trim()
    .min(2, "State must be at least 2 characters")
    .max(50, "State must be less than 50 characters"),
  country: z
    .string()
    .trim()
    .min(2, "Country must be at least 2 characters")
    .max(50, "Country must be less than 50 characters"),
  postal_code: z
    .string()
    .trim()
    .min(3, "Postal code must be at least 3 characters")
    .max(10, "Postal code must be less than 10 characters"),
  is_default: z.boolean().optional(),
});

type AddressFormData = z.infer<typeof addressSchema>;

const Profile = () => {
  const { user, isAdmin } = useAuth();
  const { toast } = useToast();
  const [profile, setProfile] = useState<UserType | null>(null);
  const [addresses, setAddresses] = useState<UserAddress[]>([]);
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [addressDialogOpen, setAddressDialogOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<UserAddress | null>(
    null
  );
  const [downloadingData, setDownloadingData] = useState(false);

  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      full_name: "",
      phone: "",
    },
  });

  const addressForm = useForm<AddressFormData>({
    resolver: zodResolver(addressSchema),
    defaultValues: {
      full_name: "",
      phone: "",
      address_line_1: "",
      address_line_2: "",
      city: "",
      state: "",
      country: "India",
      postal_code: "",
      is_default: false,
    },
  });

  useEffect(() => {
    if (!user) return;

    const fetchProfileData = async () => {
      try {
        setLoading(true);
        const [currentUser, userAddresses, userPreferences] = await Promise.all(
          [
            userService.getCurrentUser(),
            userService.getUserAddresses(),
            userService.getUserPreferences().catch(() => null), // Preferences might not exist
          ]
        );

        setProfile(currentUser);
        setAddresses(userAddresses || []);
        setPreferences(userPreferences);

        form.reset({
          full_name: currentUser.full_name || "",
          phone: currentUser.phone || "",
        });
      } catch (error) {
        console.error("Failed to fetch profile data:", error);
        // Ensure addresses is always an array even on error
        setAddresses([]);
        toast({
          title: "Error",
          description: "Failed to load profile data. Please refresh the page.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchProfileData();
  }, [user, form, toast]);

  const onSubmit = async (data: ProfileFormData) => {
    if (!user) return;

    try {
      setSaving(true);
      const updatedUser = await userService.updateProfile({
        full_name: data.full_name,
        phone: data.phone || undefined,
      });

      setProfile(updatedUser);

      toast({
        title: "Success",
        description: "Your profile has been updated successfully.",
      });
    } catch (error) {
      console.error("Failed to update profile:", error);
      toast({
        title: "Error",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleAddAddress = () => {
    setEditingAddress(null);
    addressForm.reset({
      full_name: profile?.full_name || "",
      phone: profile?.phone || "",
      address_line_1: "",
      address_line_2: "",
      city: "",
      state: "",
      country: "India",
      postal_code: "",
      is_default: !addresses || addresses.length === 0,
    });
    setAddressDialogOpen(true);
  };

  const handleEditAddress = (address: UserAddress) => {
    setEditingAddress(address);
    addressForm.reset({
      full_name: address.full_name,
      phone: address.phone,
      address_line_1: address.address_line_1,
      address_line_2: address.address_line_2 || "",
      city: address.city,
      state: address.state,
      country: address.country,
      postal_code: address.postal_code,
      is_default: address.is_default,
    });
    setAddressDialogOpen(true);
  };

  const onAddressSubmit = async (data: AddressFormData) => {
    try {
      setSaving(true);
      let savedAddress: UserAddress;

      // Ensure required fields are present
      const addressData = {
        full_name: data.full_name,
        phone: data.phone,
        address_line_1: data.address_line_1,
        address_line_2: data.address_line_2 || undefined,
        city: data.city,
        state: data.state,
        country: data.country,
        postal_code: data.postal_code,
        is_default: data.is_default || false,
      };

      if (editingAddress) {
        savedAddress = await userService.updateUserAddress(
          editingAddress._id,
          addressData
        );
        setAddresses((prev) =>
          prev.map((addr) =>
            addr._id === editingAddress._id ? savedAddress : addr
          )
        );
      } else {
        savedAddress = await userService.addUserAddress(addressData);
        setAddresses((prev) => [...prev, savedAddress]);
      }

      setAddressDialogOpen(false);
      setEditingAddress(null);

      toast({
        title: "Success",
        description: `Address ${
          editingAddress ? "updated" : "added"
        } successfully.`,
      });
    } catch (error) {
      console.error("Failed to save address:", error);
      toast({
        title: "Error",
        description: `Failed to ${
          editingAddress ? "update" : "add"
        } address. Please try again.`,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAddress = async (addressId: string) => {
    try {
      await userService.deleteUserAddress(addressId);
      setAddresses((prev) => prev.filter((addr) => addr._id !== addressId));

      toast({
        title: "Success",
        description: "Address deleted successfully.",
      });
    } catch (error) {
      console.error("Failed to delete address:", error);
      toast({
        title: "Error",
        description: "Failed to delete address. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleSetDefaultAddress = async (addressId: string) => {
    try {
      const updatedAddress = await userService.setDefaultAddress(addressId);
      setAddresses((prev) =>
        prev.map((addr) => ({
          ...addr,
          is_default: addr._id === addressId,
        }))
      );

      toast({
        title: "Success",
        description: "Default address updated successfully.",
      });
    } catch (error) {
      console.error("Failed to set default address:", error);
      toast({
        title: "Error",
        description: "Failed to set default address. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleUpdatePreferences = async (updates: Partial<UserPreferences>) => {
    try {
      const updatedPreferences = await userService.updateUserPreferences(
        updates
      );
      setPreferences(updatedPreferences);

      toast({
        title: "Success",
        description: "Preferences updated successfully.",
      });
    } catch (error) {
      console.error("Failed to update preferences:", error);
      toast({
        title: "Error",
        description: "Failed to update preferences. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDownloadData = async () => {
    try {
      setDownloadingData(true);
      const dataBlob = await userService.downloadUserData();

      // Create download link
      const url = window.URL.createObjectURL(dataBlob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `user-data-${
        new Date().toISOString().split("T")[0]
      }.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast({
        title: "Success",
        description: "Your data has been downloaded successfully.",
      });
    } catch (error) {
      console.error("Failed to download data:", error);
      toast({
        title: "Error",
        description: "Failed to download data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setDownloadingData(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col noise-texture">
        <Navbar />
        <main className="flex-1 pt-24 pb-16 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col noise-texture">
      <Navbar />
      <main className="flex-1 pt-24 pb-16">
        <div className="container px-4 max-w-6xl mx-auto">
          <div className="flex items-center gap-3 mb-8">
            <User className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold">My Account</h1>
          </div>

          <Tabs defaultValue="profile" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="profile">Profile</TabsTrigger>
              <TabsTrigger value="addresses">Addresses</TabsTrigger>
              <TabsTrigger value="preferences">Preferences</TabsTrigger>
              <TabsTrigger value="account">Account</TabsTrigger>
            </TabsList>

            <TabsContent value="profile" className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Profile Information</CardTitle>
                    <CardDescription>
                      Update your personal information and settings
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Form {...form}>
                      <form
                        onSubmit={form.handleSubmit(onSubmit)}
                        className="space-y-4"
                      >
                        <FormField
                          control={form.control}
                          name="full_name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Full Name</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="Enter your full name"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="phone"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Phone Number</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="Enter your phone number"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <Button
                          type="submit"
                          disabled={saving}
                          className="w-full gap-2"
                        >
                          {saving ? (
                            <>
                              <Loader2 className="h-4 w-4 animate-spin" />
                              Saving...
                            </>
                          ) : (
                            <>
                              <Save className="h-4 w-4" />
                              Save Changes
                            </>
                          )}
                        </Button>
                      </form>
                    </Form>
                  </CardContent>
                </Card>

                <div className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Account Details</CardTitle>
                      <CardDescription>
                        Your account information
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center gap-3 p-3 rounded-lg bg-muted">
                        <Mail className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium">Email Address</p>
                          <p className="text-sm text-muted-foreground">
                            {user?.email}
                          </p>
                        </div>
                      </div>

                      {isAdmin && (
                        <div className="flex items-center gap-3 p-3 rounded-lg bg-primary/10">
                          <Shield className="h-5 w-5 text-primary" />
                          <div>
                            <p className="text-sm font-medium">Account Type</p>
                            <p className="text-sm text-primary">
                              Administrator
                            </p>
                          </div>
                        </div>
                      )}

                      {profile && (
                        <div className="pt-4 border-t">
                          <p className="text-sm text-muted-foreground">
                            Account created:{" "}
                            {new Date(profile.created_at).toLocaleDateString()}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Last updated:{" "}
                            {new Date(profile.updated_at).toLocaleDateString()}
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Quick Links</CardTitle>
                      <CardDescription>
                        Access your account features
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <Button
                        variant="outline"
                        className="w-full justify-start"
                        asChild
                      >
                        <a href="/my-orders">
                          <Package className="h-4 w-4 mr-2" />
                          My Orders
                        </a>
                      </Button>
                      <Button
                        variant="outline"
                        className="w-full justify-start"
                        asChild
                      >
                        <a href="/affiliate">
                          <TrendingUp className="h-4 w-4 mr-2" />
                          Affiliate Dashboard
                        </a>
                      </Button>
                      {isAdmin && (
                        <Button
                          variant="outline"
                          className="w-full justify-start"
                          asChild
                        >
                          <a href="/admin">
                            <Shield className="h-4 w-4 mr-2" />
                            Admin Dashboard
                          </a>
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="addresses" className="space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-semibold">Saved Addresses</h3>
                  <p className="text-sm text-muted-foreground">
                    Manage your delivery addresses
                  </p>
                </div>
                <Button onClick={handleAddAddress} className="gap-2">
                  <Plus className="h-4 w-4" />
                  Add Address
                </Button>
              </div>

              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {addresses && addresses.length > 0 ? (
                  addresses.map((address) => (
                    <Card
                      key={address._id}
                      className={
                        address.is_default ? "ring-2 ring-primary" : ""
                      }
                    >
                      <CardHeader className="pb-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle className="text-base">
                              {address.full_name}
                            </CardTitle>
                            <CardDescription>{address.phone}</CardDescription>
                          </div>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditAddress(address)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteAddress(address._id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        <p className="text-sm">{address.address_line_1}</p>
                        {address.address_line_2 && (
                          <p className="text-sm">{address.address_line_2}</p>
                        )}
                        <p className="text-sm">
                          {address.city}, {address.state} {address.postal_code}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {address.country}
                        </p>

                        {address.is_default ? (
                          <div className="flex items-center gap-2 text-primary text-sm font-medium">
                            <MapPin className="h-4 w-4" />
                            Default Address
                          </div>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleSetDefaultAddress(address._id)}
                            className="w-full"
                          >
                            Set as Default
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <div className="col-span-full text-center py-8 text-muted-foreground">
                    No addresses found. Add your first address to get started.
                  </div>
                )}
              </div>

              {addresses && addresses.length === 0 && (
                <Card>
                  <CardContent className="py-12 text-center">
                    <MapPin className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">
                      No addresses saved
                    </h3>
                    <p className="text-muted-foreground mb-4">
                      Add your first address to make checkout faster
                    </p>
                    <Button onClick={handleAddAddress} className="gap-2">
                      <Plus className="h-4 w-4" />
                      Add Address
                    </Button>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="preferences" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Notification Preferences</CardTitle>
                  <CardDescription>
                    Manage how you receive notifications from us
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {preferences && (
                    <>
                      <div className="flex items-center justify-between">
                        <div>
                          <Label
                            htmlFor="email-notifications"
                            className="text-base"
                          >
                            Email Notifications
                          </Label>
                          <p className="text-sm text-muted-foreground">
                            Receive order updates and promotional emails
                          </p>
                        </div>
                        <Switch
                          id="email-notifications"
                          checked={preferences.email_notifications}
                          onCheckedChange={(checked) =>
                            handleUpdatePreferences({
                              email_notifications: checked,
                            })
                          }
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <Label
                            htmlFor="sms-notifications"
                            className="text-base"
                          >
                            SMS Notifications
                          </Label>
                          <p className="text-sm text-muted-foreground">
                            Receive order updates via SMS
                          </p>
                        </div>
                        <Switch
                          id="sms-notifications"
                          checked={preferences.sms_notifications}
                          onCheckedChange={(checked) =>
                            handleUpdatePreferences({
                              sms_notifications: checked,
                            })
                          }
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <Label htmlFor="newsletter" className="text-base">
                            Newsletter Subscription
                          </Label>
                          <p className="text-sm text-muted-foreground">
                            Receive our monthly newsletter with updates and
                            offers
                          </p>
                        </div>
                        <Switch
                          id="newsletter"
                          checked={preferences.newsletter_subscription}
                          onCheckedChange={(checked) =>
                            handleUpdatePreferences({
                              newsletter_subscription: checked,
                            })
                          }
                        />
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="account" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Account Management</CardTitle>
                  <CardDescription>
                    Manage your account data and settings
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">Download Your Data</h4>
                        <p className="text-sm text-muted-foreground">
                          Download a copy of all your account data
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        onClick={handleDownloadData}
                        disabled={downloadingData}
                        className="gap-2"
                      >
                        {downloadingData ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Download className="h-4 w-4" />
                        )}
                        Download Data
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Address Dialog */}
          <Dialog open={addressDialogOpen} onOpenChange={setAddressDialogOpen}>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>
                  {editingAddress ? "Edit Address" : "Add New Address"}
                </DialogTitle>
                <DialogDescription>
                  {editingAddress
                    ? "Update your address information"
                    : "Add a new delivery address to your account"}
                </DialogDescription>
              </DialogHeader>
              <Form {...addressForm}>
                <form
                  onSubmit={addressForm.handleSubmit(onAddressSubmit)}
                  className="space-y-4"
                >
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={addressForm.control}
                      name="full_name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Full Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter full name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={addressForm.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phone</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Enter phone number"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={addressForm.control}
                    name="address_line_1"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Address Line 1</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter address" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={addressForm.control}
                    name="address_line_2"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Address Line 2 (Optional)</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Apartment, suite, etc."
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={addressForm.control}
                      name="city"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>City</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter city" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={addressForm.control}
                      name="state"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>State</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter state" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={addressForm.control}
                      name="postal_code"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Postal Code</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter postal code" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={addressForm.control}
                      name="country"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Country</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter country" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={addressForm.control}
                    name="is_default"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                        <div className="space-y-0.5">
                          <FormLabel>Set as default address</FormLabel>
                          <p className="text-sm text-muted-foreground">
                            Use this address as your default delivery address
                          </p>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <DialogFooter>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setAddressDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" disabled={saving}>
                      {saving ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          Saving...
                        </>
                      ) : editingAddress ? (
                        "Update Address"
                      ) : (
                        "Add Address"
                      )}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Profile;
