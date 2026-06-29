import React, {
  useState,
  useMemo,
  useRef,
  useEffect,
  useCallback,
} from "react";
import {
  ArrowRightLeft,
  Plus,
  X,
  LoaderCircle,
  MapPin,
  MoveRight,
  AlertTriangle,
  Search,
} from "lucide-react";
import Heading from "../../components/common/Heading";
import Button from "../../components/common/Button";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import useClickOutside from "../../hooks/useClickOutside";
import client from "../../api/client";

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

// ── Patient dropdown — names only, searchable, scrollable ─────────────────────
const PatientDropdown = ({
  patients,
  loading,
  register,
  setValue,
  watch,
  error,
}) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const wrapRef = useRef(null);
  const searchRef = useRef(null);

  useClickOutside(wrapRef, () => setOpen(false));

  useEffect(() => {
    if (open) searchRef.current?.focus();
  }, [open]);

  const selectedId = watch("patient_id");
  const selectedPatient = patients.find(
    (p) => String(p.id) === String(selectedId),
  );

  const filtered = useMemo(() => {
    if (!search.trim()) return patients;
    const q = search.toLowerCase();
    return patients.filter((p) => p.fullName.toLowerCase().includes(q));
  }, [patients, search]);

  const choose = (p) => {
    setValue("patient_id", String(p.id), { shouldValidate: true });
    setSearch("");
    setOpen(false);
  };

  return (
    <div className="relative" ref={wrapRef}>
      <input type="hidden" {...register("patient_id")} />

      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`input w-full flex items-center justify-between text-left cursor-pointer ${error ? "input-error" : ""}`}
      >
        <span className={selectedPatient ? "text-dark-a0" : "text-dark-a0/40"}>
          {loading
            ? "Loading patients…"
            : selectedPatient
              ? selectedPatient.fullName
              : "Select patient…"}
        </span>
        <svg
          className={`size-4 text-dark-a0/40 shrink-0 transition-transform duration-150 ${open ? "rotate-180" : ""}`}
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fillRule="evenodd"
            d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
            clipRule="evenodd"
          />
        </svg>
      </button>

      {open && (
        <div className="absolute z-50 mt-1 w-full bg-light-a0 border border-surface-a30 rounded-lg shadow-lg overflow-hidden">
          <div className="p-2 border-b border-surface-a30">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-dark-a0/40 pointer-events-none" />
              <input
                ref={searchRef}
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search name…"
                className="input pl-8 py-1.5 text-sm w-full"
              />
            </div>
          </div>
          <ul className="max-h-48 overflow-y-auto divide-y divide-surface-a30/50">
            {loading ? (
              <li className="px-4 py-3 text-sm text-dark-a0/40">Loading…</li>
            ) : filtered.length === 0 ? (
              <li className="px-4 py-3 text-sm text-dark-a0/40">
                No patients found
              </li>
            ) : (
              filtered.map((p) => (
                <li
                  key={p.id}
                  onClick={() => choose(p)}
                  className={`px-4 py-2.5 text-sm cursor-pointer transition-colors hover:bg-primary-a20/10 ${
                    String(p.id) === String(selectedId)
                      ? "bg-primary-a20/20 font-medium text-primary-a20"
                      : "text-dark-a0"
                  }`}
                >
                  {p.fullName}
                </li>
              ))
            )}
          </ul>
        </div>
      )}

      {error && <p className="error-text mt-1">{error.message}</p>}
    </div>
  );
};

// ── Normalize a raw API transfer record ───────────────────────────────────────
const normalizeTransfer = (t) => ({
  id: t.id,
  patient_name: t.patient_name || `Patient ${t.patient}`,
  patient_id: t.patient_id_str || "", // not in serializer — omit gracefully
  from_ward: t.from_ward || "—",
  from_bed: t.from_bed || "—",
  to_ward: t.to_ward || "—",
  to_bed: t.to_bed || "—",
  reason: t.reason || "other",
  reason_label: t.reason_display || reasonLabel(t.reason),
  transferred_by: t.transferred_by_name || "—",
  timestamp: t.transferred_at
    ? new Date(t.transferred_at).toLocaleString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "—",
  notes: t.notes || "",
});

// ── Transfer Modal ────────────────────────────────────────────────────────────
const TransferModal = ({
  patients,
  patientsLoading,
  onClose,
  onTransferred,
}) => {
  const formRef = useRef(null);
  useClickOutside(formRef, onClose);

  const [apiError, setApiError] = useState("");

  const {
    register,
    handleSubmit,
    watch,
    setValue,
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

  const selectedId = watch("patient_id");
  const toWard = watch("to_ward");
  const selectedPatient = patients.find(
    (p) => String(p.id) === String(selectedId),
  );

  const submitHandler = async (data) => {
    setApiError("");
    try {
      const { data: transfer } = await client.post(
        `/patients/${data.patient_id}/transfer/`,
        {
          to_ward: data.to_ward.trim(),
          to_bed: data.to_bed?.trim() || "",
          reason: data.reason,
          notes: data.notes || "",
        },
      );
      onTransferred(normalizeTransfer(transfer));
      onClose();
    } catch (err) {
      // Backend returns { error: "..." } for 400 validation errors
      const msg =
        err?.response?.data?.error ||
        err?.response?.data?.detail ||
        "Transfer failed. Please try again.";
      setApiError(msg);
    }
  };

  return (
    <div className="absolute z-50 inset-0 flex items-center justify-center bg-dark-a0/80">
      <form
        ref={formRef}
        onSubmit={handleSubmit(submitHandler)}
        className="relative bg-light-a0 p-6 rounded-lg max-w-2xl max-h-[90vh] overflow-y-auto w-full m-4"
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-5 top-5 text-dark-a0/40 hover:text-dark-a0 cursor-pointer"
        >
          <X className="size-4" />
        </button>

        <h3 className="text-lg font-bold text-dark-a0">Transfer Patient</h3>
        <p className="text-sm text-dark-a0/60">
          Move a patient to a different ward and record the reason.
        </p>

        <div className="space-y-4 mt-6">
          {/* Patient */}
          <div>
            <label className="label">Patient</label>
            <PatientDropdown
              patients={patients}
              loading={patientsLoading}
              register={register}
              setValue={setValue}
              watch={watch}
              error={errors.patient_id}
            />

            {/* Current location hint */}
            {selectedPatient && (
              <div className="mt-2 flex items-center gap-2 text-xs text-dark-a0/60 bg-surface-a10 px-3 py-2 rounded-md">
                <MapPin className="size-3.5 text-primary-a20 shrink-0" />
                Currently in{" "}
                <span className="font-semibold text-dark-a0">
                  {selectedPatient.ward}, Bed {selectedPatient.bed}
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
                className={`input ${errors.to_ward || apiError ? "input-error" : ""}`}
              />
              {errors.to_ward && (
                <p className="error-text">{errors.to_ward.message}</p>
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

          {/* Transfer preview */}
          {selectedPatient && toWard && (
            <div className="flex items-center gap-3 bg-surface-a10 rounded-md px-4 py-3 text-sm">
              <span className="font-medium text-dark-a0">
                {selectedPatient.ward}
              </span>
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
              <option value="">Select reason…</option>
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
              placeholder="Any additional context for the transfer…"
              className="input resize-none"
            />
          </div>

          {/* API error */}
          {apiError && (
            <div className="flex items-center gap-2 bg-danger-a20 border border-danger-a10/40 rounded-md px-3 py-2">
              <AlertTriangle className="size-4 text-danger-a10 shrink-0" />
              <p className="text-sm text-danger-a0">{apiError}</p>
            </div>
          )}

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
                  <LoaderCircle className="size-4 animate-spin" /> Transferring…
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
  const [patients, setPatients] = useState([]);
  const [patientsLoading, setPatientsLoading] = useState(true);
  const [transfers, setTransfers] = useState([]);
  const [transfersLoading, setTransfersLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState("");
  const [fromWardFilter, setFromWardFilter] = useState("");
  const [toWardFilter, setToWardFilter] = useState("");

  // ── Fetch patients ────────────────────────────────────────────────────────
  const fetchPatients = useCallback(async () => {
    setPatientsLoading(true);
    try {
      const { data } = await client.get(
        "/patients/?is_discharged=false&page_size=200",
      );
      const list = data?.results ?? data ?? [];
      setPatients(
        list.map((p) => ({
          id: p.id,
          fullName: `${p.first_name} ${p.last_name}`,
          ward: p.ward || "—",
          bed: p.bed_number || "—",
        })),
      );
    } catch {
      setLoadError("Could not load patients.");
    } finally {
      setPatientsLoading(false);
    }
  }, []);

  // ── Fetch transfer history ────────────────────────────────────────────────
  const fetchTransfers = useCallback(async () => {
    setTransfersLoading(true);
    try {
      const { data } = await client.get("/transfers/?page_size=100");
      const list = data?.results ?? data ?? [];
      setTransfers(list.map(normalizeTransfer));
    } catch {
      setLoadError("Could not load transfer history.");
    } finally {
      setTransfersLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPatients();
    fetchTransfers();
  }, [fetchPatients, fetchTransfers]);

  // ── Filters ────────────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return transfers.filter((t) => {
      const matchSearch = !q || t.patient_name.toLowerCase().includes(q);
      const matchFrom =
        !fromWardFilter ||
        t.from_ward.toLowerCase().includes(fromWardFilter.toLowerCase());
      const matchTo =
        !toWardFilter ||
        t.to_ward.toLowerCase().includes(toWardFilter.toLowerCase());
      return matchSearch && matchFrom && matchTo;
    });
  }, [transfers, search, fromWardFilter, toWardFilter]);

  const handleTransferred = (t) => {
    setTransfers((prev) => [t, ...prev]);
    // Also update the patient's ward in the local patients list so the hint stays accurate
    setPatients((prev) =>
      prev.map((p) =>
        String(p.id) === String(t.patient_id)
          ? { ...p, ward: t.to_ward, bed: t.to_bed }
          : p,
      ),
    );
  };

  const loading = transfersLoading;

  return (
    <div className="space-y-6">
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

      {loadError && (
        <div className="flex items-center gap-3 rounded-lg border border-danger-a10/40 bg-danger-a20 px-4 py-3">
          <AlertTriangle className="size-5 shrink-0 text-danger-a10" />
          <p className="text-sm font-medium text-danger-a0">{loadError}</p>
        </div>
      )}

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          {
            label: "Total Transfers",
            value: transfers.length,
            color: "text-primary-a20",
          },
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
            value: transfers.filter((t) => t.reason === "specialist_care")
              .length,
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
          placeholder="Search by patient name…"
          className="input sm:w-64"
        />
        <input
          type="text"
          value={fromWardFilter}
          onChange={(e) => setFromWardFilter(e.target.value)}
          placeholder="Filter by from ward…"
          className="input sm:w-44"
        />
        <input
          type="text"
          value={toWardFilter}
          onChange={(e) => setToWardFilter(e.target.value)}
          placeholder="Filter by to ward…"
          className="input sm:w-44"
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
          {loading ? (
            <div className="flex items-center justify-center gap-2 py-16 text-sm text-dark-a0/50">
              <LoaderCircle className="size-4 animate-spin" /> Loading transfer
              history…
            </div>
          ) : (
            <table className="min-w-full divide-y divide-surface-a30">
              <thead className="bg-surface-a30">
                <tr>
                  {[
                    "Patient",
                    "From",
                    "",
                    "To",
                    "Reason",
                    "Transferred By",
                    "Notes",
                  ].map((h, i) => (
                    <th
                      key={i}
                      className="px-4 py-3 text-left text-xs font-bold text-dark-a0 uppercase tracking-wider"
                    >
                      {h}
                    </th>
                  ))}
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
                      <td className="px-4 py-3 whitespace-nowrap">
                        <p className="font-medium text-dark-a0">
                          {t.patient_name}
                        </p>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <p className="font-medium text-dark-a0">
                          {t.from_ward}
                        </p>
                        <p className="text-xs text-dark-a0/50">{t.from_bed}</p>
                      </td>
                      <td className="px-2 py-3">
                        <MoveRight className="size-4 text-primary-a20" />
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <p className="font-medium text-primary-a20">
                          {t.to_ward}
                        </p>
                        <p className="text-xs text-dark-a0/50">{t.to_bed}</p>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span
                          className={`text-xs font-medium px-2 py-1 rounded-full ${REASON_STYLES[t.reason] ?? ""}`}
                        >
                          {t.reason_label}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <p className="text-dark-a0">{t.transferred_by}</p>
                        <p className="text-xs text-dark-a0/50">{t.timestamp}</p>
                      </td>
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
          )}
        </div>
      </div>

      {showModal && (
        <TransferModal
          patients={patients}
          patientsLoading={patientsLoading}
          onClose={() => setShowModal(false)}
          onTransferred={handleTransferred}
        />
      )}
    </div>
  );
};

export default WardTransfer;
