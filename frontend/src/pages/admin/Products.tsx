import { useState, useEffect } from "react";
import {
  productService,
  productEnumService,
  adminService,
  Product,
  ProductVariant,
  ProductCustomizationOption,
  ProductImage,
  ProductDimensions,
  ProductCustomizationConfig,
  ProductManufacturing,
  ProductEnumValues,
} from "@/services";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus, Edit, Trash } from "lucide-react";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const AdminProducts = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [images, setImages] = useState<ProductImage[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [enumValues, setEnumValues] = useState<ProductEnumValues | null>(null);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    description: "",
    material: "25mm Premium Clear Acrylic",
    is_active: true,
    meta_title: "",
    meta_description: "",
    meta_keywords: [] as string[],
    category: "award",
    sub_category: "",
    tags: [] as string[],
    weight: 0,
    dimensions: {
      length: 0,
      width: 0,
      height: 0,
      unit: "cm",
    },
    features: [] as string[],
    customization: {
      is_customizable: true,
      options: [] as ProductCustomizationOption[],
    },
    manufacturing: {
      production_time: 7,
      complexity_level: "moderate" as "simple" | "moderate" | "complex",
      requires_approval: true,
    },
  });

  const [variantForm, setVariantForm] = useState({
    size: "",
    sku: "",
    price: "",
    compare_at_price: "",
    is_available: true,
  });

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch both products and enum values in parallel
        const [allProducts, enumData] = await Promise.all([
          productService.getAllProducts(),
          productEnumService.getEnumValues(),
        ]);

        setProducts(Array.isArray(allProducts) ? allProducts : []);
        setEnumValues(enumData);
      } catch (err) {
        console.error("Failed to fetch initial data:", err);
        setError("Failed to load data. Please try again.");
        toast({
          title: "Error",
          description: "Failed to load data. Please try again.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchInitialData();
  }, [toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.slug || !formData.description) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    // Check for duplicate SKUs in variants
    const skus = variants.map((v) => v.sku.toUpperCase());
    const uniqueSkus = [...new Set(skus)];
    if (skus.length !== uniqueSkus.length) {
      const duplicates = skus.filter(
        (sku, index) => skus.indexOf(sku) !== index
      );
      toast({
        title: "Error",
        description: `Duplicate SKUs found: ${duplicates.join(
          ", "
        )}. Please ensure all variant SKUs are unique.`,
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);

      const productData = {
        name: formData.name,
        slug: formData.slug,
        description: formData.description,
        material: formData.material,
        is_active: formData.is_active,
        meta_title: formData.meta_title,
        meta_description: formData.meta_description,
        meta_keywords: formData.meta_keywords,
        category: formData.category,
        sub_category: formData.sub_category,
        tags: formData.tags,
        weight: formData.weight,
        dimensions: formData.dimensions,
        features: formData.features,
        customization: formData.customization,
        manufacturing: formData.manufacturing,
        images: images,
        variants: variants.map((v) => ({
          size: v.size,
          sku: v.sku,
          price: v.price,
          compare_at_price: v.compare_at_price,
          is_available: v.is_available,
          stock_quantity: v.stock_quantity,
        })),
      };

      if (editingProduct) {
        // Update existing product
        const updatedProduct = await productService.updateProduct(
          editingProduct.id,
          {
            ...productData,
            is_active: formData.is_active,
          }
        );
        setProducts((prev) =>
          prev.map((p) => (p.id === editingProduct.id ? updatedProduct : p))
        );
        toast({
          title: "Success",
          description: "Product updated successfully",
        });
      } else {
        // Create new product
        const newProduct = await productService.createProduct(productData);
        setProducts((prev) => [newProduct, ...prev]);
        toast({
          title: "Success",
          description: "Product created successfully",
        });
      }

      setDialogOpen(false);
      resetForm();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to save product";
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (
      !confirm(
        "Are you sure you want to permanently delete this product? This action cannot be undone."
      )
    )
      return;

    try {
      setLoading(true);
      await productService.deleteProduct(id);
      setProducts((prev) => prev.filter((p) => p.id !== id));
      toast({
        title: "Success",
        description: "Product deleted successfully",
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to delete product";
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleActive = async (id: string, isActive: boolean) => {
    try {
      setLoading(true);
      const updatedProduct = await productService.toggleProductStatus(id);
      setProducts((prev) =>
        prev.map((p) => (p.id === id ? updatedProduct : p))
      );
      toast({
        title: "Success",
        description: `Product ${
          !isActive ? "activated" : "deactivated"
        } successfully`,
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to toggle status";
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddVariant = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!variantForm.size || !variantForm.sku || !variantForm.price) {
      toast({
        title: "Error",
        description: "Please fill in all required variant fields",
        variant: "destructive",
      });
      return;
    }

    // Check if SKU already exists in current variants
    const skuExists = variants.some(
      (v) => v.sku.toUpperCase() === variantForm.sku.toUpperCase()
    );
    if (skuExists) {
      toast({
        title: "Error",
        description: `SKU "${variantForm.sku}" already exists in this product. Please use a different SKU.`,
        variant: "destructive",
      });
      return;
    }

    try {
      const newVariant: ProductVariant = {
        _id: Date.now().toString(), // Temporary ID for new variants
        product_id: editingProduct?.id || "",
        size: variantForm.size,
        sku: variantForm.sku.toUpperCase(),
        price: parseFloat(variantForm.price),
        compare_at_price: variantForm.compare_at_price
          ? parseFloat(variantForm.compare_at_price)
          : undefined,
        is_available: variantForm.is_available,
        stock_quantity: 50, // Default stock quantity
      };

      // Add to local state for form (will be saved when product is saved)
      const updatedVariants = [...variants, newVariant];
      setVariants(updatedVariants);

      resetVariantForm();

      toast({
        title: "Success",
        description: "Variant added successfully",
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to add variant";
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
    }
  };

  const handleDeleteVariant = async (id: string) => {
    if (!confirm("Delete this variant?")) return;

    try {
      // Update local state (will be saved when product is saved)
      const updatedVariants = variants.filter((v) => v._id !== id);
      setVariants(updatedVariants);

      toast({
        title: "Success",
        description: "Variant deleted successfully",
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to delete variant";
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      slug: "",
      description: "",
      material: "25mm Premium Clear Acrylic",
      is_active: true,
      meta_title: "",
      meta_description: "",
      meta_keywords: [],
      category: "award",
      sub_category: "",
      tags: [],
      weight: 0,
      dimensions: {
        length: 0,
        width: 0,
        height: 0,
        unit: "cm",
      },
      features: [],
      customization: {
        is_customizable: true,
        options: [],
      },
      manufacturing: {
        production_time: 7,
        complexity_level: "moderate",
        requires_approval: true,
      },
    });
    setVariants([]);
    setImages([]);
    setEditingProduct(null);
  };

  const resetVariantForm = () => {
    setVariantForm({
      size: "",
      sku: "",
      price: "",
      compare_at_price: "",
      is_available: true,
    });
  };

  const openEditDialog = async (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      slug: product.slug,
      description: product.description || "",
      material: product.material || "25mm Premium Clear Acrylic",
      is_active: product.is_active,
      meta_title: product.meta_title || "",
      meta_description: product.meta_description || "",
      meta_keywords: product.meta_keywords || [],
      category: product.category || "award",
      sub_category: product.sub_category || "",
      tags: product.tags || [],
      weight: product.weight || 0,
      dimensions: product.dimensions || {
        length: 0,
        width: 0,
        height: 0,
        unit: "cm",
      },
      features: product.features || [],
      customization: product.customization || {
        is_customizable: true,
        options: [],
      },
      manufacturing: product.manufacturing || {
        production_time: 7,
        complexity_level: "moderate" as "simple" | "moderate" | "complex",
        requires_approval: true,
      },
    });

    // Load product variants
    try {
      const productDetails = await productService.getProductBySlug(
        product.slug
      );
      setVariants(productDetails.product_variants || []);
    } catch (error) {
      console.error("Failed to load product variants:", error);
      setVariants([]);
    }

    setDialogOpen(true);
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
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Products Management</h1>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="h-4 w-4 mr-2" />
              Add Product
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingProduct ? "Edit Product" : "Create New Product"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <Tabs defaultValue="basic" className="w-full">
                <TabsList className="grid w-full grid-cols-5">
                  <TabsTrigger value="basic">Basic Info</TabsTrigger>
                  <TabsTrigger value="details">Details</TabsTrigger>
                  <TabsTrigger value="variants">Variants</TabsTrigger>
                  <TabsTrigger value="images">Images</TabsTrigger>
                  <TabsTrigger value="seo">SEO & Meta</TabsTrigger>
                </TabsList>

                <TabsContent value="basic" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="name">Product Name *</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) =>
                          setFormData({ ...formData, name: e.target.value })
                        }
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="slug">Slug *</Label>
                      <Input
                        id="slug"
                        value={formData.slug}
                        onChange={(e) =>
                          setFormData({ ...formData, slug: e.target.value })
                        }
                        placeholder="product-slug"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="description">Description *</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          description: e.target.value,
                        })
                      }
                      rows={4}
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="category">Category *</Label>
                      <select
                        id="category"
                        value={formData.category}
                        onChange={(e) =>
                          setFormData({ ...formData, category: e.target.value })
                        }
                        className="w-full px-3 py-2 border border-input bg-background rounded-md"
                        required
                      >
                        <option value="award">Award</option>
                        <option value="trophy">Trophy</option>
                        <option value="plaque">Plaque</option>
                        <option value="certificate">Certificate</option>
                        <option value="medal">Medal</option>
                        <option value="custom">Custom</option>
                      </select>
                    </div>
                    <div>
                      <Label htmlFor="sub_category">Sub Category</Label>
                      <select
                        id="sub_category"
                        value={formData.sub_category}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            sub_category: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 border border-input bg-background rounded-md"
                      >
                        <option value="">Select Sub Category</option>
                        {enumValues?.subCategories.map((subCategory) => (
                          <option key={subCategory} value={subCategory}>
                            {subCategory
                              .replace(/_/g, " ")
                              .replace(/\b\w/g, (l) => l.toUpperCase())}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="material">Material</Label>
                    <select
                      id="material"
                      value={formData.material}
                      onChange={(e) =>
                        setFormData({ ...formData, material: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-input bg-background rounded-md"
                      required
                    >
                      {enumValues?.materials.map((material) => (
                        <option key={material} value={material}>
                          {material}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="is_active"
                      checked={formData.is_active}
                      onCheckedChange={(checked) =>
                        setFormData({ ...formData, is_active: checked })
                      }
                    />
                    <Label htmlFor="is_active">Product Active</Label>
                  </div>
                </TabsContent>

                <TabsContent value="details" className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="weight">Weight (grams)</Label>
                      <Input
                        id="weight"
                        type="number"
                        value={formData.weight}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            weight: Number(e.target.value),
                          })
                        }
                      />
                    </div>
                    <div>
                      <Label htmlFor="length">
                        Length ({formData.dimensions.unit})
                      </Label>
                      <Input
                        id="length"
                        type="number"
                        value={formData.dimensions.length}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            dimensions: {
                              ...formData.dimensions,
                              length: Number(e.target.value),
                            },
                          })
                        }
                      />
                    </div>
                    <div>
                      <Label htmlFor="width">
                        Width ({formData.dimensions.unit})
                      </Label>
                      <Input
                        id="width"
                        type="number"
                        value={formData.dimensions.width}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            dimensions: {
                              ...formData.dimensions,
                              width: Number(e.target.value),
                            },
                          })
                        }
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="height">
                        Height ({formData.dimensions.unit})
                      </Label>
                      <Input
                        id="height"
                        type="number"
                        value={formData.dimensions.height}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            dimensions: {
                              ...formData.dimensions,
                              height: Number(e.target.value),
                            },
                          })
                        }
                      />
                    </div>
                    <div>
                      <Label htmlFor="unit">Dimension Unit</Label>
                      <select
                        id="unit"
                        value={formData.dimensions.unit}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            dimensions: {
                              ...formData.dimensions,
                              unit: e.target.value,
                            },
                          })
                        }
                        className="w-full px-3 py-2 border border-input bg-background rounded-md"
                      >
                        <option value="mm">mm</option>
                        <option value="cm">cm</option>
                        <option value="inch">inch</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="features">Features (one per line)</Label>
                    <Textarea
                      id="features"
                      value={formData.features.join("\n")}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          features: e.target.value
                            .split("\n")
                            .filter((f) => f.trim()),
                        })
                      }
                      rows={5}
                      placeholder="Enter each feature on a new line"
                    />
                  </div>

                  <div>
                    <Label htmlFor="tags">Tags (comma separated)</Label>
                    <Input
                      id="tags"
                      value={formData.tags.join(", ")}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          tags: e.target.value
                            .split(",")
                            .map((t) => t.trim())
                            .filter((t) => t),
                        })
                      }
                      placeholder="tag1, tag2, tag3"
                    />
                  </div>

                  <div className="space-y-4">
                    <h4 className="font-semibold">Manufacturing Details</h4>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor="production_time">
                          Production Time (days)
                        </Label>
                        <Input
                          id="production_time"
                          type="number"
                          value={formData.manufacturing.production_time}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              manufacturing: {
                                ...formData.manufacturing,
                                production_time: Number(e.target.value),
                              },
                            })
                          }
                        />
                      </div>
                      <div>
                        <Label htmlFor="complexity_level">
                          Complexity Level
                        </Label>
                        <select
                          id="complexity_level"
                          value={formData.manufacturing.complexity_level}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              manufacturing: {
                                ...formData.manufacturing,
                                complexity_level: e.target.value as
                                  | "simple"
                                  | "moderate"
                                  | "complex",
                              },
                            })
                          }
                          className="w-full px-3 py-2 border border-input bg-background rounded-md"
                        >
                          <option value="simple">Simple</option>
                          <option value="moderate">Moderate</option>
                          <option value="complex">Complex</option>
                        </select>
                      </div>
                      <div className="flex items-center space-x-2 pt-7">
                        <Switch
                          id="requires_approval"
                          checked={formData.manufacturing.requires_approval}
                          onCheckedChange={(checked) =>
                            setFormData({
                              ...formData,
                              manufacturing: {
                                ...formData.manufacturing,
                                requires_approval: checked,
                              },
                            })
                          }
                        />
                        <Label htmlFor="requires_approval">
                          Requires Approval
                        </Label>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="variants" className="space-y-4">
                  <div className="space-y-4">
                    <Card className="p-4">
                      <h4 className="font-semibold mb-4">Add Variant</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Size</Label>
                          <select
                            value={variantForm.size}
                            onChange={(e) =>
                              setVariantForm({
                                ...variantForm,
                                size: e.target.value,
                              })
                            }
                            className="w-full px-3 py-2 border border-input bg-background rounded-md"
                          >
                            <option value="">Select Size</option>
                            {enumValues?.sizes.map((size) => (
                              <option key={size} value={size}>
                                {size}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <Label>SKU Prefix</Label>
                          <select
                            value={variantForm.sku.split("-")[0] || ""}
                            onChange={(e) => {
                              const prefix = e.target.value;
                              const size = variantForm.size
                                .replace(" cm", "")
                                .replace("x", "X");

                              // Generate unique suffix to avoid duplicates
                              const timestamp = Date.now().toString().slice(-4);
                              const randomSuffix = Math.random()
                                .toString(36)
                                .substring(2, 5)
                                .toUpperCase();

                              const sku =
                                prefix && size
                                  ? `${prefix}-${size}-${randomSuffix}${timestamp}`
                                  : "";
                              setVariantForm({
                                ...variantForm,
                                sku: sku,
                              });
                            }}
                            className="w-full px-3 py-2 border border-input bg-background rounded-md"
                          >
                            <option value="">Select SKU Prefix</option>
                            {enumValues?.skuPrefixes.map((prefix) => (
                              <option key={prefix} value={prefix}>
                                {prefix}
                              </option>
                            ))}
                          </select>
                          {variantForm.sku && (
                            <p className="text-sm text-muted-foreground mt-1">
                              Generated SKU: {variantForm.sku}
                            </p>
                          )}
                        </div>
                        <div>
                          <Label>Price (₹)</Label>
                          <Input
                            type="number"
                            step="0.01"
                            value={variantForm.price}
                            onChange={(e) =>
                              setVariantForm({
                                ...variantForm,
                                price: e.target.value,
                              })
                            }
                          />
                        </div>
                        <div>
                          <Label>Compare Price (₹)</Label>
                          <Input
                            type="number"
                            step="0.01"
                            value={variantForm.compare_at_price}
                            onChange={(e) =>
                              setVariantForm({
                                ...variantForm,
                                compare_at_price: e.target.value,
                              })
                            }
                            placeholder="Optional"
                          />
                        </div>
                        <div className="col-span-2 flex items-center space-x-2">
                          <Switch
                            checked={variantForm.is_available}
                            onCheckedChange={(checked) =>
                              setVariantForm({
                                ...variantForm,
                                is_available: checked,
                              })
                            }
                          />
                          <Label>Available</Label>
                        </div>
                        <div className="col-span-2">
                          <Button
                            type="button"
                            onClick={handleAddVariant}
                            className="w-full"
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            Add Variant
                          </Button>
                        </div>
                      </div>
                    </Card>

                    {variants.length > 0 && (
                      <Card className="p-4">
                        <h4 className="font-semibold mb-4">Current Variants</h4>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Size</TableHead>
                              <TableHead>SKU</TableHead>
                              <TableHead>Price</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead>Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {variants.map((variant) => (
                              <TableRow key={variant._id}>
                                <TableCell>{variant.size}</TableCell>
                                <TableCell>{variant.sku}</TableCell>
                                <TableCell>
                                  ₹{variant.price}
                                  {variant.compare_at_price && (
                                    <span className="text-muted-foreground line-through ml-2">
                                      ₹{variant.compare_at_price}
                                    </span>
                                  )}
                                </TableCell>
                                <TableCell>
                                  <Badge
                                    variant={
                                      variant.is_available
                                        ? "default"
                                        : "secondary"
                                    }
                                  >
                                    {variant.is_available
                                      ? "Available"
                                      : "Unavailable"}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={() =>
                                      handleDeleteVariant(variant._id)
                                    }
                                  >
                                    <Trash className="h-4 w-4" />
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </Card>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="images" className="space-y-4">
                  <div className="space-y-4">
                    <Card className="p-4">
                      <h4 className="font-semibold mb-4">Add Image</h4>
                      <div className="space-y-4">
                        <div>
                          <Label>Image URL</Label>
                          <Input
                            placeholder="https://example.com/image.jpg"
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                const url = e.currentTarget.value.trim();
                                if (url) {
                                  const newImage: ProductImage = {
                                    url,
                                    alt_text: "",
                                    is_primary: images.length === 0,
                                    sort_order: images.length + 1,
                                  };
                                  setImages([...images, newImage]);
                                  e.currentTarget.value = "";
                                }
                              }
                            }}
                          />
                          <p className="text-sm text-muted-foreground mt-1">
                            Press Enter to add image
                          </p>
                        </div>
                        <Button
                          type="button"
                          onClick={() => {
                            const url = (
                              document.querySelector(
                                'input[placeholder*="example.com"]'
                              ) as HTMLInputElement
                            )?.value?.trim();
                            if (url) {
                              const newImage: ProductImage = {
                                url,
                                alt_text: "",
                                is_primary: images.length === 0,
                                sort_order: images.length + 1,
                              };
                              setImages([...images, newImage]);
                              (
                                document.querySelector(
                                  'input[placeholder*="example.com"]'
                                ) as HTMLInputElement
                              ).value = "";
                            }
                          }}
                          className="w-full"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Add Image
                        </Button>
                      </div>
                    </Card>

                    {images.length > 0 && (
                      <Card className="p-4">
                        <h4 className="font-semibold mb-4">
                          Product Images ({images.length})
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {images.map((image, index) => (
                            <div
                              key={index}
                              className="space-y-2 p-3 border rounded"
                            >
                              <div className="aspect-video bg-gray-100 rounded flex items-center justify-center overflow-hidden">
                                {image.url ? (
                                  <img
                                    src={image.url}
                                    alt={image.alt_text || "Product image"}
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                      e.currentTarget.style.display = "none";
                                      const nextEl = e.currentTarget
                                        .nextElementSibling as HTMLElement;
                                      if (nextEl) nextEl.style.display = "flex";
                                    }}
                                  />
                                ) : null}
                                <span className="text-sm text-gray-500">
                                  {image.url ? "Loading..." : "No Image"}
                                </span>
                              </div>
                              <div className="space-y-2">
                                <Input
                                  value={image.url}
                                  onChange={(e) => {
                                    const newImages = [...images];
                                    newImages[index] = {
                                      ...image,
                                      url: e.target.value,
                                    };
                                    setImages(newImages);
                                  }}
                                  placeholder="Image URL"
                                />
                                <Input
                                  value={image.alt_text}
                                  onChange={(e) => {
                                    const newImages = [...images];
                                    newImages[index] = {
                                      ...image,
                                      alt_text: e.target.value,
                                    };
                                    setImages(newImages);
                                  }}
                                  placeholder="Alt text (for accessibility)"
                                />
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center space-x-2">
                                    <Switch
                                      checked={image.is_primary}
                                      onCheckedChange={(checked) => {
                                        const newImages = [...images];
                                        if (checked) {
                                          // Unset other primary images
                                          newImages.forEach(
                                            (img) => (img.is_primary = false)
                                          );
                                        }
                                        newImages[index] = {
                                          ...image,
                                          is_primary: checked,
                                        };
                                        setImages(newImages);
                                      }}
                                    />
                                    <Label>Primary Image</Label>
                                  </div>
                                  <Button
                                    type="button"
                                    variant="destructive"
                                    size="sm"
                                    onClick={() => {
                                      const newImages = images.filter(
                                        (_, i) => i !== index
                                      );
                                      setImages(newImages);
                                    }}
                                  >
                                    <Trash className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </Card>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="seo" className="space-y-4">
                  <div>
                    <Label htmlFor="meta_title">Meta Title</Label>
                    <Input
                      id="meta_title"
                      value={formData.meta_title}
                      onChange={(e) =>
                        setFormData({ ...formData, meta_title: e.target.value })
                      }
                      placeholder="SEO friendly title"
                    />
                  </div>
                  <div>
                    <Label htmlFor="meta_description">Meta Description</Label>
                    <Textarea
                      id="meta_description"
                      value={formData.meta_description}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          meta_description: e.target.value,
                        })
                      }
                      placeholder="SEO meta description"
                      rows={3}
                    />
                  </div>
                  <div>
                    <Label htmlFor="meta_keywords">Meta Keywords</Label>
                    <div className="space-y-2">
                      <select
                        onChange={(e) => {
                          const selectedKeyword = e.target.value;
                          if (
                            selectedKeyword &&
                            !formData.meta_keywords.includes(selectedKeyword)
                          ) {
                            setFormData({
                              ...formData,
                              meta_keywords: [
                                ...formData.meta_keywords,
                                selectedKeyword,
                              ],
                            });
                          }
                          e.target.value = ""; // Reset selection
                        }}
                        className="w-full px-3 py-2 border border-input bg-background rounded-md"
                      >
                        <option value="">Add from common keywords...</option>
                        {enumValues?.commonMetaKeywords
                          .filter(
                            (keyword) =>
                              !formData.meta_keywords.includes(keyword)
                          )
                          .map((keyword) => (
                            <option key={keyword} value={keyword}>
                              {keyword}
                            </option>
                          ))}
                      </select>

                      <Input
                        placeholder="Or type custom keywords (comma separated)"
                        onKeyPress={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            const input = e.target as HTMLInputElement;
                            const newKeywords = input.value
                              .split(",")
                              .map((k) => k.trim())
                              .filter(
                                (k) => k && !formData.meta_keywords.includes(k)
                              );

                            if (newKeywords.length > 0) {
                              setFormData({
                                ...formData,
                                meta_keywords: [
                                  ...formData.meta_keywords,
                                  ...newKeywords,
                                ],
                              });
                              input.value = "";
                            }
                          }
                        }}
                      />

                      {formData.meta_keywords.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {formData.meta_keywords.map((keyword, index) => (
                            <Badge
                              key={index}
                              variant="secondary"
                              className="flex items-center gap-1"
                            >
                              {keyword}
                              <button
                                type="button"
                                onClick={() => {
                                  setFormData({
                                    ...formData,
                                    meta_keywords:
                                      formData.meta_keywords.filter(
                                        (_, i) => i !== index
                                      ),
                                  });
                                }}
                                className="ml-1 text-xs hover:text-destructive"
                              >
                                ×
                              </button>
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </TabsContent>
              </Tabs>

              <div className="flex justify-end space-x-2 pt-4 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit">
                  {editingProduct ? "Update Product" : "Create Product"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {products.map((product) => (
          <Card key={product.id} className="p-6">
            <div className="flex justify-between items-start mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-xl font-bold">{product.name}</h3>
                  {product.is_active ? (
                    <Badge variant="default">Active</Badge>
                  ) : (
                    <Badge variant="secondary">Inactive</Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">/{product.slug}</p>
                {product.description && (
                  <p className="text-sm text-muted-foreground mt-2">
                    {product.description.substring(0, 100)}...
                  </p>
                )}
                <div className="flex items-center gap-4 text-xs text-muted-foreground mt-2">
                  <span>Variants: {product.product_variants?.length || 0}</span>
                  <span>Images: {product.images?.length || 0}</span>
                  {product.material && (
                    <span>Material: {product.material}</span>
                  )}
                </div>
              </div>
              <div className="flex gap-2">
                <Switch
                  checked={product.is_active}
                  onCheckedChange={() =>
                    toggleActive(product.id, product.is_active)
                  }
                />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => openEditDialog(product)}
                >
                  <Edit className="h-4 w-4" />
                  Edit
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => handleDeleteProduct(product.id)}
                >
                  <Trash className="h-4 w-4" />
                  Delete
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default AdminProducts;
