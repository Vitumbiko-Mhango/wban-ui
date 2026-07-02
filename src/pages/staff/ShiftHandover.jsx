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
  CalendarDays,
  LoaderCircle,
  Search,
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

// ── Custom patient dropdown — names only, searchable, scrollable ──────────────
const PatientSelect = ({
  patients,
  loading,
  register,
  error,
  setValue,
  watch,
}) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const wrapRef = useRef(null);
  const searchRef = useRef(null);

  // Close on outside click
  useClickOutside(wrapRef, () => setOpen(false));

  // Focus search input when dropdown opens
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
    <div className="w-full" ref={wrapRef}>
      <label className="label">Patient</label>

      {/* Hidden input keeps react-hook-form in sync */}
      <input type="hidden" {...register("patient_id")} />

      {/* Trigger button */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`input w-full flex items-center justify-between text-left cursor-pointer ${
          error ? "input-error" : ""
        }`}
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

      {/* Dropdown panel */}
      {open && (
        <div className="absolute z-50 mt-1 w-72 bg-surface-a0 border border-surface-a30 rounded-lg shadow-lg overflow-hidden">
          {/* Search */}
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

          {/* Scrollable name list */}
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

// ── Write Note Modal ──────────────────────────────────────────────────────────
const WriteNoteModal = ({
  onClose,
  onSaved,
  patients,
  patientsLoading,
  currentUser,
}) => {
  const formRef = useRef(null);
  useClickOutside(formRef, onClose);

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
      shift: "morning",
      notes: "",
      is_critical: false,
      pending_tasks: "",
      medications_due: "",
    },
  });

  const isCritical = watch("is_critical");

  const submitHandler = async (data) => {
    // Find the selected patient to enrich the locally-added note card
    const patient = patients.find((p) => p.id === Number(data.patient_id));

    const payload = {
      patient: Number(data.patient_id),
      shift: data.shift,
      notes: data.notes,
      is_critical: data.is_critical,
      pending_tasks: data.pending_tasks || "",
      medications_due: data.medications_due || "",
    };

    const { data: saved } = await client.post("/handover/", payload);

    // Shape the saved response into what NoteCard expects.
    // written_by_name comes from the serializer; fall back to currentUser.
    onSaved({
      id: saved.id,
      patient:
        saved.patient_name || patient?.fullName || `Patient ${data.patient_id}`,
      ward: patient?.ward || "",
      bed: patient?.bed_number || "",
      created_at: saved.created_at || new Date().toISOString(),
      shift: saved.shift,
      is_critical: saved.is_critical,
      written_by: saved.written_by_name || currentUser,
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

    onClose();
  };

  return (
    <div className="absolute z-50 inset-0 flex items-center justify-center bg-dark-a0/80">
      <form
        ref={formRef}
        onSubmit={handleSubmit(submitHandler)}
        className="relative bg-surface-a0 p-6 rounded-lg max-w-2xl max-h-[90vh] overflow-y-auto w-full m-4"
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
          <p className="text-xs text-primary-a20 mt-1 font-medium">
            Writing as: {currentUser}
          </p>
        </div>

        <div className="space-y-4 mt-6">
          {/* Patient select + Shift on same row */}
          <div className="space-y-4 md:space-y-0 md:flex gap-4 items-start">
            <PatientSelect
              patients={patients}
              loading={patientsLoading}
              register={register}
              error={errors.patient_id}
              setValue={setValue}
              watch={watch}
            />

            <div className="w-full md:w-48 shrink-0">
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
              placeholder="Describe the patient's condition, any events during the shift…"
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
              className={`text-sm font-medium cursor-pointer ${
                isCritical ? "text-danger-a0" : "text-dark-a0/70"
              }`}
            >
              Mark as Critical
            </label>
            {isCritical && (
              <span className="flex items-center gap-1 text-xs text-danger-a0 bg-danger-a20 px-2 py-0.5 rounded-full">
                <AlertTriangle className="size-3" /> Will be highlighted for
                incoming nurse
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
              placeholder="e.g. ECG at 09:00, blood cultures pending…"
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
              placeholder="e.g. Amlodipine 5mg at 08:00…"
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
                  <LoaderCircle className="size-4 animate-spin" /> Saving…
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
  // written_by_name from the serializer; compare against current user display name
  const isOwn = note.written_by === currentUser;
  const shiftStyle =
    SHIFT_STYLES[note.shift] || "bg-surface-a20 text-dark-a0/70";

  return (
    <div
      className={`flex h-full flex-col rounded-lg border bg-surface-a0 shadow-sm transition-colors hover:border-primary-a20/40 ${
        note.is_critical
          ? "border-l-4 border-l-danger-a10 border-danger-a10/40"
          : "border-surface-a30"
      } overflow-hidden`}
    >
      <div className="flex items-start justify-between gap-3 border-b border-surface-a20 px-4 py-3">
        <div className="min-w-0">
          <div className="flex items-center flex-wrap gap-2">
            <h3 className="font-bold text-dark-a0">{note.patient}</h3>
            <span className="text-xs text-dark-a0/50">
              {note.ward}
              {note.bed ? ` · Bed ${note.bed}` : ""}
            </span>
            <span
              className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize ${
                shiftStyle
              }`}
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
            Nurse <span className="font-medium">{note.written_by}</span> ·{" "}
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

      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="rounded-md bg-surface-a10 px-3 py-2">
          <p className="text-xs font-semibold uppercase text-dark-a0/45">
            Clinical summary
          </p>
          <p className="mt-1 text-sm leading-relaxed text-dark-a0">
            {note.notes}
          </p>
        </div>

      {note.pending_tasks && (
        <div className="bg-amber-50 border border-amber-200 rounded-md px-3 py-2">
          <p className="text-xs font-semibold text-amber-700 mb-0.5">
            Pending Tasks
          </p>
          <p className="text-xs text-amber-800">{note.pending_tasks}</p>
        </div>
      )}

      {note.medications_due && (
        <div className="rounded-md border border-sky-200 bg-sky-50 px-3 py-2">
          <p className="text-xs font-semibold text-sky-700 mb-0.5">
            Medications Due
          </p>
          <p className="text-xs text-sky-800">{note.medications_due}</p>
        </div>
      )}
      </div>
    </div>
  );
};

// ── Shape a raw API note into what NoteCard expects ───────────────────────────
const normalizeNote = (n) => ({
  id: n.id,
  patient: n.patient_name || `Patient ${n.patient}`,
  created_at: n.created_at,
  // The handover serializer doesn't return ward/bed — carry them from patients state
  ward: n.ward || "",
  bed: n.bed || "",
  shift: n.shift,
  is_critical: n.is_critical,
  // Serializer exposes written_by_name (the username), not written_by
  written_by: n.written_by_name || n.written_by || "Unknown",
  time: new Date(n.created_at).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  }),
  notes: n.notes,
  pending_tasks: n.pending_tasks || "",
  medications_due: n.medications_due || "",
});

const toDateBoundary = (value, endOfDay = false) => {
  if (!value) return null;
  const date = new Date(`${value}T${endOfDay ? "23:59:59.999" : "00:00:00.000"}`);
  return Number.isNaN(date.getTime()) ? null : date;
};

// ── Main Page ─────────────────────────────────────────────────────────────────
const ShiftHandover = () => {
  const { user } = useAuth();

  const firstName = user?.first_name || user?.username || "User";
  const lastName = user?.last_name || "";
  const currentUser = lastName ? `${firstName} ${lastName}` : firstName;

  const [notes, setNotes] = useState([]);
  const [patients, setPatients] = useState([]);
  const [patientsLoading, setPatientsLoading] = useState(true);
  const [notesLoading, setNotesLoading] = useState(true);
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [shiftFilter, setShiftFilter] = useState("all");
  const [wardFilter, setWardFilter] = useState("All Wards");
  const [criticalOnly, setCriticalOnly] = useState(false);
  const [nameFilter, setNameFilter] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // ── Load patients from PostgreSQL ──────────────────────────────────────────
  // Fetched separately so the modal can open immediately even if notes are slow
  const fetchPatients = useCallback(async () => {
    setPatientsLoading(true);
    try {
      const { data } = await client.get(
        "/patients/?is_discharged=false&page_size=200",
      );
      const list = data?.results ?? data ?? [];
      // Shape into what the dropdown and form need
      setPatients(
        list.map((p) => ({
          id: p.id,
          patient_id: p.patient_id, // PT-YYYY-NNN
          fullName: `${p.first_name} ${p.last_name}`,
          ward: p.ward,
          bed_number: p.bed_number,
          condition: p.condition,
        })),
      );
    } catch {
      setError("Could not load patients. Check your connection.");
    } finally {
      setPatientsLoading(false);
    }
  }, []);

  // ── Load existing handover notes ───────────────────────────────────────────
  const fetchNotes = useCallback(async () => {
    setNotesLoading(true);
    try {
      const { data } = await client.get("/handover/?page_size=100");
      const list = data?.results ?? data ?? [];
      setNotes(list.map(normalizeNote));
    } catch {
      setNotes([]);
    } finally {
      setNotesLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPatients();
    fetchNotes();
  }, [fetchPatients, fetchNotes]);

  // ── Delete ─────────────────────────────────────────────────────────────────
  const handleDelete = async (id) => {
    try {
      await client.delete(`/handover/${id}/`);
    } finally {
      setNotes((prev) => prev.filter((n) => n.id !== id));
    }
  };

  // ── Filters ────────────────────────────────────────────────────────────────
  const wards = [
    "All Wards",
    ...new Set(notes.map((n) => n.ward).filter(Boolean)),
  ];

  const filtered = useMemo(
    () => {
      const query = nameFilter.trim().toLowerCase();
      const from = toDateBoundary(startDate);
      const to = toDateBoundary(endDate, true);

      return notes.filter((note) => {
        const noteDate = new Date(note.created_at);
        const matchShift = shiftFilter === "all" || note.shift === shiftFilter;
        const matchWard =
          wardFilter === "All Wards" || note.ward === wardFilter;
        const matchCritical = !criticalOnly || note.is_critical;
        const matchName =
          !query ||
          note.patient.toLowerCase().includes(query) ||
          note.written_by.toLowerCase().includes(query);
        const matchStart =
          !from || (!Number.isNaN(noteDate.getTime()) && noteDate >= from);
        const matchEnd =
          !to || (!Number.isNaN(noteDate.getTime()) && noteDate <= to);

        return (
          matchShift &&
          matchWard &&
          matchCritical &&
          matchName &&
          matchStart &&
          matchEnd
        );
      });
    },
    [criticalOnly, endDate, nameFilter, notes, shiftFilter, startDate, wardFilter],
  );

  const criticalCount = notes.filter((n) => n.is_critical).length;
  const loading = notesLoading;

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

      {error && (
        <div className="flex items-center gap-3 bg-danger-a20 border border-danger-a10/40 rounded-lg px-4 py-3">
          <AlertTriangle className="size-5 text-danger-a10 shrink-0" />
          <p className="text-sm text-danger-a0 font-medium">{error}</p>
        </div>
      )}

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
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-[minmax(14rem,1fr)_auto_auto_auto_auto_auto_auto] xl:items-center">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-dark-a0/40" />
          <input
            type="search"
            value={nameFilter}
            onChange={(e) => setNameFilter(e.target.value)}
            placeholder="Filter by patient or nurse"
            className="input pl-9"
          />
        </div>

        <div className="relative">
          <CalendarDays className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-dark-a0/40" />
          <input
            type="date"
            value={startDate}
            max={endDate || undefined}
            onChange={(e) => setStartDate(e.target.value)}
            aria-label="Start date"
            className="input pl-9"
          />
        </div>

        <div className="relative">
          <CalendarDays className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-dark-a0/40" />
          <input
            type="date"
            value={endDate}
            min={startDate || undefined}
            onChange={(e) => setEndDate(e.target.value)}
            aria-label="End date"
            className="input pl-9"
          />
        </div>

        <select
          value={shiftFilter}
          onChange={(e) => setShiftFilter(e.target.value)}
          className="input"
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
          className="input"
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
            className={`relative w-10 h-5 rounded-full transition-colors duration-200 ${
              criticalOnly ? "bg-danger-a10" : "bg-surface-a30"
            }`}
          >
            <div
              className={`absolute top-0.5 size-4 bg-white rounded-full shadow transition-transform duration-200 ${
                criticalOnly ? "translate-x-5" : "translate-x-0.5"
              }`}
            />
          </div>
          <span className="text-sm text-dark-a0/70">Critical only</span>
        </label>

        {(nameFilter || startDate || endDate) && (
          <button
            type="button"
            onClick={() => {
              setNameFilter("");
              setStartDate("");
              setEndDate("");
            }}
            className="text-sm font-medium text-primary-a20 hover:underline"
          >
            Clear
          </button>
        )}

        <span className="text-xs text-dark-a0/40 xl:text-right">
          {filtered.length} {filtered.length === 1 ? "note" : "notes"} shown
        </span>
      </div>

      {/* Notes list */}
      {loading && (
        <div className="flex items-center justify-center gap-2 py-12 text-sm text-dark-a0/50">
          <LoaderCircle className="size-4 animate-spin" /> Loading notes…
        </div>
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
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
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
          patientsLoading={patientsLoading}
          currentUser={currentUser}
        />
      )}
    </div>
  );
};

export default ShiftHandover;
