import React, { useRef } from "react";
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

const PatientDetails = ({ closeForm }) => {
  const dialogRef = useRef(null);
  useClickOutside(dialogRef, closeForm);
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
              <h1 className="text-lg text-dark-a0 font-bold">Francis Mwale</h1>
              <span className="text-dark-a0/60 text-sm">
                PT-2026-001 • 54 yrs • Male
              </span>
            </div>

            <div className="mt-4 space-y-2 md:grid md:grid-cols-2">
              <div className="flex items-center gap-2 text-sm text-dark-a0/60">
                <House className="size-4 text-dark-a0/60 inline-block" />
                <p>
                  Ward: {""}
                  <span className="text-dark-a0/80 font-medium">Female</span>
                </p>
              </div>
              <div className="flex items-center gap-2 text-sm text-dark-a0/60">
                <BedDouble className="size-4 text-dark-a0/60 inline-block" />
                <p>
                  Bed: {""}
                  <span className="text-dark-a0/80 font-medium">12</span>
                </p>
              </div>
              <div className="flex items-center gap-2 text-sm text-dark-a0/60">
                <Calendar className="size-4 text-dark-a0/60 inline-block" />
                <p>
                  Admitted: {""}
                  <span className="text-dark-a0/80 font-medium">
                    2025-12-01
                  </span>
                </p>
              </div>
              <div className="flex items-center gap-2 text-sm text-dark-a0/60">
                <User className="size-4 text-dark-a0/60 inline-block" />
                <p>
                  Condition: {""}
                  <span className="text-dark-a0/80 font-medium">Diabetes</span>
                </p>
              </div>
            </div>
          </div>

          {/* Current Status */}
          <div className="py-8">
            <h2 className="text-md text-dark-a0 font-semibold mb-2">
              Current Status
            </h2>
            {/* status container */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              {/* Heart Rate */}
              <div className="flex items-center gap-2">
                <Heart className="size-4 text-primary-a20" />
                <div className="text-dark-a0/60 text-sm flex flex-col">
                  Heart Rate
                  <div className="space-x-1">
                    <span className="text-dark-a0 font-bold">72</span>
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
                    <span className="text-dark-a0 font-bold">37</span>
                    <span className="text-xs">°C</span>
                  </div>
                </div>
              </div>
              {/* Falls */}
              <div className="flex items-center gap-2">
                <Bed className="size-4 text-primary-a20" />
                <div className="text-dark-a0/60 text-sm flex flex-col">
                  Falls
                  <div className="space-x-1">
                    <span className="text-dark-a0 font-bold">Not detected</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Annoyed className="size-4 text-primary-a20" />
                <div className="text-dark-a0/60 text-sm flex flex-col">
                  Stress
                  <div className="space-x-1">
                    <span className="text-dark-a0 font-bold">Not stressed</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Clinical Notes */}
          <div>
            <h2 className="text-md text-dark-a0 font-semibold mb-2 mt-4">
              Clinical Notes
            </h2>
            <div className="bg-surface-a10 p-4 rounded-lg text-sm text-dark-a0/80">
              <p>
                Patient is stable with no signs of distress. Vital signs are
                within normal limits. No falls detected in the last 24 hours.
                Continue monitoring and provide regular care.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PatientDetails;
