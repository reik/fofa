import { ProfileForm } from "./ProfileForm";
import { ChangePasswordForm } from "./ChangePasswordForm";

export function ProfilePage() {
  return (
    <main className="max-w-[600px] mx-auto px-5 py-10">
      <h1 className="font-heading text-[1.8rem] font-medium text-brand-dark mb-8">
        Edit Profile
      </h1>
      <ProfileForm />
      <ChangePasswordForm />
    </main>
  );
}
