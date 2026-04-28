import { X } from "lucide-react";
import React from "react";
import Button from "./common/Button";

const PatientForm = ({ closeForm }) => {
  return (
    <div className="absolute z-50 inset-0 flex items-center justify-center bg-dark-a0/80">
      <form className="relative bg-light-a0 p-6 rounded-lg max-w-2xl max-h-[90vh] overflow-y-auto w-full">
        <div className="absolute right-6">
          <button onClick={closeForm} type="button" className="text-dark-a0/60 hover:text-dark-a0 cursor-pointer">
            <X className="size-4" />
          </button>
        </div>
        <div>
          <h3 className="text-lg text-dark-a0 font-bold">Add New Patient</h3>
          <p className="text-sm text-dark-a0/60">Enter the patient details.</p>
        </div>

        <div className="space-y-4 mt-6">
          {/* names */}
          <div className="flex items-center gap-4">
            <div className="w-full">
              <label
                htmlFor="firstname"
                className="block font-medium text-dark-a0/80"
              >
                Firstname
              </label>
              <input
                type="text"
                placeholder="Enter firstname"
                className="mt-1 block w-full px-3 py-2 border border-surface-a30 rounded-md shadow-sm placeholder:text-sm focus:outline-none focus:ring-1 focus:ring-primary-a20 focus:border-primary-a20 transition-colors"
              />
            </div>
            <div className="w-full">
              <label
                htmlFor="surname"
                className="block font-medium text-dark-a0/80"
              >
                Surname
              </label>
              <input
                type="text"
                placeholder="Enter surname"
                className="mt-1 block w-full px-3 py-2 border border-surface-a30 rounded-md shadow-sm placeholder:text-sm focus:outline-none focus:ring-1 focus:ring-primary-a20 focus:border-primary-a20 transition-colors"
              />
            </div>
          </div>

          {/* age and gender */}
          <div className="flex items-center gap-4">
            <div className="w-full">
              <label
                htmlFor="age"
                className="block font-medium text-dark-a0/80"
              >
                Age
              </label>
              <input
                type="number"
                placeholder="Enter age"
                className="mt-1 block w-full px-3 py-2 border border-surface-a30 rounded-md shadow-sm placeholder:text-sm focus:outline-none focus:ring-1 focus:ring-primary-a20 focus:border-primary-a20 transition-colors"
              />
            </div>
            <div className="w-full">
              <label
                htmlFor="gender"
                className="block font-medium text-dark-a0/80"
              >
                Gender
              </label>
              <select className="mt-1 block w-full px-3 py-2 border border-surface-a30 rounded-md shadow-sm placeholder:text-sm focus:outline-none focus:ring-1 focus:ring-primary-a20 focus:border-primary-a20 transition-colors">
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
            </div>
          </div>

          {/* ward and bed */}
          <div className="flex items-center gap-4">
            <div className="w-full">
              <label
                htmlFor="ward"
                className="block font-medium text-dark-a0/80"
              >
                Ward
              </label>
              <input
                type="text"
                placeholder="Enter ward"
                className="mt-1 block w-full px-3 py-2 border border-surface-a30 rounded-md shadow-sm placeholder:text-sm focus:outline-none focus:ring-1 focus:ring-primary-a20 focus:border-primary-a20 transition-colors"
              />
            </div>
            <div className="w-full">
              <label
                htmlFor="bed"
                className="block font-medium text-dark-a0/80"
              >
                Bed
              </label>
              <input
                type="text"
                placeholder="Enter bed"
                className="mt-1 block w-full px-3 py-2 border border-surface-a30 rounded-md shadow-sm placeholder:text-sm focus:outline-none focus:ring-1 focus:ring-primary-a20 focus:border-primary-a20 transition-colors"
              />
            </div>
          </div>

          {/* device and condition */}
          <div className="flex items-center gap-4">
            <div className="w-full">
              <label
                htmlFor="device"
                className="block font-medium text-dark-a0/80"
              >
                Assign Device
              </label>
              <select className="mt-1 block w-full px-3 py-2 border border-surface-a30 rounded-md shadow-sm placeholder:text-sm focus:outline-none focus:ring-1 focus:ring-primary-a20 focus:border-primary-a20 transition-colors">
                <option value="ESP32-A1">ESP32-A1</option>
                <option value="ESP32-A2">ESP32-A2</option>
                <option value="ESP32-A3">ESP32-A3</option>
                <option value="ESP32-A4">ESP32-A4</option>
                <option value="ESP32-A5">ESP32-A5</option>
              </select>
            </div>
            <div className="w-full">
              <label
                htmlFor="condition"
                className="block font-medium text-dark-a0/80"
              >
                condition
              </label>
              <input
                type="text"
                placeholder="e.g severe malaria"
                className="mt-1 block w-full px-3 py-2 border border-surface-a30 rounded-md shadow-sm placeholder:text-sm focus:outline-none focus:ring-1 focus:ring-primary-a20 focus:border-primary-a20 transition-colors"
              />
            </div>
          </div>

          {/* status */}
          <div className="w-full">
            <label
              htmlFor="condition"
              className="block font-medium text-dark-a0/80"
            >
              condition
            </label>
            <select className="mt-1 block w-full px-3 py-2 border border-surface-a30 rounded-md shadow-sm placeholder:text-sm focus:outline-none focus:ring-1 focus:ring-primary-a20 focus:border-primary-a20 transition-colors">
              <option value="normal">Normal</option>
              <option value="warning">Warning</option>
              <option value="critical">Critical</option>
            </select>
          </div>

          {/* notes */}
          <div className="w-full">
            <label
              htmlFor="notes"
              className="block font-medium text-dark-a0/80"
            >
              Clinical notes
            </label>
            <textarea
              name="notes"
              placeholder="Optional clinical notes"
              className="mt-1 block w-full px-3 py-2 border border-surface-a30 rounded-md shadow-sm placeholder:text-sm focus:outline-none focus:ring-1 focus:ring-primary-a20 focus:border-primary-a20 transition-colors resize-none"
            ></textarea>
          </div>

          {/* buttons */}
          <div className="flex justify-end gap-4">
            <Button size="md" variant="secondary" onClick={closeForm} type="button">Cancel</Button>
            <Button size="md" type="submit">Add Patient</Button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default PatientForm;
