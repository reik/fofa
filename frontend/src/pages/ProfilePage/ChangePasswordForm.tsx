import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { useChangePasswordForm } from "./useChangePasswordForm";

export function ChangePasswordForm() {
  const { pwForm, pwError, loading, handleChange, handleSubmit } = useChangePasswordForm();

  return (
    <div className="bg-surface rounded-xl border-[1.5px] border-border elevated-card p-9 shadow-sm mt-6">
      <h2 className="font-heading text-[1.2rem] font-medium text-brand-dark mb-5">
        Change Password
      </h2>
      <form onSubmit={handleSubmit} className="flex flex-col gap-[18px]">
        <Input
          label="Current password"
          type="password"
          autoComplete="current-password"
          value={pwForm.current}
          onChange={handleChange("current")}
        />
        <Input
          label="New password"
          type="password"
          autoComplete="new-password"
          value={pwForm.next}
          onChange={handleChange("next")}
        />
        <Input
          label="Confirm new password"
          type="password"
          autoComplete="new-password"
          value={pwForm.confirm}
          onChange={handleChange("confirm")}
          error={pwError || undefined}
        />
        <div className="flex justify-end">
          <Button type="submit" loading={loading}>
            Update Password
          </Button>
        </div>
      </form>
    </div>
  );
}
