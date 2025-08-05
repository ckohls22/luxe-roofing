"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import { useForm, UseFormReturn } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  IconArrowLeft,
  IconDeviceFloppy,
  IconDotsVertical,
  IconEdit,
  IconLoader,
  IconPlus,
  IconTrash,
  IconUpload,
  IconX,
  IconPhoto,
} from "@tabler/icons-react";
import { toast } from "sonner";
import { z } from "zod";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";

// Schemas
const materialSchema = z.object({
  id: z.string(),
  supplierId: z.string(),
  materialImage: z.string(),
  type: z.string(),
  price: z.string(),
  warranty: z.string(),
  topFeatures: z.string(),
  showCase: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

const supplierDetailSchema = z.object({
  id: z.string(),
  logoUrl: z.string(),
  name: z.string(),
  description: z.string(),
  installation: z.string(),
  phone: z.string(),
  email: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
  materials: z.array(materialSchema),
});

const supplierResponseSchema = z.object({
  supplier: supplierDetailSchema,
});

// Form schemas
const supplierFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().min(1, "Description is required"),
  installation: z.string().min(1, "Installation is required"),
  phone: z.string().min(1, "Phone is required"),
  email: z.string().email("Invalid email address"),
  logoUrl: z.string().optional(),
  logoFile: z.instanceof(File).optional(),
});

const materialFormSchema = z.object({
  type: z.string().min(1, "Type is required"),
  warranty: z.string().min(1, "Warranty is required"),
  topFeatures: z
    .string()
    .min(1, "Top features is required")
    .max(150, "Must be 150 characters or less"),
  materialImage: z.string().nullable().optional(),
  showCase: z.string().nullable().optional(),
  price: z.string(),
  materialImageFile: z.instanceof(File).optional(),
  showCaseFile: z.instanceof(File).optional(),
});

type Material = z.infer<typeof materialSchema>;
type SupplierDetail = z.infer<typeof supplierDetailSchema>;
type SupplierFormData = z.infer<typeof supplierFormSchema>;
type MaterialFormData = z.infer<typeof materialFormSchema>;

// Image Upload Component
function ImageUpload({
  isEditing,
  value,
  onChange,
  onFileChange,
  label,
  accept = "image/*",
}: {
  isEditing: boolean;
  value?: string | null;
  onChange?: (value: string) => void;
  onFileChange?: (file: File | null) => void;
  label: string;
  accept?: string;
}) {
  // Handle both string and null values safely
  const [preview, setPreview] = React.useState<string | null>(value || null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setPreview(result);
        // Update both the URL string and the file object
        onChange?.(result);
        onFileChange?.(file);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemove = () => {
    setPreview(null);
    onChange?.(""); // Set to empty string instead of null
    onFileChange?.(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="flex items-center gap-4">
        <div className="relative">
          {preview ? (
            <div className="relative">
              <Avatar className="size-20">
                <AvatarImage src={preview} alt={label} />
                <AvatarFallback>
                  <IconPhoto className="size-8" />
                </AvatarFallback>
              </Avatar>
              <Button
                type="button"
                variant="destructive"
                size="icon"
                className="absolute -top-2 -right-2 size-6"
                onClick={handleRemove}
              >
                <IconX className="size-3" />
              </Button>
            </div>
          ) : (
            <div className="flex items-center justify-center size-20 border-2 border-dashed border-muted-foreground/25 rounded-full">
              <IconPhoto className="size-8 text-muted-foreground/50" />
            </div>
          )}
        </div>
        <div className="space-y-2">
          <Input
            ref={fileInputRef}
            type="file"
            accept={accept}
            onChange={handleFileChange}
            className="hidden"
          />
          <Button
            type="button"
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            disabled={!isEditing}
            className="border-amber-500 text-amber-700 hover:bg-amber-50 hover:text-amber-800"
          >
            <IconUpload className="size-4 mr-2" />
            Upload Image
          </Button>
        </div>
      </div>
    </div>
  );
}

// Rich Text Editor Component for Installation
function InstallationRichTextEditor({
  form,
  isEditing,
}: {
  form: UseFormReturn<SupplierFormData>;
  isEditing: boolean;
}) {
  // Get initial value from form
  const initialValue = form.getValues().installation || "";
  const [editorContent, setEditorContent] = React.useState(initialValue);

  // Update form when editor content changes
  React.useEffect(() => {
    form.setValue("installation", editorContent);
  }, [editorContent, form]);

  // Handle editor changes
  const handleEditorChange = (e: React.FocusEvent<HTMLDivElement>) => {
    setEditorContent(e.currentTarget.innerHTML);
  };

  // Handle formatting actions
  const handleFormatClick = (command: string, value?: string) => {
    document.execCommand(command, false, value || "");
  };

  // Handle link insertion
  const handleLinkClick = () => {
    const url = window.prompt("Enter link URL");
    if (url) document.execCommand("createLink", false, url);
  };

  return (
    <FormField
      control={form.control}
      name="installation"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Installation</FormLabel>
          <FormControl>
            {isEditing ? (
              <div className="rich-text-editor-toolbar">
                <div className="rich-text-editor-buttons">
                  <button
                    type="button"
                    onClick={() => handleFormatClick("bold")}
                    className="rich-text-button"
                  >
                    <strong>B</strong>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleFormatClick("italic")}
                    className="rich-text-button"
                  >
                    <em>I</em>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleFormatClick("underline")}
                    className="rich-text-button"
                  >
                    <u>U</u>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleFormatClick("insertOrderedList")}
                    className="rich-text-button"
                  >
                    OL
                  </button>
                  <button
                    type="button"
                    onClick={() => handleFormatClick("insertUnorderedList")}
                    className="rich-text-button"
                  >
                    UL
                  </button>
                  <button
                    type="button"
                    onClick={handleLinkClick}
                    className="rich-text-button"
                  >
                    Link
                  </button>
                </div>
                <div
                  className="rich-text-editor-content"
                  contentEditable
                  dangerouslySetInnerHTML={{ __html: editorContent }}
                  onBlur={handleEditorChange}
                />
              </div>
            ) : (
              <div
                className="prose max-w-none border rounded-md p-3 min-h-[100px] bg-white"
                dangerouslySetInnerHTML={{ __html: field.value }}
              />
            )}
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

// Custom hook for supplier details
function useSupplierDetail(id: string) {
  const [supplier, setSupplier] = React.useState<SupplierDetail | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const fetchSupplier = React.useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      console.log(`Fetching supplier with ID: ${id}`);
      const response = await fetch(`/api/admin/suppliers/${id}`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log("Supplier API response:", data);

      // More graceful error handling for missing data
      if (!data || !data.supplier) {
        throw new Error("Invalid server response: missing supplier data");
      }

      // Safely initialize materials array if it doesn't exist
      if (!data.supplier.materials) {
        data.supplier.materials = [];
      }

      try {
        const validatedData = supplierResponseSchema.parse(data);
        setSupplier(validatedData.supplier);
      } catch (validationErr) {
        console.error("Schema validation error:", validationErr);
        // Fall back to using unvalidated data if schema validation fails
        setSupplier(data.supplier);
      }
    } catch (err) {
      console.error("Error fetching supplier:", err);
      setError(err instanceof Error ? err.message : "An error occurred");
      toast.error("Failed to load supplier details. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [id]); // Add `id` as a dependency since it is used inside the function

  React.useEffect(() => {
    if (id) {
      fetchSupplier();
    }
  }, [id, fetchSupplier]); // Now `fetchSupplier` is stable and won't cause unnecessary re-renders

  return { supplier, loading, error, refetch: fetchSupplier };
}

// Supplier Edit Form Component
function SupplierEditForm({
  supplier,
  onUpdate,
}: {
  supplier: SupplierDetail;
  onUpdate: () => void;
}) {
  const [isEditing, setIsEditing] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const form = useForm<SupplierFormData>({
    resolver: zodResolver(supplierFormSchema),
    defaultValues: {
      name: supplier.name,
      description: supplier.description,
      installation: supplier.installation,
      phone: supplier.phone,
      email: supplier.email,
      logoUrl: supplier.logoUrl,
    },
  });

  const handleSubmit = async (data: SupplierFormData) => {
    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append("name", data.name);
      formData.append("description", data.description);
      formData.append("installation", data.installation);
      formData.append("phone", data.phone);
      formData.append("email", data.email);

      if (data.logoFile) {
        formData.append("logoFile", data.logoFile);
      } else if (data.logoUrl) {
        formData.append("logoUrl", data.logoUrl);
      }

      const response = await fetch(`/api/admin/suppliers/${supplier.id}`, {
        method: "PATCH",
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      toast.success("Supplier updated successfully");
      setIsEditing(false);
      onUpdate();
    } catch (error) {
      console.error("Error updating supplier:", error);
      toast.error("Failed to update supplier");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    form.reset({
      name: supplier.name,
      description: supplier.description,
      installation: supplier.installation,
      phone: supplier.phone,
      email: supplier.email,
      logoUrl: supplier.logoUrl,
    });
    setIsEditing(false);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-6">
        <div className="flex items-center gap-4">
          <Avatar className="size-16">
            <AvatarImage src={supplier.logoUrl} alt={supplier.name} />
            <AvatarFallback className="text-lg">
              {supplier.name.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <CardTitle className="text-2xl">{supplier.name}</CardTitle>
            <p className="text-muted-foreground mt-1">
              Supplier ID: {supplier.id.split("-")[0].toUpperCase()}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {!isEditing ? (
            <Button onClick={() => setIsEditing(true)} variant="outline">
              <IconEdit className="size-4" />
              Edit
            </Button>
          ) : (
            <div className="flex items-center gap-2">
              <Button
                onClick={handleCancel}
                variant="outline"
                disabled={isSubmitting}
              >
                <IconX className="size-4" />
                Cancel
              </Button>
              <Button
                onClick={form.handleSubmit(handleSubmit)}
                disabled={isSubmitting}
                className="min-w-20"
              >
                {isSubmitting ? (
                  <IconLoader className="size-4 animate-spin" />
                ) : (
                  <IconDeviceFloppy className="size-4" />
                )}
                Save
              </Button>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="grid gap-6"
          >
            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input {...field} disabled={!isEditing} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="logoUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <ImageUpload
                        isEditing={!isEditing}
                        value={field.value}
                        onChange={field.onChange}
                        onFileChange={(file) => {
                          form.setValue("logoFile", file || undefined);
                        }}
                        label="Logo"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input {...field} type="email" disabled={!isEditing} />
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
                    <FormLabel>Phone</FormLabel>
                    <FormControl>
                      <Input {...field} type="tel" disabled={!isEditing} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea {...field} disabled={!isEditing} rows={3} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <InstallationRichTextEditor form={form} isEditing={isEditing} />
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Created</Label>
                <Input
                  value={new Date(supplier.createdAt).toLocaleString()}
                  disabled
                />
              </div>
              <div className="space-y-2">
                <Label>Last Updated</Label>
                <Input
                  value={new Date(supplier.updatedAt).toLocaleString()}
                  disabled
                />
              </div>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

// Material Edit Dialog Component
function MaterialEditDialog({
  material,
  onUpdate,
  trigger,
}: {
  material: Material;
  onUpdate: () => void;
  trigger: React.ReactNode;
}) {
  const [open, setOpen] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const form = useForm<MaterialFormData>({
    resolver: zodResolver(materialFormSchema),
    defaultValues: {
      type: material.type,
      warranty: material.warranty,
      topFeatures: material.topFeatures,
      price: material.price,
      materialImage: material.materialImage,
      showCase: material.showCase,
    },
  });

  const handleSubmit = async (data: MaterialFormData) => {
    setIsSubmitting(true);
    console.log("Edit form data being submitted:", data);

    try {
      const formData = new FormData();
      formData.append("id", material.id);
      formData.append("supplierId", material.supplierId);
      formData.append("type", data.type);
      formData.append("warranty", data.warranty);
      formData.append("topFeatures", data.topFeatures);
      formData.append("price", data.price);

      // Handle image fields consistently - use files first if they exist, fall back to URLs
      if (data.materialImageFile) {
        formData.append("materialImage", data.materialImageFile);
      } else {
        formData.append(
          "materialImage",
          data.materialImage || material.materialImage || ""
        );
      }

      if (data.showCaseFile) {
        formData.append("showCase", data.showCaseFile);
      } else {
        formData.append("showCase", data.showCase || material.showCase || "");
      }

      const response = await fetch(`/api/admin/materials/${material.id}`, {
        method: "PATCH",
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      toast.success("Material updated successfully");
      setOpen(false);
      onUpdate();
    } catch (error) {
      console.error("Error updating material:", error);
      toast.error("Failed to update material");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Edit Material</DialogTitle>
          <DialogDescription>
            Update the material information below.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="warranty"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Warranty</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Price</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="topFeatures"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Top Features</FormLabel>
                  <FormControl>
                    <Textarea {...field} rows={3} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="materialImage"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <ImageUpload
                        isEditing={true}
                        value={field.value}
                        onChange={field.onChange}
                        onFileChange={(file) =>
                          form.setValue("materialImageFile", file || undefined)
                        }
                        label="Material Image"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="showCase"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <ImageUpload
                        isEditing={true}
                        value={field.value}
                        onChange={field.onChange}
                        onFileChange={(file) =>
                          form.setValue("showCaseFile", file || undefined)
                        }
                        label="Showcase Image"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </form>
        </Form>
        <DialogFooter className="mt-6 flex justify-end gap-2">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={form.handleSubmit(handleSubmit)}
            disabled={isSubmitting}
            className="bg-gradient-to-br from-amber-500 to-orange-600 text-white hover:from-amber-600 hover:to-orange-700 transition-colors"
          >
            {isSubmitting ? (
              <IconLoader className="size-4 animate-spin mr-2" />
            ) : (
              "Save Changes"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Material Add Dialog Component
function MaterialAddDialog({
  supplierId,
  onUpdate,
  trigger,
}: {
  supplierId: string;
  onUpdate: () => void;
  trigger: React.ReactNode;
}) {
  const [open, setOpen] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // Form schema for material
  const materialFormSchema = z.object({
    type: z.string().min(1, "Type is required"),
    warranty: z.string().min(1, "Warranty is required"),
    price: z.string().min(1, "Price is required"),
    topFeatures: z.string().min(1, "Top features are required"),
    materialImage: z.string().optional(),
    showCase: z.string().optional(),
    materialImageFile: z.any().optional(),
    showCaseFile: z.any().optional(),
  });

  // Type for form data
  type MaterialFormData = z.infer<typeof materialFormSchema>;

  // Initial form values
  const defaultValues: MaterialFormData = {
    type: "",
    warranty: "",
    price: "",
    topFeatures: "",
    materialImage: "",
    showCase: "",
    materialImageFile: undefined,
    showCaseFile: undefined,
  };

  const form = useForm<MaterialFormData>({
    resolver: zodResolver(materialFormSchema),
    defaultValues,
  });

  // Handle form submission
  const handleSubmit = async (data: MaterialFormData) => {
    setIsSubmitting(true);
    console.log("Form data being submitted:", data);

    try {
      const formData = new FormData();
      formData.append("supplierId", supplierId);
      formData.append("type", data.type);
      formData.append("warranty", data.warranty);
      formData.append("price", data.price);
      formData.append("topFeatures", data.topFeatures);

      // Handle image fields consistently - use files first if they exist, fall back to URLs
      if (data.materialImageFile) {
        formData.append("materialImage", data.materialImageFile);
      } else {
        formData.append("materialImage", data.materialImage || "");
      }

      if (data.showCaseFile) {
        formData.append("showCase", data.showCaseFile);
      } else {
        formData.append("showCase", data.showCase || "");
      }

      const response = await fetch(`/api/admin/materials`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      toast.success("Material added successfully");
      setOpen(false);
      form.reset();
      onUpdate();
    } catch (error) {
      console.error("Error adding material:", error);
      toast.error("Failed to add material");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Add New Material</DialogTitle>
          <DialogDescription>
            Add details for the new roofing material.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="warranty"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Warranty</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Price</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="topFeatures"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Top Features</FormLabel>
                  <FormControl>
                    <Textarea {...field} rows={3} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="materialImage"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <ImageUpload
                        isEditing={true}
                        value={field.value}
                        onChange={field.onChange}
                        onFileChange={(file) =>
                          form.setValue("materialImageFile", file || undefined)
                        }
                        label="Material Image"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="showCase"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <ImageUpload
                        isEditing={true}
                        value={field.value}
                        onChange={field.onChange}
                        onFileChange={(file) =>
                          form.setValue("showCaseFile", file || undefined)
                        }
                        label="Showcase Image"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </form>
        </Form>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => {
              setOpen(false);
              form.reset();
            }}
            className="border-amber-500 text-amber-700 hover:bg-amber-50"
          >
            Cancel
          </Button>
          <Button
            onClick={form.handleSubmit(handleSubmit)}
            disabled={isSubmitting}
            className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white"
          >
            {isSubmitting ? (
              <IconLoader className="size-4 animate-spin" />
            ) : (
              "Add Material"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Materials Table Component
function MaterialsTable({
  materials,
  onUpdate,
  supplierId,
}: {
  materials: Material[];
  onUpdate: () => void;
  supplierId: string;
}) {
  const handleDelete = async (materialId: string) => {
    if (!confirm("Are you sure you want to delete this material?")) return;

    try {
      const response = await fetch(`/api/admin/materials/${materialId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      toast.success("Material deleted successfully");
      onUpdate();
    } catch (error) {
      console.error("Error deleting material:", error);
      toast.error("Failed to delete material");
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-6">
        <CardTitle>Materials ({materials.length})</CardTitle>
        <MaterialAddDialog
          supplierId={materials[0]?.supplierId || supplierId}
          onUpdate={onUpdate}
          trigger={
            <Button
              variant="outline"
              size="sm"
              className="border-amber-500 text-amber-700 hover:bg-amber-50 hover:text-amber-800"
            >
              <IconPlus className="size-4" />
              Add Material
            </Button>
          }
        />
      </CardHeader>
      <CardContent>
        <div className="overflow-hidden rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Material</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Warranty</TableHead>
                <TableHead>Features</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="w-[70px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {materials.length > 0 ? (
                materials.map((material) => (
                  <TableRow key={material.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="size-8">
                          <AvatarImage
                            src={material.materialImage}
                            alt={material.type}
                          />
                          <AvatarFallback>
                            {material.type.slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-medium">{material.type}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{material.type}</Badge>
                    </TableCell>
                    <TableCell>{material.warranty}</TableCell>
                    <TableCell className="max-w-48 truncate">
                      {material.topFeatures}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(material.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-8"
                          >
                            <IconDotsVertical className="size-4" />
                            <span className="sr-only">Open menu</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <MaterialEditDialog
                            material={material}
                            onUpdate={onUpdate}
                            trigger={
                              <DropdownMenuItem
                                onSelect={(e) => e.preventDefault()}
                              >
                                <IconEdit className="size-4" />
                                Edit
                              </DropdownMenuItem>
                            }
                          />
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            variant="destructive"
                            onClick={() => handleDelete(material.id)}
                          >
                            <IconTrash className="size-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center">
                    No materials found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

// Main Page Component
export default function SupplierEditPage() {
  const params = useParams();
  const router = useRouter();
  const supplierId = params.supplierId as string;

  const { supplier, loading, error, refetch } = useSupplierDetail(supplierId);

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="flex items-center gap-2">
          <IconLoader className="size-6 animate-spin" />
          <span>Loading supplier details...</span>
        </div>
      </div>
    );
  }

  if (error || !supplier) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="text-center">
          <p className="text-destructive mb-4">
            {error || "Supplier not found"}
          </p>
          <Button onClick={() => router.back()} variant="outline">
            <IconArrowLeft className="size-4" />
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          onClick={() => router.back()}
          variant="outline"
          size="icon"
          className="size-10"
        >
          <IconArrowLeft className="size-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Edit Supplier</h1>
          <p className="text-muted-foreground">
            Manage supplier information and materials
          </p>
        </div>
      </div>

      {/* Upper Part - Supplier Edit Form */}
      <SupplierEditForm supplier={supplier} onUpdate={refetch} />

      <Separator />

      {/* Lower Part - Materials Table */}
      <MaterialsTable
        materials={supplier.materials || []}
        onUpdate={refetch}
        supplierId={supplierId}
      />
    </div>
  );
}
