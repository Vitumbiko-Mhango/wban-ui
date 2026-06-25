import React, { useState, useMemo, useRef } from "react";
import {
  ArrowRightLeft,
  Plus,
  X,
  LoaderCircle,
  MapPin,
  MoveRight,
} from "lucide-react";
import Heading from "../../components/common/Heading";
import Button from "../../components/common/Button";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import useClickOutside from "../../hooks/useClickOutside";

// ── Dummy data ────────────────────────────────────────────────────────────────
const PATIENTS = [
  { id: 1, name: "Francis Mwale", ward: "Cardiology", bed: "B12", patient_id: "PT-2026-001" },
  { id: 2, name: "Jane Smith", ward: "Neurology", bed: "B15", patient_id: "PT-2026-002" },
  { id: 3, name: "Michael Johnson", ward: "Orthopedics", bed: "B20", patient_id: "PT-2026-003" },
  { id: 4, name: "Chisomo Banda", ward: "Ward 3", bed: "Bed 12", patient_id: "PT-2026-004" },
  { id: 5, name: "Kondwani Mwale", ward: "ICU", bed: "ICU-02", patient_id: "PT-2026-005" },
];

const INITIAL_TRANSFERS = [
  {
    id: 1,
    patient_name: "Kondwani Mwale",
    patient_id: "PT-2026-005",
    from_ward: "Ward 2",
    from_bed: "Bed 8",
    to_ward: "ICU",
    to_bed: "ICU-02",
    reason: "deterioration",
    transferred_by: "Dr. Phiri",
    timestamp: "2026-06-20 · 11:42 PM",
    notes: "Patient developed respiratory distress — transferred for closer monitoring.",
  },
  {
    id: 2,
    patient_name: "Francis Mwale",
    patient_id: "PT-2026-001",
    from_ward: "General",
    from_bed: "G04",
    to_ward: "Cardiology",
    to_bed: "B12",
    reason: "specialist_care",
    transferred_by: "Vitumbiko Mhango",
    timestamp: "2026-06-18 · 09:15 AM",
    notes: "Referred for cardiology review following abnormal ECG findings.",
  },
  {
    id: 3,
    patient_name: "Jane Smith",
    patient_id: "PT-2026-002",
    from_ward: "General",
    from_bed: "G11",
    to_ward: "Neurology",
    to_bed: "B15",
    reason: "specialist_care",
    transferred_by: "Grace Phiri",
    timestamp: "2026-06-17 · 02:30 PM",
    notes: "",
  },
  {
    id: 4,
    patient_name: "Chisomo Banda",
    patient_id: "PT-2026-004",
    from_ward: "Ward 1",
    from_bed: "Bed 3",
    to_ward: "Ward 3",
    to_bed: "Bed 12",
    reason: "bed_availability",
    transferred_by: "Tadala Chirwa",
    timestamp: "2026-06-15 · 08:00 AM",
    notes: "Moved to free up side-room in Ward 1.",
  },
  {
    id: 5,
    patient_name: "Michael Johnson",
    patient_id: "PT-2026-003",
    from_ward: "Surgery",
    from_bed: "S02",
    to_ward: "Orthopedics",
    to_bed: "B20",
    reason: "post_surgery",
    transferred_by: "Dr. Nkhoma",
    timestamp: "2026-06-14 · 04:45 PM",
    notes: "Post-op recovery transfer.",
  },
];

// ── Reason config ─────────────────────────────────────────────────────────────
const REASONS = [
  { value: "deterioration", label: "Deterioration" },
  { value: "improvement", label: "Improvement" },
  { value: "bed_availability", label: "Bed Availability" },
  { value: "specialist_care", label: "Specialist Care" },
  { value: "post_surgery", label: "Post Surgery" },
  { value: "other", label: "Other" },
];

const REASON_STYLES = {
  deterioration: "bg-danger-a20 text-danger-a0",
  improvement: "bg-success-a20 text-success-a0",
  bed_availability: "bg-blue-100 text-blue-700",
  specialist_care: "bg-purple-100 text-purple-700",
  post_surgery: "bg-orange-100 text-orange-700",
  other: "bg-surface-a20 text-dark-a0/60",
};

const reasonLabel = (value) =>
  REASONS.find((r) => r.value === value)?.label ?? value;

// ── Zod schema ────────────────────────────────────────────────────────────────
const schema = z.object({
  patient_id: z.string().min(1, "Please select a patient"),
  to_ward: z.string().min(1, "Destination ward is required"),
  to_bed: z.string().optional(),
  reason: z.string().min(1, "Please select a reason"),
  notes: z.string().optional(),
});

// ── Transfer Modal ────────────────────────────────────────────────────────────
const TransferModal = ({ onClose, onSubmit }) => {
  const formRef = useRef(null);
  useClickOutside(formRef, onClose);
  const [sameWardError, setSameWardError] = useState("");

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      patient_id: "",
      to_ward: "",
      to_bed: "",
      reason: "",
      notes: "",
    },
  });

  const selectedPatientId = watch("patient_id");
  const toWard = watch("to_ward");
  const selectedPatient = PATIENTS.find((p) => p.id === Number(selectedPatientId));

  const submitHandler = async (data) => {
    setSameWardError("");
    const patient = PATIENTS.find((p) => p.id === Number(data.patient_id));

    // Simulate same-ward 400 error from backend
    if (data.to_ward.trim().toLowerCase() === patient.ward.toLowerCase()) {
      setSameWardError(`Patient is already in ${patient.ward}.`);
      return;
    }

    await new Promise((res) => setTimeout(res, 800));

    onSubmit({
      id: Date.now(),
      patient_name: patient.name,
      patient_id: patient.patient_id,
      from_ward: patient.ward,
      from_bed: patient.bed,
      to_ward: data.to_ward.trim(),
      to_bed: data.to_bed?.trim() || "—",
      reason: data.reason,
      transferred_by: "Vitumbiko Mhango",
      timestamp: new Date().toLocaleString("en-GB", {
        dateStyle: "medium",
        timeStyle: "short",
      }),
      notes: data.notes || "",
    });
    onClose();
  };

  return (
    <div className="absolute z-50 inset-0 flex items-center justify-center bg-dark-a0/80">
      <form
        ref={formRef}
        onSubmit={handleSubmit(submitHandler)}
        className="relative bg-light-a0 p-6 rounded-lg max-w-2xl max-h-[90vh] overflow-y-auto w-full m-4"
      >
        {/* Close */}
        <button
          type="button"
          onClick={onClose}
          className="absolute right-5 top-5 text-dark-a0/40 hover:text-dark-a0 cursor-pointer"
        >
          <X className="size-4" />
        </button>

        {/* Header */}
        <div>
          <h3 className="text-lg font-bold text-dark-a0">Transfer Patient</h3>
          <p className="text-sm text-dark-a0/60">
            Move a patient to a different ward and record the reason.
          </p>
        </div>

        <div className="space-y-4 mt-6">
          {/* Patient dropdown */}
          <div>
            <label className="label">Patient</label>
            <select
              {...register("patient_id")}
              className={`input ${errors.patient_id ? "input-error" : ""}`}
            >
              <option value="">Select patient...</option>
              {PATIENTS.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.patient_id})
                </option>
              ))}
            </select>
            {errors.patient_id && (
              <p className="error-text">{errors.patient_id.message}</p>
            )}

            {/* Current ward hint */}
            {selectedPatient && (
              <div className="mt-2 flex items-center gap-2 text-xs text-dark-a0/60 bg-surface-a10 px-3 py-2 rounded-md">
                <MapPin className="size-3.5 text-primary-a20 shrink-0" />
                Currently in{" "}
                <span className="font-semibold text-dark-a0">
                  {selectedPatient.ward}, {selectedPatient.bed}
                </span>
              </div>
            )}
          </div>

          {/* To Ward + To Bed */}
          <div className="space-y-2 md:space-y-0 md:flex gap-4">
            <div className="w-full">
              <label className="label">To Ward</label>
              <input
                {...register("to_ward")}
                placeholder="e.g. ICU"
                className={`input ${errors.to_ward || sameWardError ? "input-error" : ""}`}
              />
              {errors.to_ward && (
                <p className="error-text">{errors.to_ward.message}</p>
              )}
              {sameWardError && (
                <p className="error-text">{sameWardError}</p>
              )}
            </div>
            <div className="w-full">
              <label className="label">
                To Bed{" "}
                <span className="text-dark-a0/40 font-normal">(optional)</span>
              </label>
              <input
                {...register("to_bed")}
                placeholder="e.g. ICU-03"
                className="input"
              />
            </div>
          </div>

          {/* Transfer preview arrow */}
          {selectedPatient && toWard && (
            <div className="flex items-center gap-3 bg-surface-a10 rounded-md px-4 py-3 text-sm">
              <span className="font-medium text-dark-a0">{selectedPatient.ward}</span>
              <MoveRight className="size-4 text-primary-a20 shrink-0" />
              <span className="font-medium text-primary-a20">{toWard}</span>
            </div>
          )}

          {/* Reason */}
          <div>
            <label className="label">Reason</label>
            <select
              {...register("reason")}
              className={`input ${errors.reason ? "input-error" : ""}`}
            >
              <option value="">Select reason...</option>
              {REASONS.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
            {errors.reason && (
              <p className="error-text">{errors.reason.message}</p>
            )}
          </div>

          {/* Notes */}
          <div>
            <label className="label">
              Notes{" "}
              <span className="text-dark-a0/40 font-normal">(optional)</span>
            </label>
            <textarea
              {...register("notes")}
              rows={3}
              placeholder="Any additional context for the transfer..."
              className="input resize-none"
            />
          </div>

          {/* Buttons */}
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              iconLeft={isSubmitting ? undefined : ArrowRightLeft}
            >
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <LoaderCircle className="size-4 animate-spin" />
                  Transferring...
                </span>
              ) : (
                "Transfer Patient"
              )}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
};

// ── Main page ─────────────────────────────────────────────────────────────────
const WardTransfer = () => {
  const [transfers, setTransfers] = useState(INITIAL_TRANSFERS);
  const [showModal, setShowModal] = useState(false);
  const [fromWardFilter, setFromWardFilter] = useState("");
  const [toWardFilter, setToWardFilter] = useState("");
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return transfers.filter((t) => {
      const matchSearch =
        !q ||
        t.patient_name.toLowerCase().includes(q) ||
        t.from_ward.toLowerCase().includes(q) ||
        t.to_ward.toLowerCase().includes(q);
      const matchFrom =
        !fromWardFilter ||
        t.from_ward.toLowerCase().includes(fromWardFilter.toLowerCase());
      const matchTo =
        !toWardFilter ||
        t.to_ward.toLowerCase().includes(toWardFilter.toLowerCase());
      return matchSearch && matchFrom && matchTo;
    });
  }, [transfers, search, fromWardFilter, toWardFilter]);

  const handleTransfer = (newTransfer) => {
    setTransfers((prev) => [newTransfer, ...prev]);
  };

  return (
    <div className="space-y-6">
      {/* Heading */}
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
        <Heading
          title="Ward Transfers"
          subtitle="Transfer patients between wards and view transfer history"
        />
        <Button
          variant="primary"
          size="md"
          iconLeft={Plus}
          onClick={() => setShowModal(true)}
        >
          Transfer Patient
        </Button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Total Transfers", value: transfers.length, color: "text-primary-a20" },
          {
            label: "Deterioration",
            value: transfers.filter((t) => t.reason === "deterioration").length,
            color: "text-danger-a10",
          },
          {
            label: "Improvement",
            value: transfers.filter((t) => t.reason === "improvement").length,
            color: "text-success-a10",
          },
          {
            label: "Specialist Care",
            value: transfers.filter((t) => t.reason === "specialist_care").length,
            color: "text-purple-600",
          },
        ].map((s) => (
          <div key={s.label} className="bg-surface-a20 rounded-lg p-4">
            <p className="text-xs text-dark-a0/50 mb-1">{s.label}</p>
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Filter bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by patient name..."
          className="input sm:w-64"
        />
        <input
          type="text"
          value={fromWardFilter}
          onChange={(e) => setFromWardFilter(e.target.value)}
          placeholder="Filter by from ward..."
          className="input sm:w-48"
        />
        <input
          type="text"
          value={toWardFilter}
          onChange={(e) => setToWardFilter(e.target.value)}
          placeholder="Filter by to ward..."
          className="input sm:w-48"
        />
        {(search || fromWardFilter || toWardFilter) && (
          <Button
            variant="outline"
            size="md"
            onClick={() => {
              setSearch("");
              setFromWardFilter("");
              setToWardFilter("");
            }}
          >
            Clear
          </Button>
        )}
      </div>

      {/* Transfer history table */}
      <div className="border border-surface-a30 rounded-lg overflow-hidden shadow-sm">
        <div className="p-4 bg-surface-a10 border-b border-surface-a30">
          <h2 className="font-medium text-dark-a0">
            Transfer History
            <span className="ml-2 text-sm font-normal text-dark-a0/50">
              ({filtered.length} record{filtered.length !== 1 ? "s" : ""})
            </span>
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-surface-a30">
            <thead className="bg-surface-a30">
              <tr>
                {["Patient", "From", "", "To", "Reason", "Transferred By", "Notes"].map(
                  (h, i) => (
                    <th
                      key={i}
                      className="px-4 py-3 text-left text-xs font-bold text-dark-a0 uppercase tracking-wider"
                    >
                      {h}
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-a30 bg-white">
              {filtered.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-6 py-10 text-center text-sm text-dark-a0/40"
                  >
                    No transfer records found.
                  </td>
                </tr>
              ) : (
                filtered.map((t) => (
                  <tr
                    key={t.id}
                    className="text-sm hover:bg-surface-a10 transition-colors"
                  >
                    {/* Patient */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <p className="font-medium text-dark-a0">{t.patient_name}</p>
                      <p className="text-xs text-dark-a0/50">{t.patient_id}</p>
                    </td>

                    {/* From */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <p className="font-medium text-dark-a0">{t.from_ward}</p>
                      <p className="text-xs text-dark-a0/50">{t.from_bed}</p>
                    </td>

                    {/* Arrow */}
                    <td className="px-2 py-3">
                      <MoveRight className="size-4 text-primary-a20" />
                    </td>

                    {/* To */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <p className="font-medium text-primary-a20">{t.to_ward}</p>
                      <p className="text-xs text-dark-a0/50">{t.to_bed}</p>
                    </td>

                    {/* Reason badge */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span
                        className={`text-xs font-medium px-2 py-1 rounded-full ${
                          REASON_STYLES[t.reason]
                        }`}
                      >
                        {reasonLabel(t.reason)}
                      </span>
                    </td>

                    {/* Transferred by + time */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <p className="text-dark-a0">{t.transferred_by}</p>
                      <p className="text-xs text-dark-a0/50">{t.timestamp}</p>
                    </td>

                    {/* Notes */}
                    <td className="px-4 py-3 max-w-xs">
                      <p className="text-dark-a0/60 text-xs truncate">
                        {t.notes || "—"}
                      </p>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <TransferModal
          onClose={() => setShowModal(false)}
          onSubmit={handleTransfer}
        />
      )}
    </div>
  );
};

export default WardTransfer;
