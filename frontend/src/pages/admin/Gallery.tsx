import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import {
  Trash2,
  Plus,
  Image as ImageIcon,
  Upload,
  Camera,
  Link,
} from "lucide-react";
import { uploadService, type GalleryUpload } from "@/services/UploadService";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";

// Get the backend base URL for serving static files
const BACKEND_BASE_URL =
  import.meta.env.VITE_API_URL?.replace("/api", "") || "http://localhost:5000";

interface GalleryImage {
  id: string;
  title: string;
  description?: string;
  imageUrl: string;
  customerName: string;
  customerRole: string;
  isLocalUpload: boolean;
  createdAt: string;
}

const AdminGallery = () => {
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [newImageUrl, setNewImageUrl] = useState("");
  const [newImageTitle, setNewImageTitle] = useState("");
  const [newImageDescription, setNewImageDescription] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerRole, setCustomerRole] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    const loadImagesData = async () => {
      try {
        setLoading(true);
        const galleryImages = await uploadService.getAdminGalleryImages();
        setImages(galleryImages);
      } catch (error) {
        console.error("Error loading gallery images:", error);
        toast({
          title: "Error",
          description: "Failed to load gallery images",
          variant: "destructive",
        });
        // Fallback to default images
        const defaultImages: GalleryImage[] = [
          {
            id: "1",
            title: "Trader Setup 1",
            imageUrl: "/src/assets/gallery-1.jpg",
            customerName: "Rahul K.",
            customerRole: "Funded Trader",
            isLocalUpload: false,
            createdAt: new Date().toISOString(),
          },
          {
            id: "2",
            title: "Trader Setup 2",
            imageUrl: "/src/assets/gallery-2.jpg",
            customerName: "Priya S.",
            customerRole: "Prop Challenge Winner",
            isLocalUpload: false,
            createdAt: new Date().toISOString(),
          },
          {
            id: "3",
            title: "Trader Setup 3",
            imageUrl: "/src/assets/gallery-3.jpg",
            customerName: "Amit P.",
            customerRole: "Senior Trader",
            isLocalUpload: false,
            createdAt: new Date().toISOString(),
          },
        ];
        setImages(defaultImages);
      } finally {
        setLoading(false);
      }
    };

    loadImagesData();
  }, [toast]);

  const loadImages = async () => {
    try {
      setLoading(true);
      const galleryImages = await uploadService.getAdminGalleryImages();
      setImages(galleryImages);
    } catch (error) {
      console.error("Error loading gallery images:", error);
      toast({
        title: "Error",
        description: "Failed to load gallery images",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file
      const validation = uploadService.validateGalleryImage(file);
      if (!validation.valid) {
        toast({
          title: "Invalid file",
          description: validation.errors.join(", "),
          variant: "destructive",
        });
        return;
      }

      setSelectedFile(file);

      // Create preview URL
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviewUrl(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadFileImage = async () => {
    if (!selectedFile) {
      toast({
        title: "No file selected",
        description: "Please select an image file to upload",
        variant: "destructive",
      });
      return;
    }

    if (!newImageTitle.trim()) {
      toast({
        title: "Title required",
        description: "Please enter a title for the image",
        variant: "destructive",
      });
      return;
    }

    try {
      setUploading(true);

      // Prepare parameters, only include non-empty strings
      const description = newImageDescription.trim();
      const custName = customerName.trim();
      const custRole = customerRole.trim();

      const uploadedImage = await uploadService.uploadGalleryImage(
        selectedFile,
        newImageTitle.trim(),
        description || undefined,
        custName || undefined,
        custRole || undefined
      );

      await loadImages(); // Reload images from server

      // Reset form
      setSelectedFile(null);
      setPreviewUrl("");
      setNewImageTitle("");
      setNewImageDescription("");
      setCustomerName("");
      setCustomerRole("");
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      toast({
        title: "Success",
        description: "Gallery image uploaded successfully",
      });
    } catch (error) {
      console.error("Error uploading image:", error);
      toast({
        title: "Upload failed",
        description: "Failed to upload gallery image",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const addImageFromUrl = async () => {
    if (!newImageUrl.trim()) {
      toast({
        title: "URL required",
        description: "Please enter an image URL",
        variant: "destructive",
      });
      return;
    }

    if (!newImageTitle.trim()) {
      toast({
        title: "Title required",
        description: "Please enter a title for the image",
        variant: "destructive",
      });
      return;
    }

    try {
      setUploading(true);

      // Prepare parameters, only include non-empty strings
      const description = newImageDescription.trim();
      const custName = customerName.trim();
      const custRole = customerRole.trim();

      await uploadService.addGalleryImageFromUrl(
        newImageUrl.trim(),
        newImageTitle.trim(),
        description || undefined,
        custName || undefined,
        custRole || undefined
      );

      await loadImages(); // Reload images from server

      // Reset form
      setNewImageUrl("");
      setNewImageTitle("");
      setNewImageDescription("");
      setCustomerName("");
      setCustomerRole("");

      toast({
        title: "Success",
        description: "Gallery image added successfully",
      });
    } catch (error) {
      console.error("Error adding image:", error);
      toast({
        title: "Add failed",
        description: "Failed to add gallery image",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const deleteImage = async (id: string) => {
    try {
      await uploadService.deleteGalleryImage(id);
      await loadImages(); // Reload images from server

      toast({
        title: "Success",
        description: "Gallery image deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting image:", error);
      toast({
        title: "Delete failed",
        description: "Failed to delete gallery image",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Gallery Images</h1>
          <p className="text-muted-foreground">Loading gallery images...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Gallery Images</h1>
        <p className="text-muted-foreground">
          Manage trader setup images shown on the homepage
        </p>
      </div>

      {/* Add New Image */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Add New Image
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="upload" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="upload" className="flex items-center gap-2">
                <Upload className="h-4 w-4" />
                Upload File
              </TabsTrigger>
              <TabsTrigger value="url" className="flex items-center gap-2">
                <Link className="h-4 w-4" />
                From URL
              </TabsTrigger>
            </TabsList>

            <TabsContent value="upload" className="space-y-4">
              <div className="space-y-4">
                {/* File Upload Section */}
                <div className="space-y-2">
                  <Label htmlFor="file-upload">Select Image File *</Label>
                  <div className="flex items-center gap-4">
                    <Input
                      ref={fileInputRef}
                      id="file-upload"
                      type="file"
                      accept="image/*"
                      onChange={handleFileSelect}
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                      className="flex items-center gap-2"
                    >
                      <Camera className="h-4 w-4" />
                      Browse
                    </Button>
                  </div>
                  {selectedFile && (
                    <p className="text-sm text-muted-foreground">
                      Selected: {selectedFile.name} (
                      {uploadService.formatFileSize(selectedFile.size)})
                    </p>
                  )}
                </div>

                {/* Preview */}
                {previewUrl && (
                  <div className="space-y-2">
                    <Label>Preview</Label>
                    <div className="w-32 h-32 border rounded-lg overflow-hidden">
                      <img
                        src={previewUrl}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>
                )}

                {/* Common Fields */}
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Title *</Label>
                    <Input
                      id="title"
                      placeholder="Trading Setup Description"
                      value={newImageTitle}
                      onChange={(e) => setNewImageTitle(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="customer-name">Customer Name</Label>
                    <Input
                      id="customer-name"
                      placeholder="Valued Customer"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="customer-role">Customer Role</Label>
                    <Input
                      id="customer-role"
                      placeholder="Funded Trader"
                      value={customerRole}
                      onChange={(e) => setCustomerRole(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Optional description of the trading setup"
                    value={newImageDescription}
                    onChange={(e) => setNewImageDescription(e.target.value)}
                    rows={3}
                  />
                </div>

                <Button
                  onClick={uploadFileImage}
                  disabled={!selectedFile || !newImageTitle.trim() || uploading}
                  className="w-full"
                >
                  {uploading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      Upload Image
                    </>
                  )}
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="url" className="space-y-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="imageUrl">Image URL *</Label>
                  <Input
                    id="imageUrl"
                    placeholder="https://example.com/image.jpg"
                    value={newImageUrl}
                    onChange={(e) => setNewImageUrl(e.target.value)}
                  />
                </div>

                {/* Common Fields */}
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="title-url">Title *</Label>
                    <Input
                      id="title-url"
                      placeholder="Trading Setup Description"
                      value={newImageTitle}
                      onChange={(e) => setNewImageTitle(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="customer-name-url">Customer Name</Label>
                    <Input
                      id="customer-name-url"
                      placeholder="Valued Customer"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="customer-role-url">Customer Role</Label>
                    <Input
                      id="customer-role-url"
                      placeholder="Funded Trader"
                      value={customerRole}
                      onChange={(e) => setCustomerRole(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description-url">Description</Label>
                  <Textarea
                    id="description-url"
                    placeholder="Optional description of the trading setup"
                    value={newImageDescription}
                    onChange={(e) => setNewImageDescription(e.target.value)}
                    rows={3}
                  />
                </div>

                <Button
                  onClick={addImageFromUrl}
                  disabled={
                    !newImageUrl.trim() || !newImageTitle.trim() || uploading
                  }
                  className="w-full"
                >
                  {uploading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Adding...
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Image
                    </>
                  )}
                </Button>
              </div>
            </TabsContent>
          </Tabs>
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
            {images.map((image) => {
              // Build the proper image URL
              const getImageUrl = (
                imageUrl: string,
                isLocalUpload: boolean
              ) => {
                if (!isLocalUpload) {
                  // External URL, use as-is
                  return imageUrl;
                }
                // Local upload, combine with backend base URL
                return `${BACKEND_BASE_URL}${imageUrl}`;
              };

              return (
                <div key={image.id} className="space-y-3">
                  <div className="aspect-square bg-muted rounded-lg overflow-hidden relative">
                    <img
                      src={getImageUrl(image.imageUrl, image.isLocalUpload)}
                      alt={image.title}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        console.warn(
                          "Failed to load admin gallery image:",
                          getImageUrl(image.imageUrl, image.isLocalUpload)
                        );
                        e.currentTarget.src =
                          "https://placehold.co/400x400?text=Image+Not+Found";
                      }}
                    />
                    {image.isLocalUpload && (
                      <div className="absolute top-2 right-2 bg-green-100 text-green-800 text-xs px-2 py-1 rounded">
                        Local
                      </div>
                    )}
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-medium truncate">
                      {image.title}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {image.customerName} • {image.customerRole}
                    </p>
                    {image.description && (
                      <p className="text-xs text-muted-foreground truncate">
                        {image.description}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground truncate">
                      {image.isLocalUpload ? "Uploaded file" : image.imageUrl}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Added: {new Date(image.createdAt).toLocaleDateString()}
                    </p>
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
              );
            })}
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
          <li>
            You can use external URLs or local paths like /src/assets/image.jpg
          </li>
        </ul>
      </div>
    </div>
  );
};

export default AdminGallery;
