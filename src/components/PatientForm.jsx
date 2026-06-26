import { X } from "lucide-react";
import React, { useEffect, useRef, useState } from "react";
import Button from "./common/Button";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import useClickOutside from "../hooks/useClickOutside";

const schema = z.object({
  firstname: z.string().min(2, "Firstname is required"),
  surname: z.string().min(2, "Surname is required"),
  age: z
    .number({ invalid_type_error: "Age is required" })
    .min(0, "Invalid age")
    .max(120, "Age too large"),
  gender: z.string(),
  ward: z.string().min(1, "Ward is required"),
  bed: z.string().min(1, "Bed is required"),
  device: z.string(),
  condition: z.string().min(2, "Condition is required"),
  status: z.string(),
  notes: z.string().optional(),
});

const PatientForm = ({ closeForm, onSubmit, patient }) => {
  const isEdit = !!patient;
  const formRef = useRef(null);
  const [availableDevices, setAvailableDevices] = useState([]);
  const [loadingDevices, setLoadingDevices] = useState(true);

  useClickOutside(formRef, closeForm);

  const {
    register,
    handleSubmit,
    reset,
    setFocus,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      firstname: "",
      surname: "",
      age: "",
      gender: "male",
      ward: "",
      bed: "",
      device: "",
      condition: "",
      status: "normal",
      notes: "",
    },
  });

  // Fetch available devices from backend
  useEffect(() => {
    const fetchDevices = async () => {
      try {
        const token = localStorage.getItem("access_token");
        const res = await fetch("http://127.0.0.1:8000/api/devices/", {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });
        const data = await res.json();
        // Filter only unassigned devices (not paired to any patient)
        // unless editing — include current patient's device too
        const devices = data.results || data;
        const filtered = devices.filter(
          (d) => !d.is_paired || (isEdit && d.device_id === patient?.device),
        );
        setAvailableDevices(filtered);
      } catch (err) {
        console.error("Failed to fetch devices:", err);
      } finally {
        setLoadingDevices(false);
      }
    };

    fetchDevices();
  }, [isEdit, patient]);

  useEffect(() => {
    if (patient) {
      reset({ ...patient });
    }
  }, [patient, reset]);

  const onError = (errors) => {
    const firstField = Object.keys(errors)[0];
    if (firstField) setFocus(firstField);
  };

  const submitHandler = async (data) => {
    await onSubmit(data);
  };

  return (
    <div className="absolute z-50 inset-0 flex items-center justify-center bg-dark-a0/80">
      <form
        ref={formRef}
        onSubmit={handleSubmit(submitHandler, onError)}
        className="relative bg-light-a0 p-6 rounded-lg max-w-2xl max-h-[90vh] overflow-y-auto w-full m-4"
      >
        {/* Close */}
        <div className="absolute right-6">
          <X
            onClick={closeForm}
            className="size-4 text-dark-a0/60 hover:text-dark-a0 cursor-pointer"
          />
        </div>

        {/* Header */}
        <div>
          <h3 className="text-lg font-bold text-dark-a0">
            {isEdit ? "Edit Patient" : "Add New Patient"}
          </h3>
          <p className="text-sm text-dark-a0/60">
            {isEdit ? "Update patient details." : "Enter the patient details."}
          </p>
        </div>

        <div className="space-y-4 mt-6">
          {/* Names */}
          <div className="space-y-2 md:space-y-0 md:flex gap-4">
            <div className="w-full">
              <label className="label">Firstname</label>
              <input
                {...register("firstname")}
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
                className={`input ${errors.surname ? "input-error" : ""}`}
              />
              {errors.surname && (
                <p className="error-text">{errors.surname.message}</p>
              )}
            </div>
          </div>

          {/* Age & Gender */}
          <div className="space-y-2 md:space-y-0 md:flex gap-4">
            <div className="w-full">
              <label className="label">Age</label>
              <input
                type="number"
                {...register("age", { valueAsNumber: true })}
                className={`input ${errors.age ? "input-error" : ""}`}
              />
              {errors.age && <p className="error-text">{errors.age.message}</p>}
            </div>

            <div className="w-full">
              <label className="label">Gender</label>
              <select {...register("gender")} className="input">
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
            </div>
          </div>

          {/* Ward & Bed */}
          <div className="space-y-2 md:space-y-0 md:flex gap-4">
            <div className="w-full">
              <label className="label">Ward</label>
              <input
                {...register("ward")}
                className={`input ${errors.ward ? "input-error" : ""}`}
              />
              {errors.ward && (
                <p className="error-text">{errors.ward.message}</p>
              )}
            </div>

            <div className="w-full">
              <label className="label">Bed</label>
              <input
                {...register("bed")}
                className={`input ${errors.bed ? "input-error" : ""}`}
              />
              {errors.bed && <p className="error-text">{errors.bed.message}</p>}
            </div>
          </div>

          {/* Device & Condition */}
          <div className="space-y-2 md:space-y-0 md:flex gap-4">
            <div className="w-full">
              <label className="label">Device</label>
              {loadingDevices ? (
                <select className="input" disabled>
                  <option>Loading devices...</option>
                </select>
              ) : (
                <select {...register("device")} className="input">
                  <option value="">-- Select Device --</option>
                  {availableDevices.length === 0 ? (
                    <option disabled>No devices available</option>
                  ) : (
                    availableDevices.map((d) => (
                      <option key={d.device_id} value={d.device_id}>
                        {d.device_id} — {d.name}
                      </option>
                    ))
                  )}
                </select>
              )}
            </div>

            <div className="w-full">
              <label className="label">Condition</label>
              <input
                {...register("condition")}
                className={`input ${errors.condition ? "input-error" : ""}`}
              />
              {errors.condition && (
                <p className="error-text">{errors.condition.message}</p>
              )}
            </div>
          </div>

          {/* Status */}
          <div>
            <label className="label">Status</label>
            <select {...register("status")} className="input">
              <option value="normal">Normal</option>
              <option value="warning">Warning</option>
              <option value="critical">Critical</option>
            </select>
          </div>

          {/* Notes */}
          <div>
            <label className="label">Clinical Notes</label>
            <textarea {...register("notes")} className="input resize-none" />
          </div>

          {/* Buttons */}
          <div className="flex justify-end gap-4">
            <Button type="button" variant="secondary" onClick={closeForm}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting
                ? "Saving..."
                : isEdit
                  ? "Update Patient"
                  : "Add Patient"}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default PatientForm;
