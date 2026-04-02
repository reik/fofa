import { useState } from "react";
import { authService } from "../../services";
import toast from "react-hot-toast";

export function useChangePasswordForm() {
  const [loading, setLoading] = useState(false);
  const [pwForm, setPwForm] = useState({ current: "", next: "", confirm: "" });
  const [pwError, setPwError] = useState("");

  const handleChange = (field: keyof typeof pwForm) =>
    (e: React.ChangeEvent<HTMLInputElement>) =>
      setPwForm((p) => ({ ...p, [field]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwError("");

    if (pwForm.next !== pwForm.confirm) {
      setPwError("New passwords do not match");
      return;
    }
    if (pwForm.next.length < 8) {
      setPwError("New password must be at least 8 characters");
      return;
    }

    setLoading(true);
    try {
      await authService.changePassword(pwForm.current, pwForm.next);
      toast.success("Password changed!");
      setPwForm({ current: "", next: "", confirm: "" });
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      setPwError(message || "Failed to change password");
    } finally {
      setLoading(false);
    }
  };

  return { pwForm, pwError, loading, handleChange, handleSubmit };
}
