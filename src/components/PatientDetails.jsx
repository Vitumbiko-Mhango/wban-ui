import React, { useEffect, useRef, useState } from "react";
import {
  Annoyed,
  Bed,
  BedDouble,
  Calendar,
  Heart,
  House,
  Thermometer,
  User,
  X,
} from "lucide-react";
import useClickOutside from "../hooks/useClickOutside";
import client from "../api/client";

const PatientDetails = ({ closeForm, patient }) => {
  const dialogRef = useRef(null);
  const [vitals, setVitals] = useState(null);
  const [loadingVitals, setLoadingVitals] = useState(true);

  useClickOutside(dialogRef, closeForm);

  // Fetch latest vitals from InfluxDB for this patient
  useEffect(() => {
    if (!patient?.patient_id) return;

    const fetchVitals = async () => {
      try {
        // Extract numeric part: PT-2026-005 → 005
        // const shortId = patient.patient_id;
        const res = await client.get(
          `/influx/readings/?patient_id=${patient.patient_id}&start=-24h&limit=100`,
        );
        const data = res.data;
        if (data.readings && data.readings.length > 0) {
          // Get the most recent reading
          setVitals(data.readings[data.readings.length - 1]);
        }
      } catch (err) {
        console.error("Failed to fetch vitals:", err);
      } finally {
        setLoadingVitals(false);
      }
    };

    fetchVitals();
  }, [patient]);

  if (!patient) return null;

  // Handle both normalized (firstname/surname) and raw (first_name/last_name) formats
  const fullName =
    patient.firstname && patient.surname
      ? `${patient.firstname} ${patient.surname}`
      : `${patient.first_name || ""} ${patient.last_name || ""}`.trim() || "—";

  const bedNumber = patient.bed || patient.bed_number || "—";
  const ward = patient.ward || "—";
  const condition = patient.condition || patient.status || "—";
  const disease = patient.disease || patient.diagnosis || "—";
  const assignedDevice =
    patient.assignedDevice || patient.assigned_device || "—";
  const admittedDate = patient.created_at
    ? new Date(patient.created_at).toLocaleDateString()
    : "—";

  return (
    <div className="absolute z-50 inset-0 flex items-center justify-center bg-dark-a0/80">
      <div
        ref={dialogRef}
        className="relative bg-light-a0 p-6 m-4 rounded-lg max-w-2xl max-h-[90vh] overflow-y-auto w-full"
      >
        <div className="absolute right-6">
          <button
            onClick={closeForm}
            type="button"
            className="text-dark-a0/60 hover:text-dark-a0 cursor-pointer"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="divide-y-2 divide-dark-a0/10">
          {/* Patient Information */}
          <div className="pb-4">
            <div>
              <h1 className="text-lg text-dark-a0 font-bold">{fullName}</h1>
              <span className="text-dark-a0/60 text-sm">
                {patient.patient_id} • {patient.age} yrs • {patient.gender}
              </span>
            </div>

            <div className="mt-4 space-y-2 md:grid md:grid-cols-2">
              <div className="flex items-center gap-2 text-sm text-dark-a0/60">
                <House className="size-4 text-dark-a0/60 inline-block" />
                <p>
                  Ward:{" "}
                  <span className="text-dark-a0/80 font-medium">{ward}</span>
                </p>
              </div>
              <div className="flex items-center gap-2 text-sm text-dark-a0/60">
                <BedDouble className="size-4 text-dark-a0/60 inline-block" />
                <p>
                  Bed:{" "}
                  <span className="text-dark-a0/80 font-medium">
                    {bedNumber}
                  </span>
                </p>
              </div>
              <div className="flex items-center gap-2 text-sm text-dark-a0/60">
                <Calendar className="size-4 text-dark-a0/60 inline-block" />
                <p>
                  Admitted:{" "}
                  <span className="text-dark-a0/80 font-medium">
                    {admittedDate}
                  </span>
                </p>
              </div>
              <div className="flex items-center gap-2 text-sm text-dark-a0/60">
                <User className="size-4 text-dark-a0/60 inline-block" />
                <p>
                  Condition:{" "}
                  <span className="text-dark-a0/80 font-medium capitalize">
                    {condition}
                  </span>
                </p>
              </div>
              <div className="flex items-center gap-2 text-sm text-dark-a0/60">
                <User className="size-4 text-dark-a0/60 inline-block" />
                <p>
                  Disease:{" "}
                  <span className="text-dark-a0/80 font-medium">
                    {disease}
                  </span>
                </p>
              </div>
              <div className="flex items-center gap-2 text-sm text-dark-a0/60">
                <User className="size-4 text-dark-a0/60 inline-block" />
                <p>
                  Device:{" "}
                  <span className="text-dark-a0/80 font-medium">
                    {assignedDevice}
                  </span>
                </p>
              </div>
            </div>
          </div>

          {/* Current Status */}
          <div className="py-8">
            <h2 className="text-md text-dark-a0 font-semibold mb-2">
              Current Status
            </h2>
            {loadingVitals ? (
              <p className="text-sm text-dark-a0/60">Loading vitals...</p>
            ) : !vitals ? (
              <p className="text-sm text-dark-a0/60">
                No recent vitals available.
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                {/* Heart Rate */}
                <div className="flex items-center gap-2">
                  <Heart className="size-4 text-primary-a20" />
                  <div className="text-dark-a0/60 text-sm flex flex-col">
                    Heart Rate
                    <div className="space-x-1">
                      <span className="text-dark-a0 font-bold">
                        {vitals.heart_rate ?? "—"}
                      </span>
                      <span className="text-xs">bpm</span>
                    </div>
                  </div>
                </div>
                {/* Temperature */}
                <div className="flex items-center gap-2">
                  <Thermometer className="size-4 text-primary-a20" />
                  <div className="text-dark-a0/60 text-sm flex flex-col">
                    Temp
                    <div className="space-x-1">
                      <span className="text-dark-a0 font-bold">
                        {vitals.temperature ?? "—"}
                      </span>
                      <span className="text-xs">°C</span>
                    </div>
                  </div>
                </div>
                {/* Falls */}
                <div className="flex items-center gap-2">
                  <Bed className="size-4 text-primary-a20" />
                  <div className="text-dark-a0/60 text-sm flex flex-col">
                    Falls
                    <span className="text-dark-a0 font-bold">
                      {vitals.fall_detected > 0 ? "Detected" : "Not detected"}
                    </span>
                  </div>
                </div>
                {/* Stress */}
                <div className="flex items-center gap-2">
                  <Annoyed className="size-4 text-primary-a20" />
                  <div className="text-dark-a0/60 text-sm flex flex-col">
                    Stress
                    <span className="text-dark-a0 font-bold">
                      {vitals.stress_index > 0.5 ? "Stressed" : "Not stressed"}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Clinical Notes */}
          <div>
            <h2 className="text-md text-dark-a0 font-semibold mb-2 mt-4">
              Clinical Notes
            </h2>
            <div className="bg-surface-a10 p-4 rounded-lg text-sm text-dark-a0/80">
              <p>
                {patient.discharge_notes ||
                  patient.notes ||
                  "No clinical notes available."}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PatientDetails;
