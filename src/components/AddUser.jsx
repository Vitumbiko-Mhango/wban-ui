import React, { useEffect } from "react";
import { X, LoaderCircle } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import Button from "./common/Button";

const getSchema = (isEdit) =>
  z.object({
    firstname: z.string().min(2, "Firstname is required"),
    surname: z.string().min(2, "Surname is required"),
    email: z.string().email("Enter a valid email"),
    role: z.string().min(1, "Role is required"),

    password: isEdit
      ? z
          .string()
          .min(6, "Password must be at least 6 characters")
          .optional()
          .or(z.literal(""))
      : z.string().min(6, "Password is required"),
  });

const UserForm = ({ closeForm, onSubmit, user }) => {
  const isEdit = !!user;

  const {
    register,
    handleSubmit,
    reset,
    setFocus,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(getSchema(isEdit)),
    defaultValues: {
      firstname: "",
      surname: "",
      email: "",
      role: "staff",
      password: "",
    },
  });

  useEffect(() => {
    if (user) {
      reset({
        firstname: user.firstname || "",
        surname: user.surname || "",
        email: user.email || "",
        role: user.role || "staff",
        password: "",
      });
    }
  }, [user, reset]);

  const onError = (errors) => {
    const firstField = Object.keys(errors)[0];
    if (firstField) setFocus(firstField);
  };

  const submitHandler = async (data) => {
    if (isEdit && !data.password) {
      delete data.password;
    }

    await onSubmit(data);
  };

  return (
    <div className="absolute z-50 inset-0 flex items-center justify-center bg-black/50">
      <form
        onSubmit={handleSubmit(submitHandler, onError)}
        className="relative bg-light-a0 p-6 rounded-lg max-w-xl w-full shadow-lg"
      >
        {/* Close */}
        <div className="absolute right-4 top-4">
          <X
            onClick={closeForm}
            className="size-4 text-dark-a0/60 hover:text-dark-a0 cursor-pointer"
          />
        </div>

        {/* Header */}
        <div>
          <h2 className="text-xl font-bold text-dark-a0">
            {isEdit ? "Edit User" : "Add User"}
          </h2>
          <p className="text-sm text-dark-a0/60">
            {isEdit ? "Update user details" : "Enter user information"}
          </p>
        </div>

        <div className="space-y-4 mt-6">
          {/* Firstname & Surname */}
          <div className="flex gap-4">
            <div className="w-full">
              <label className="label">Firstname</label>
              <input
                {...register("firstname")}
                placeholder="Enter firstname"
                className={`input ${errors.firstname ? "input-error" : ""}`}
              />
              {errors.firstname && (
                <p className="error-text">{errors.firstname.message}</p>
              )}
            </div>

            <div className="w-full">
              <label className="label">Surname</label>
              <input
                {...register("surname")}
                placeholder="Enter surname"
                className={`input ${errors.surname ? "input-error" : ""}`}
              />
              {errors.surname && (
                <p className="error-text">{errors.surname.message}</p>
              )}
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="label">Email</label>
            <input
              type="email"
              {...register("email")}
              placeholder="example@email.com"
              className={`input ${errors.email ? "input-error" : ""}`}
            />
            {errors.email && (
              <p className="error-text">{errors.email.message}</p>
            )}
          </div>

          {/* Role */}
          <div>
            <label className="label">Role</label>
            <select {...register("role")} className="input">
              <option value="staff">Staff</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          {/* Password */}
          <div>
            <label className="label">
              Password{" "}
              {isEdit && (
                <span className="text-xs text-dark-a0/60">
                  (leave blank to keep current password)
                </span>
              )}
            </label>
            <input
              type="password"
              {...register("password")}
              placeholder="••••••••"
              className={`input ${errors.password ? "input-error" : ""}`}
            />
            {errors.password && (
              <p className="error-text">{errors.password.message}</p>
            )}
          </div>

          {/* Buttons */}
          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="secondary"
              size="md"
              onClick={closeForm}
            >
              Cancel
            </Button>

            <Button
              type="submit"
              variant="primary"
              size="md"
              disabled={isSubmitting}
            >
              {isSubmitting && <LoaderCircle className="animate-spin size-4" />}
              {isEdit ? "Update User" : "Add User"}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default UserForm;
