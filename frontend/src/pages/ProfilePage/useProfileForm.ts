import { useState } from "react";
import { useForm } from "react-hook-form";
import { useAuthStore } from "../../contexts/authStore";
import { userService } from "../../services";
import toast from "react-hot-toast";

export interface ProfileFormData {
  name: string;
  city: string;
  state: string;
}

export function useProfileForm() {
  const { user, updateUser } = useAuthStore();
  const [thumbFile, setThumbFile] = useState<File | null>(null);
  const [thumbPreview, setThumbPreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ProfileFormData>({
    defaultValues: {
      name: user?.name || "",
      city: user?.city || "",
      state: user?.state || "",
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setThumbFile(f);
    setThumbPreview(URL.createObjectURL(f));
  };

  const onSubmit = async (data: ProfileFormData) => {
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append("name", data.name);
      fd.append("city", data.city);
      fd.append("state", data.state);
      if (thumbFile) fd.append("thumbnail", thumbFile);
      const updated = await userService.updateProfile(fd);
      updateUser(updated);
      toast.success("Profile updated!");
    } catch {
      toast.error("Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const currentThumb = thumbPreview || user?.thumbnail || null;

  return {
    user,
    register,
    handleSubmit,
    errors,
    saving,
    currentThumb,
    handleFileChange,
    onSubmit,
  };
}
