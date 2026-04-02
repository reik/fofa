import React from "react";
import { Avatar } from "../../components/ui/Avatar";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { useProfileForm } from "./useProfileForm";

const US_STATES = [
  "AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "FL", "GA",
  "HI", "ID", "IL", "IN", "IA", "KS", "KY", "LA", "ME", "MD",
  "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH", "NJ",
  "NM", "NY", "NC", "ND", "OH", "OK", "OR", "PA", "RI", "SC",
  "SD", "TN", "TX", "UT", "VT", "VA", "WA", "WV", "WI", "WY", "DC",
];

export function ProfileForm() {
  const { user, register, handleSubmit, errors, saving, currentThumb, handleFileChange, onSubmit } =
    useProfileForm();

  return (
    <div className="bg-surface rounded-xl border-[1.5px] border-border elevated-card p-9 shadow-sm">
      <div className="flex flex-col items-center gap-3 mb-7">
        <Avatar src={currentThumb} name={user?.name || "User"} size={96} />
        <label className="cursor-pointer text-brand font-semibold text-[0.9rem]">
          Change profile photo
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
            data-testid="thumbnail-input"
          />
        </label>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-[18px]">
        <Input
          label="Full name"
          error={errors.name?.message}
          {...register("name", { required: "Name is required" })}
        />

        <div className="grid grid-cols-2 gap-[14px]">
          <Input
            label="City"
            error={errors.city?.message}
            {...register("city", { required: "City is required" })}
          />
          <div className="flex flex-col gap-[5px]">
            <label className="font-semibold text-[0.88rem] text-muted">State</label>
            <select
              {...register("state", { required: "State is required" })}
              className={[
                "px-[14px] py-[10px] rounded-sm text-[0.95rem] bg-surface font-body outline-none",
                errors.state
                  ? "border-[1.5px] border-red-600"
                  : "border-[1.5px] border-border",
              ].join(" ")}
            >
              <option value="">State</option>
              {US_STATES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex justify-between items-center mt-2">
          <div className="text-[0.85rem] text-muted">✉️ {user?.email}</div>
          <Button type="submit" loading={saving}>
            Save Changes
          </Button>
        </div>
      </form>
    </div>
  );
}
