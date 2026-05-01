import { useState } from "react";
import { Eye, EyeOff, LoaderCircle, X } from "lucide-react";
import Heading from "../components/common/Heading";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import Button from "./common/Button";

const schema = z
  .object({
    current: z.string().min(1, "Current password is required"),
    newPw: z.string().min(6, "New password must be at least 6 characters"),
    confirm: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.newPw === data.confirm, {
    message: "Passwords do not match",
    path: ["confirm"],
  });

const PasswordField = ({ label, register, name, error }) => {
  const [show, setShow] = useState(false);

  return (
    <div className="space-y-2">
      <label className="block text-s text-dark-a0/60">{label}</label>

      <div className="relative flex items-center">
        <input
          type={show ? "text" : "password"}
          placeholder="••••••••"
          {...register(name)}
          className={`w-full pl-3 pr-10 py-2 text-sm border rounded-md focus:outline-none focus:ring-1 transition-colors ${
            error
              ? "border-red-400 bg-red-50 focus:ring-red-300"
              : "border-surface-a30 focus:ring-primary-a20 focus:border-primary-a20"
          }`}
        />

        <button
          type="button"
          onClick={() => setShow((s) => !s)}
          className="absolute right-3 text-dark-a0/40 hover:text-dark-a0"
        >
          {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
        </button>
      </div>

      {error && <p className="text-xs text-red-600">{error.message}</p>}
    </div>
  );
};

const Settings = ({ closeForm }) => {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data) => {
    try {
      await new Promise((res) => setTimeout(res, 1500));
      alert("Password changed successfully!");
      reset();
    } catch (err) {
      console.log(err);
    }
  };

  return (
    <div className="absolute z-50 inset-0 flex items-center justify-center bg-dark-a0/80">
      <div className="relative bg-light-a0 p-6 m-4 rounded-lg max-w-md w-full">
        {/* Heading */}
        <Heading
          title="Security Settings"
          subtitle="Update your login password below."
        />
        <div>
          <X
            onClick={closeForm}
            className="absolute top-4 right-4 size-4 text-dark-a0/50 hover:text-dark-a0 cursor-pointer"
          />
        </div>
        <div className="space-y-4 mt-8">
          <div className="space-y-4">
            {/* Current Password */}
            <PasswordField
              label="Current password"
              name="current"
              register={register}
              error={errors.current}
            />
            {/* New Password */}
            <PasswordField
              label="New password"
              name="newPw"
              register={register}
              error={errors.newPw}
            />
            {/* Confirm Password */}
            <PasswordField
              label="Confirm new password"
              name="confirm"
              register={register}
              error={errors.confirm}
            />
            {/* Buttons */}
            <div className="pt-2 flex justify-end gap-2">
              <Button variant="secondary" onClick={closeForm}>
                Cancel
              </Button>

              <Button
                variant="primary"
                onClick={handleSubmit(onSubmit)}
                disabled={isSubmitting}
              >
                Save changes
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
