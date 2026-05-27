import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Building2,
  User,
  Mail,
  Phone,
  Lock,
  Camera,
  Upload,
  Image as ImageIcon,
  Wand2,
  Eye,
  EyeOff,
} from "lucide-react";
import { getImagePath } from "@/utils/helpers";
import MediaLibraryModal from "@/components/MediaLibraryModal";
import { toast } from "sonner";
import { router } from "@inertiajs/react";
import { cn } from "@/lib/utils";

export function AddCompanyModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const [formData, setFormData] = useState({
    avatar: "",
    name: "",
    email: "",
    phone: "",
    password: "",
    password_confirmation: "",
  });

  const [isMediaModalOpen, setIsMediaModalOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error when user types
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const generateStrongPassword = () => {
    const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+";
    let password = "";
    // Ensure at least one of each type
    password += "ABCDEFGHIJKLMNOPQRSTUVWXYZ"[Math.floor(Math.random() * 26)];
    password += "abcdefghijklmnopqrstuvwxyz"[Math.floor(Math.random() * 26)];
    password += "0123456789"[Math.floor(Math.random() * 10)];
    password += "!@#$%^&*()_+"[Math.floor(Math.random() * 12)];
    
    for (let i = 0; i < 12; i++) {
      password += charset[Math.floor(Math.random() * charset.length)];
    }
    
    // Shuffle
    password = password.split('').sort(() => 0.5 - Math.random()).join('');
    
    setFormData((prev) => ({ ...prev, password, password_confirmation: password }));
    
    setErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors.password;
      delete newErrors.password_confirmation;
      return newErrors;
    });
    
    // Copy to clipboard
    navigator.clipboard.writeText(password)
      .then(() => {
        toast.success("Password generated and copied to clipboard!");
      })
      .catch(() => {
        toast.success("Strong password generated! (Could not auto-copy)");
      });
  };

  const handleAvatarChange = (filename: string) => {
    setFormData((prev) => ({ ...prev, avatar: filename }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.password !== formData.password_confirmation) {
      setErrors({ password_confirmation: "Passwords do not match." });
      return;
    }

    if (!window.appSettings?.is_demo) {
      toast.loading("Creating company...");
    }

    router.post(route("companies.store"), formData, {
      preserveScroll: true,
      onSuccess: (page) => {
        onClose();
        if (!window.appSettings?.is_demo) {
          toast.dismiss();
        }
        if (page.props.flash?.success) {
          toast.success(page.props.flash.success);
        }
        setFormData({
          avatar: "",
          name: "",
          email: "",
          phone: "",
          password: "",
          password_confirmation: "",
        });
        setErrors({});
      },
      onError: (errs) => {
        if (!window.appSettings?.is_demo) {
          toast.dismiss();
        }
        setErrors(errs);
      },
    });
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[700px] p-0 overflow-hidden border-0 bg-white dark:bg-gray-950 shadow-2xl rounded-2xl">
          <DialogHeader className="p-4 border-b border-gray-100 dark:border-gray-800">
            <DialogTitle className="text-base font-bold text-gray-900 flex items-center ">
              Add New Company
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="px-8 py-6 space-y-8 max-h-[70vh] overflow-y-auto">
            {/* SECTION 1: Company Profile */}
            <div className="space-y-6">
              <div className="flex items-center gap-3 border-b border-gray-100 dark:border-gray-800 pb-2">
            
                <h3 className="text-lg font-semibold tracking-tight">Company Profile</h3>
              </div>

              {/* Logo Upload */}
              <div className="space-y-3 mb-6">
                <div className="flex items-center gap-1.5">
                  <Label className="font-bold text-gray-700 dark:text-gray-300">Company Logo</Label>
                  <span className="text-sm text-gray-400 font-medium">(Optional)</span>
                </div>

                <div className="flex items-start gap-4">
                  {/* Left Side: Dashed Placeholder */}
                  <div className="h-24 w-24 rounded-2xl border-2 border-dashed border-gray-300 dark:border-gray-700 flex items-center justify-center bg-gray-50 dark:bg-gray-900 overflow-hidden shrink-0">
                    {formData.avatar ? (
                      <img
                        src={getImagePath(formData.avatar)}
                        className="h-full w-full object-cover"
                        alt="Company Logo"
                      />
                    ) : (
                      <Building2 className="text-gray-300 dark:text-gray-600" size={32} />
                    )}
                  </div>

                  {/* Right Side: Upload Button & Text */}
                  <div className="flex flex-col items-start gap-2 mt-2">
                    <Button 
                      type="button" 
                      variant="outline" 
                      className="font-semibold text-gray-700 dark:text-gray-300 h-10 px-4 rounded-xl border-gray-200 dark:border-gray-800"
                      onClick={() => setIsMediaModalOpen(true)}
                    >
                      <Upload className="mr-2 h-4 w-4" />
                      Upload image
                    </Button>
                    <p className="text-xs text-gray-400 dark:text-gray-500 font-medium">
                      Recommended: Square PNG or JPG, max 2MB.
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <Label className="block mb-2 font-bold text-gray-700 dark:text-gray-300">Company Name <span className="text-red-500">*</span></Label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted-foreground">
                      <Building2 size={16} />
                    </div>
                    <Input
                      name="name"
                      placeholder="e.g. Acme Corp"
                      className={cn("pl-10 h-11", errors.name && "border-red-500")}
                      value={formData.name}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name}</p>}
                </div>

                <div>
                  <Label className="block mb-2 font-bold text-gray-700 dark:text-gray-300">Email Address <span className="text-red-500">*</span></Label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted-foreground">
                      <Mail size={16} />
                    </div>
                    <Input
                      type="email"
                      name="email"
                      placeholder="e.g. john@acme.com"
                      className={cn("pl-10 h-11", errors.email && "border-red-500")}
                      value={formData.email}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email}</p>}
                </div>

                <div>
                  <Label className="block mb-2 font-bold text-gray-700 dark:text-gray-300">Phone Number <span className="text-red-500">*</span></Label>
                  <div className="relative flex">
                    <div className="flex items-center justify-center px-3 border border-r-0 border-input rounded-l-md bg-gray-50 dark:bg-gray-900 text-muted-foreground h-11">
                      <Phone size={16} />
                    </div>
                    <Input
                      type="tel"
                      name="phone"
                      placeholder="e.g. +91 98765 43210"
                      className={cn("rounded-l-none h-11", errors.phone && "border-red-500")}
                      value={formData.phone}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  {errors.phone && <p className="mt-1 text-xs text-red-500">{errors.phone}</p>}
                </div>
              </div>
            </div>

            {/* SECTION 2: Admin Credentials */}
            <div className="space-y-6">
              <div className="flex items-center gap-3 border-b border-gray-100 dark:border-gray-800 pb-2">
              
                <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">Admin Credentials</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label className="font-bold text-gray-700 dark:text-gray-300">Password <span className="text-red-500">*</span></Label>
                    <button
                      type="button"
                      onClick={generateStrongPassword}
                      className="text-xs font-semibold text-primary hover:text-primary/80 flex items-center gap-1 transition-colors"
                    >
                      <Wand2 size={12} />
                      Generate
                    </button>
                  </div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted-foreground">
                      <Lock size={16} />
                    </div>
                    <Input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      placeholder="Enter password"
                      className={cn("pl-10 pr-10 h-11", errors.password && "border-red-500")}
                      value={formData.password}
                      onChange={handleChange}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-muted-foreground hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {errors.password && <p className="mt-1 text-xs text-red-500">{errors.password}</p>}
                </div>

                <div>
                  <Label className="block mb-2 font-bold text-gray-700 dark:text-gray-300">Confirm Password <span className="text-red-500">*</span></Label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted-foreground">
                      <Lock size={16} />
                    </div>
                    <Input
                      type={showPassword ? "text" : "password"}
                      name="password_confirmation"
                      placeholder="Confirm password"
                      className={cn("pl-10 pr-10 h-11", errors.password_confirmation && "border-red-500")}
                      value={formData.password_confirmation}
                      onChange={handleChange}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-muted-foreground hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {errors.password_confirmation && (
                    <p className="mt-1 text-xs text-red-500">{errors.password_confirmation}</p>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-6 border-t border-gray-100 dark:border-gray-800 mt-8">
              <Button type="button" variant="outline" onClick={onClose} className="font-bold h-11 px-6">
                Cancel
              </Button>
              <Button type="submit" className="font-bold h-11 px-8">
                Create Workspace
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
      <MediaLibraryModal
        isOpen={isMediaModalOpen}
        onClose={() => setIsMediaModalOpen(false)}
        onSelect={(url) => {
          const filename = url.split("/").pop() || url;
          handleAvatarChange(filename);
          setIsMediaModalOpen(false);
        }}
      />
    </>
  );
}
