import { X } from "lucide-react";
import React, { useEffect, useMemo, useRef, useState } from "react";
import Button from "./common/Button";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import useClickOutside from "../hooks/useClickOutside";
import client from "../api/client";

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
  disease: z.string().min(1, "Disease is required"),
  device_id: z.string().optional(),
  device_name: z.string().optional(),
  status: z.string(),
  notes: z.string().optional(),
});

const DEFAULT_WARDS = ["Male Ward", "Female Ward", "ICU", "Pediatrics"];
const BED_OPTIONS = Array.from({ length: 10 }, (_, index) =>
  String(index + 1).padStart(2, "0"),
);

const getDeviceName = (device) => device?.name || device?.device_name || "";
const isDeviceAssigned = (device) =>
  Boolean(
    device?.patient ||
      device?.assigned_patient ||
      device?.patient_id ||
      device?.is_paired,
  );

const PatientForm = ({ closeForm, onSubmit, patient }) => {
  const isEdit = !!patient;
  const formRef = useRef(null);
  const [devices, setDevices] = useState([]);
  const [patients, setPatients] = useState([]);
  const [devicesLoading, setDevicesLoading] = useState(true);
  const [patientsLoading, setPatientsLoading] = useState(true);
  const [submitError, setSubmitError] = useState("");

  useClickOutside(formRef, closeForm);

  const {
    register,
    handleSubmit,
    reset,
    setFocus,
    setValue,
    watch,
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
      disease: "",
      device_id: "",
      device_name: "",
      status: "stable",
      notes: "",
    },
  });

  const selectedDeviceId = watch("device_id");
  const selectedWard = watch("ward");
  const selectedBed = watch("bed");
  const selectedDevice = devices.find((d) => d.device_id === selectedDeviceId);

  const wardOptions = useMemo(() => {
    const wards = new Set(DEFAULT_WARDS);
    patients.forEach((item) => {
      if (item.ward) wards.add(item.ward);
    });
    if (patient?.ward) wards.add(patient.ward);
    return Array.from(wards).sort((a, b) => a.localeCompare(b));
  }, [patient, patients]);

  const occupiedBeds = useMemo(() => {
    const taken = new Set();
    const currentPatientId = patient?.id ? String(patient.id) : null;

    patients.forEach((item) => {
      if (!selectedWard || item.ward !== selectedWard) return;
      if (item.is_discharged || item.is_archived) return;
      if (currentPatientId && String(item.id) === currentPatientId) return;

      const bed = Number.parseInt(item.bed_number || item.bed, 10);
      if (!Number.isNaN(bed)) taken.add(String(bed).padStart(2, "0"));
    });

    return taken;
  }, [patient, patients, selectedWard]);

  const availableBeds = useMemo(() => {
    const currentBed = patient?.bed ? String(patient.bed).padStart(2, "0") : "";

    return BED_OPTIONS.filter(
      (bed) => !occupiedBeds.has(bed) || bed === currentBed,
    );
  }, [occupiedBeds, patient]);

  useEffect(() => {
    const fetchFormOptions = async () => {
      setDevicesLoading(true);
      setPatientsLoading(true);
      try {
        const [devicesRes, patientsRes] = await Promise.all([
          client.get("/devices/?page_size=500"),
          client.get("/patients/?include_archived=true&page_size=500"),
        ]);

        const deviceList = devicesRes.data?.results ?? devicesRes.data ?? [];
        const patientList = patientsRes.data?.results ?? patientsRes.data ?? [];
        const availableDevices = deviceList.filter(
          (device) =>
            device.device_id &&
            (!isDeviceAssigned(device) ||
              device.device_id === patient?.assignedDevice),
        );

        setDevices(availableDevices);
        setPatients(patientList);
      } catch {
        setDevices([]);
        setPatients([]);
      } finally {
        setDevicesLoading(false);
        setPatientsLoading(false);
      }
    };

    fetchFormOptions();
  }, [patient]);

  useEffect(() => {
    if (!patient) return;

    reset({
      firstname: patient.firstname || "",
      surname: patient.surname || "",
      age: patient.age || "",
      gender: patient.gender || "male",
      ward: patient.ward || "",
      bed: patient.bed ? String(patient.bed).padStart(2, "0") : "",
      disease: patient.disease || "",
      device_id: patient.assignedDevice || "",
      device_name: patient.deviceName || "",
      status: patient.status || "stable",
      notes: patient.notes || "",
    });
  }, [patient, reset]);

  useEffect(() => {
    setValue("device_name", getDeviceName(selectedDevice), {
      shouldDirty: false,
      shouldValidate: false,
    });
  }, [selectedDevice, setValue]);

  useEffect(() => {
    if (!selectedBed || availableBeds.includes(selectedBed)) return;
    setValue("bed", "", { shouldDirty: true, shouldValidate: true });
  }, [availableBeds, selectedBed, setValue]);

  const onError = (formErrors) => {
    const firstField = Object.keys(formErrors)[0];
    if (firstField) setFocus(firstField);
  };

  const submitHandler = async (data) => {
    setSubmitError("");
    try {
      await onSubmit(data);
    } catch (err) {
      setSubmitError(
        err?.response?.data?.detail ||
          err?.message ||
          "Unable to save patient.",
      );
    }
  };

  return (
    <div className="absolute z-50 inset-0 flex items-center justify-center bg-dark-a0/80">
      <form
        ref={formRef}
        onSubmit={handleSubmit(submitHandler, onError)}
        className="relative bg-surface-a0 p-6 rounded-lg max-w-2xl max-h-[90vh] overflow-y-auto w-full m-4"
      >
        <div className="absolute right-6">
          <X
            onClick={closeForm}
            className="size-4 text-dark-a0/60 hover:text-dark-a0 cursor-pointer"
          />
        </div>

        <div>
          <h3 className="text-lg font-bold text-dark-a0">
            {isEdit ? "Edit Patient" : "Add New Patient"}
          </h3>
          <p className="text-sm text-dark-a0/60">
            {isEdit ? "Update patient details." : "Enter the patient details."}
          </p>
        </div>

        <div className="space-y-4 mt-6">
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

          <div className="space-y-2 md:space-y-0 md:flex gap-4">
            <div className="w-full">
              <label className="label">Ward</label>
              <select
                {...register("ward")}
                disabled={patientsLoading}
                className={`input ${errors.ward ? "input-error" : ""}`}
              >
                <option value="">
                  {patientsLoading ? "Loading wards..." : "Select ward"}
                </option>
                {wardOptions.map((ward) => (
                  <option key={ward} value={ward}>
                    {ward}
                  </option>
                ))}
              </select>
              {errors.ward && (
                <p className="error-text">{errors.ward.message}</p>
              )}
            </div>
            <div className="w-full">
              <label className="label">Bed</label>
              <select
                {...register("bed")}
                disabled={!selectedWard || patientsLoading}
                className={`input ${errors.bed ? "input-error" : ""}`}
              >
                <option value="">
                  {!selectedWard
                    ? "Select ward first"
                    : patientsLoading
                      ? "Loading beds..."
                      : "Select available bed"}
                </option>
                {availableBeds.map((bed) => (
                  <option key={bed} value={bed}>
                    Bed {bed}
                  </option>
                ))}
              </select>
              {errors.bed && <p className="error-text">{errors.bed.message}</p>}
              {selectedWard && availableBeds.length === 0 && !patientsLoading && (
                <p className="mt-1 text-xs text-danger-a0">
                  No beds are available in {selectedWard}.
                </p>
              )}
            </div>
          </div>

          <div className="space-y-2 md:space-y-0 md:flex gap-4">
            <div className="w-full">
              <label className="label">
                Device ID
                <span className="ml-1 font-normal text-dark-a0/40 text-xs">
                  (optional)
                </span>
              </label>
              <select
                {...register("device_id")}
                className="input"
                disabled={devicesLoading}
              >
                <option value="">
                  {devicesLoading ? "Loading devices..." : "No device"}
                </option>
                {devices.map((device) => (
                  <option key={device.device_id} value={device.device_id}>
                    {device.device_id}
                  </option>
                ))}
              </select>
              {devices.length === 0 && !devicesLoading && (
                <p className="mt-1 text-xs text-dark-a0/40">
                  No available registered devices. Register a device first in
                  Admin / Devices.
                </p>
              )}
            </div>

            <div className="w-full">
              <label className="label">
                Device Name
                <span className="ml-1 font-normal text-dark-a0/40 text-xs">
                  (optional)
                </span>
              </label>
              <input
                {...register("device_name")}
                readOnly
                placeholder="No device selected"
                className="input"
              />
            </div>
          </div>

          <div>
            <label className="label">Disease / Diagnosis</label>
            <input
              {...register("disease")}
              placeholder="e.g. Hypertension"
              className={`input ${errors.disease ? "input-error" : ""}`}
            />
            {errors.disease && (
              <p className="error-text">{errors.disease.message}</p>
            )}
          </div>

          <div>
            <label className="label">Status</label>
            <select {...register("status")} className="input">
              <option value="stable">Stable</option>
              <option value="warning">Warning</option>
              <option value="critical">Critical</option>
            </select>
          </div>

          <div>
            <label className="label">Clinical Notes</label>
            <textarea
              {...register("notes")}
              rows={3}
              className="input resize-none"
            />
          </div>

          <div className="flex justify-end gap-4">
            {submitError && (
              <p className="mr-auto self-center text-sm text-danger-a0">
                {submitError}
              </p>
            )}
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
