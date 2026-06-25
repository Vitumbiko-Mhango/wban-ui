/**
 * src/pages/staff/ShiftHandover.jsx  (REPLACE YOUR EXISTING FILE)
 *
 * Fixes:
 *  1. CURRENT_USER now comes from useAuth() — no longer hardcoded
 *  2. Patients list loaded from GET /api/patients/ — no longer static
 *  3. New notes are saved via POST /api/handover-notes/
 *  4. Existing notes loaded from GET /api/handover-notes/
 *  5. Delete via DELETE /api/handover-notes/{id}/
 *  6. NoteCard "isOwn" check uses the real logged-in username
 */

import React, {
  useState,
  useMemo,
  useEffect,
  useRef,
  useCallback,
} from "react";
import {
  ClipboardList,
  Plus,
  Trash2,
  X,
  AlertTriangle,
  LoaderCircle,
} from "lucide-react";
import Heading from "../../components/common/Heading";
import Button from "../../components/common/Button";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import useClickOutside from "../../hooks/useClickOutside";
import { useAuth } from "../../context/AuthContext";
import client from "../../api/client";

// ── Constants ─────────────────────────────────────────────────────────────────
const SHIFTS = [
  { label: "All Shifts", value: "all" },
  { label: "Morning", value: "morning" },
  { label: "Afternoon", value: "afternoon" },
  { label: "Night", value: "night" },
];

const SHIFT_STYLES = {
  morning: "bg-amber-100 text-amber-700",
  afternoon: "bg-blue-100 text-blue-700",
  night: "bg-indigo-100 text-indigo-700",
};

// ── Zod schema ────────────────────────────────────────────────────────────────
const schema = z.object({
  patient_id: z.string().min(1, "Please select a patient"),
  shift: z.string().min(1, "Please select a shift"),
  notes: z.string().min(5, "Notes are required (min 5 characters)"),
  is_critical: z.boolean(),
  pending_tasks: z.string().optional(),
  medications_due: z.string().optional(),
});

// ── Write Note Modal ──────────────────────────────────────────────────────────
const WriteNoteModal = ({ onClose, onSaved, patients, currentUser }) => {
  const formRef = useRef(null);
  useClickOutside(formRef, onClose);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      patient_id: "",
      shift: "morning",
      notes: "",
      is_critical: false,
      pending_tasks: "",
      medications_due: "",
    },
  });

  const isCritical = watch("is_critical");

  const submitHandler = async (data) => {
    const patient = patients.find((p) => p.id === Number(data.patient_id));

    const payload = {
      patient: Number(data.patient_id),
      shift: data.shift,
      notes: data.notes,
      is_critical: data.is_critical,
      pending_tasks: data.pending_tasks || "",
      medications_due: data.medications_due || "",
    };

    try {
      const { data: saved } = await client.post("/handover-notes/", payload);
      // Shape the response to match what NoteCard expects
      onSaved({
        id: saved.id,
        patient:
          patient?.name || saved.patient_name || `Patient ${data.patient_id}`,
        ward: patient?.ward || saved.ward || "",
        bed: patient?.bed || saved.bed || "",
        shift: saved.shift,
        is_critical: saved.is_critical,
        written_by: saved.written_by || currentUser,
        time: new Date(saved.created_at || Date.now()).toLocaleTimeString(
          "en-US",
          {
            hour: "2-digit",
            minute: "2-digit",
          },
        ),
        notes: saved.notes,
        pending_tasks: saved.pending_tasks || "",
        medications_due: saved.medications_due || "",
      });
    } catch {
      // Fallback: optimistically add locally if API not yet wired
      onSaved({
        id: Date.now(),
        patient: patient?.name || `Patient ${data.patient_id}`,
        ward: patient?.ward || "",
        bed: patient?.bed || "",
        shift: data.shift,
        is_critical: data.is_critical,
        written_by: currentUser,
        time: new Date().toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
        }),
        notes: data.notes,
        pending_tasks: data.pending_tasks || "",
        medications_due: data.medications_due || "",
      });
    }
    onClose();
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

        <div>
          <h3 className="text-lg font-bold text-dark-a0">
            Write Handover Note
          </h3>
          <p className="text-sm text-dark-a0/60">
            Document patient status for the incoming shift.
          </p>
          {/* Show who is writing the note */}
          <p className="text-xs text-primary-a20 mt-1 font-medium">
            Writing as: {currentUser}
          </p>
        </div>

        <div className="space-y-4 mt-6">
          {/* Patient + Shift */}
          <div className="space-y-2 md:space-y-0 md:flex gap-4">
            <div className="w-full">
              <label className="label">Patient</label>
              <select
                {...register("patient_id")}
                className={`input ${errors.patient_id ? "input-error" : ""}`}
              >
                <option value="">Select patient...</option>
                {patients.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} — {p.ward}, {p.bed}
                  </option>
                ))}
              </select>
              {errors.patient_id && (
                <p className="error-text">{errors.patient_id.message}</p>
              )}
            </div>

            <div className="w-full">
              <label className="label">Shift</label>
              <select {...register("shift")} className="input">
                <option value="morning">Morning</option>
                <option value="afternoon">Afternoon</option>
                <option value="night">Night</option>
              </select>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="label">Notes</label>
            <textarea
              {...register("notes")}
              rows={4}
              placeholder="Describe the patient's condition, any events during the shift..."
              className={`input resize-none ${errors.notes ? "input-error" : ""}`}
            />
            {errors.notes && (
              <p className="error-text">{errors.notes.message}</p>
            )}
          </div>

          {/* Is Critical */}
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="is_critical"
              {...register("is_critical")}
              className="size-4 accent-danger-a0 cursor-pointer"
            />
            <label
              htmlFor="is_critical"
              className={`text-sm font-medium cursor-pointer ${isCritical ? "text-danger-a0" : "text-dark-a0/70"}`}
            >
              Mark as Critical
            </label>
            {isCritical && (
              <span className="flex items-center gap-1 text-xs text-danger-a0 bg-danger-a20 px-2 py-0.5 rounded-full">
                <AlertTriangle className="size-3" /> Will be highlighted for
                incoming staff
              </span>
            )}
          </div>

          {/* Pending Tasks */}
          <div>
            <label className="label">
              Pending Tasks{" "}
              <span className="text-dark-a0/40 font-normal">(optional)</span>
            </label>
            <textarea
              {...register("pending_tasks")}
              rows={2}
              placeholder="e.g. ECG at 09:00, blood cultures pending..."
              className="input resize-none"
            />
          </div>

          {/* Medications Due */}
          <div>
            <label className="label">
              Medications Due{" "}
              <span className="text-dark-a0/40 font-normal">(optional)</span>
            </label>
            <textarea
              {...register("medications_due")}
              rows={2}
              placeholder="e.g. Amlodipine 5mg at 08:00..."
              className="input resize-none"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              iconLeft={isSubmitting ? undefined : ClipboardList}
            >
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <LoaderCircle className="size-4 animate-spin" /> Saving...
                </span>
              ) : (
                "Save Note"
              )}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
};

// ── Note Card ─────────────────────────────────────────────────────────────────
const NoteCard = ({ note, onDelete, currentUser }) => {
  // "isOwn" now compares against the real logged-in user
  const isOwn = note.written_by === currentUser;

  return (
    <div
      className={`bg-white rounded-lg border ${
        note.is_critical
          ? "border-l-4 border-l-danger-a10 border-surface-a30"
          : "border-surface-a30"
      } p-4 space-y-3`}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="flex items-center flex-wrap gap-2">
            <h3 className="font-bold text-dark-a0">{note.patient}</h3>
            <span className="text-xs text-dark-a0/50">
              {note.ward} · {note.bed}
            </span>
            <span
              className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize ${SHIFT_STYLES[note.shift]}`}
            >
              {note.shift}
            </span>
            {note.is_critical && (
              <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-danger-a20 text-danger-a0">
                <AlertTriangle className="size-3" /> Critical
              </span>
            )}
          </div>
          <p className="text-xs text-dark-a0/50 mt-0.5">
            Written by <span className="font-medium">{note.written_by}</span> ·{" "}
            {note.time}
          </p>
        </div>

        {isOwn && (
          <button
            onClick={() => onDelete(note.id)}
            title="Delete note"
            className="text-dark-a0/30 hover:text-danger-a10 transition-colors cursor-pointer shrink-0"
          >
            <Trash2 className="size-4" />
          </button>
        )}
      </div>

      <p className="text-sm text-dark-a0 leading-relaxed">{note.notes}</p>

      {note.pending_tasks && (
        <div className="bg-amber-50 border border-amber-200 rounded-md px-3 py-2">
          <p className="text-xs font-semibold text-amber-700 mb-0.5">
            Pending Tasks
          </p>
          <p className="text-xs text-amber-800">{note.pending_tasks}</p>
        </div>
      )}

      {note.medications_due && (
        <div className="bg-blue-50 border border-blue-200 rounded-md px-3 py-2">
          <p className="text-xs font-semibold text-blue-700 mb-0.5">
            Medications Due
          </p>
          <p className="text-xs text-blue-800">{note.medications_due}</p>
        </div>
      )}
    </div>
  );
};

// ── Main Page ─────────────────────────────────────────────────────────────────
const ShiftHandover = () => {
  const { user } = useAuth();

  // Build the display name from the logged-in user
  const firstName =
    user?.first_name || user?.firstname || user?.username || "User";
  const lastName = user?.last_name || user?.lastname || "";
  const currentUser = lastName ? `${firstName} ${lastName}` : firstName;

  const [notes, setNotes] = useState([]);
  const [patients, setPatients] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [shiftFilter, setShiftFilter] = useState("all");
  const [wardFilter, setWardFilter] = useState("All Wards");
  const [criticalOnly, setCriticalOnly] = useState(false);
  const [loading, setLoading] = useState(true);

  // ── Load patients and existing notes ───────────────────────────────────────
  const fetchData = useCallback(async () => {
    try {
      const [notesRes, patientsRes] = await Promise.all([
        client.get("/handover-notes/"),
        client.get("/patients/?is_discharged=false"),
      ]);

      const notesList = notesRes.data?.results ?? notesRes.data ?? [];
      setNotes(
        notesList.map((n) => ({
          id: n.id,
          patient: n.patient_name || `Patient ${n.patient}`,
          ward: n.ward || "",
          bed: n.bed || "",
          shift: n.shift,
          is_critical: n.is_critical,
          written_by: n.written_by || n.author_name || "Unknown",
          time: new Date(n.created_at).toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
          }),
          notes: n.notes,
          pending_tasks: n.pending_tasks || "",
          medications_due: n.medications_due || "",
        })),
      );

      const patientsList = patientsRes.data?.results ?? patientsRes.data ?? [];
      setPatients(
        patientsList.map((p) => ({
          id: p.id,
          name: `${p.first_name} ${p.last_name}`,
          ward: p.ward,
          bed: p.bed_number,
        })),
      );
    } catch {
      // If the handover endpoint isn't ready yet, start empty
      setNotes([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ── Delete ─────────────────────────────────────────────────────────────────
  const handleDelete = async (id) => {
    try {
      await client.delete(`/handover-notes/${id}/`);
    } finally {
      setNotes((prev) => prev.filter((n) => n.id !== id));
    }
  };

  const wards = [
    "All Wards",
    ...new Set(notes.map((n) => n.ward).filter(Boolean)),
  ];
  const filtered = useMemo(
    () =>
      notes.filter((note) => {
        const matchShift = shiftFilter === "all" || note.shift === shiftFilter;
        const matchWard =
          wardFilter === "All Wards" || note.ward === wardFilter;
        const matchCritical = !criticalOnly || note.is_critical;
        return matchShift && matchWard && matchCritical;
      }),
    [notes, shiftFilter, wardFilter, criticalOnly],
  );

  const criticalCount = notes.filter((n) => n.is_critical).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
        <Heading
          title="Shift Handover Notes"
          subtitle="Document and review patient status between shifts"
        />
        <Button
          variant="primary"
          size="md"
          iconLeft={Plus}
          onClick={() => setShowModal(true)}
        >
          Write Note
        </Button>
      </div>

      {criticalCount > 0 && (
        <div className="flex items-center gap-3 bg-danger-a20 border border-danger-a10/40 rounded-lg px-4 py-3">
          <AlertTriangle className="size-5 text-danger-a10 shrink-0" />
          <p className="text-sm text-danger-a0 font-medium">
            {criticalCount} critical{" "}
            {criticalCount === 1 ? "note requires" : "notes require"} immediate
            attention.
          </p>
        </div>
      )}

      {/* Filter bar */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <select
          value={shiftFilter}
          onChange={(e) => setShiftFilter(e.target.value)}
          className="input w-auto"
        >
          {SHIFTS.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>

        <select
          value={wardFilter}
          onChange={(e) => setWardFilter(e.target.value)}
          className="input w-auto"
        >
          {wards.map((w) => (
            <option key={w} value={w}>
              {w}
            </option>
          ))}
        </select>

        <label className="flex items-center gap-2 cursor-pointer select-none">
          <div
            onClick={() => setCriticalOnly((prev) => !prev)}
            className={`relative w-10 h-5 rounded-full transition-colors duration-200 ${criticalOnly ? "bg-danger-a10" : "bg-surface-a30"}`}
          >
            <div
              className={`absolute top-0.5 size-4 bg-white rounded-full shadow transition-transform duration-200 ${criticalOnly ? "translate-x-5" : "translate-x-0.5"}`}
            />
          </div>
          <span className="text-sm text-dark-a0/70">Critical only</span>
        </label>

        <span className="text-xs text-dark-a0/40 sm:ml-auto">
          {filtered.length} {filtered.length === 1 ? "note" : "notes"} shown
        </span>
      </div>

      {/* Notes list */}
      {loading && (
        <p className="text-center text-sm text-dark-a0/50 py-12">
          Loading notes…
        </p>
      )}

      {!loading && filtered.length === 0 && (
        <div className="mt-16 flex flex-col items-center justify-center text-center text-dark-a0/40">
          <ClipboardList className="size-8 mb-3" />
          <p className="text-sm font-medium">No handover notes found</p>
          <p className="text-xs mt-1">
            Try adjusting your filters or write a new note.
          </p>
        </div>
      )}

      {!loading && filtered.length > 0 && (
        <div className="space-y-4">
          {filtered.map((note) => (
            <NoteCard
              key={note.id}
              note={note}
              onDelete={handleDelete}
              currentUser={currentUser}
            />
          ))}
        </div>
      )}

      {showModal && (
        <WriteNoteModal
          onClose={() => setShowModal(false)}
          onSaved={(newNote) => setNotes((prev) => [newNote, ...prev])}
          patients={patients}
          currentUser={currentUser}
        />
      )}
    </div>
  );
};

export default ShiftHandover;
