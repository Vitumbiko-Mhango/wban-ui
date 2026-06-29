import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
  useCallback,
} from "react";
import {
  AlertTriangle,
  ClipboardPlus,
  LoaderCircle,
  Search,
  Stethoscope,
  X,
} from "lucide-react";
import Button from "../../components/common/Button";
import Heading from "../../components/common/Heading";
import useClickOutside from "../../hooks/useClickOutside";
import client from "../../api/client";

// ── Risk config ───────────────────────────────────────────────────────────────
const riskConfig = {
  low: {
    label: "Low Risk",
    scoreClass: "text-success-a0",
    badgeClass: "bg-success-a20 text-success-a0",
  },
  medium: {
    label: "Medium Risk",
    scoreClass: "text-warning-a0",
    badgeClass: "bg-warning-a20 text-warning-a0",
  },
  high: {
    label: "High Risk",
    scoreClass: "text-danger-a0",
    badgeClass: "bg-danger-a20 text-danger-a0 animate-pulse",
  },
};

const CONSCIOUSNESS_OPTIONS = [
  { value: "alert", label: "Alert" },
  { value: "voice", label: "Responds to Voice" },
  { value: "pain", label: "Responds to Pain" },
  { value: "unresponsive", label: "Unresponsive" },
];

// ── Helpers ───────────────────────────────────────────────────────────────────
const getRisk = (s) => (s.risk_level || "low").toLowerCase();
const getName = (s) => s.patient_name || `Patient ${s.patient}`;
const getWard = (s) => s.ward || "";

const paramRows = (s) => [
  {
    label: "Respiration rate",
    value: `${s.respiration_rate ?? "—"} breaths/min`,
    score: s.score_respiration,
  },
  { label: "SpO₂", value: `${s.spo2 ?? "—"}%`, score: s.score_spo2 },
  {
    label: "Temperature",
    value: `${s.temperature ?? "—"} °C`,
    score: s.score_temperature,
  },
  {
    label: "Systolic BP",
    value: `${s.systolic_bp ?? "—"} mmHg`,
    score: s.score_systolic_bp,
  },
  {
    label: "Heart rate",
    value: `${s.heart_rate ?? "—"} bpm`,
    score: s.score_heart_rate,
  },
  {
    label: "Consciousness",
    value: s.consciousness_display || s.consciousness || "—",
    score: s.score_consciousness,
  },
  {
    label: "On oxygen",
    value: s.on_oxygen ? "Yes" : "No",
    score: s.score_on_oxygen,
  },
];

// Shape a raw API score into what ScoreCard expects
const normalizeScore = (s) => ({
  ...s,
  patient_name: s.patient_name || `Patient ${s.patient}`,
  calculated_by: s.calculated_by_name || "—",
  timestamp: s.created_at
    ? new Date(s.created_at).toLocaleString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "—",
});

// ── Sub-components ─────────────────────────────────────────────────────────────
const RiskBadge = ({ risk }) => {
  const cfg = riskConfig[risk] || riskConfig.low;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold ${cfg.badgeClass}`}
    >
      {risk === "high" && <AlertTriangle className="size-3.5" />}
      {cfg.label}
    </span>
  );
};

const ScoreCard = ({ score }) => {
  const risk = getRisk(score);
  const cfg = riskConfig[risk] || riskConfig.low;
  const rows = paramRows(score);

  return (
    <article className="rounded-lg border border-surface-a30 bg-white p-4 shadow-sm">
      {risk === "high" && (
        <div className="mb-4 rounded-md border border-danger-a10 bg-danger-a20 px-4 py-3">
          <p className="flex items-center gap-2 text-sm font-bold text-danger-a0">
            <AlertTriangle className="size-4" />
            HIGH RISK — Score {score.total_score}
          </p>
          <p className="mt-1 text-xs text-danger-a0">
            Emergency response required. An alert has been sent to the ward.
          </p>
        </div>
      )}

      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <h3 className="font-bold text-dark-a0">{getName(score)}</h3>
          {getWard(score) && (
            <p className="text-sm text-dark-a0/55">{getWard(score)}</p>
          )}
          <p className="mt-2 text-xs text-dark-a0/45">
            Calculated by {score.calculated_by} · {score.timestamp}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-xs font-medium uppercase text-dark-a0/45">
              Total score
            </p>
            <p
              className={`text-5xl font-extrabold leading-none ${cfg.scoreClass}`}
            >
              {score.total_score}
            </p>
          </div>
          <RiskBadge risk={risk} />
        </div>
      </div>

      <div className="mt-5 grid gap-2 sm:grid-cols-2 xl:grid-cols-7">
        {rows.map((row) => (
          <div key={row.label} className="rounded-md bg-surface-a10 p-3">
            <p className="text-xs font-semibold text-dark-a0/55">{row.label}</p>
            <p className="mt-1 text-sm font-bold text-dark-a0">{row.value}</p>
            <p className="mt-1 text-xs text-dark-a0/45">
              Score {row.score ?? 0}
            </p>
          </div>
        ))}
      </div>

      {score.notes && (
        <div className="mt-4 rounded-md border border-surface-a30 bg-surface-a10 px-3 py-2">
          <p className="text-xs font-semibold text-dark-a0/55">Notes</p>
          <p className="mt-1 text-sm text-dark-a0/75">{score.notes}</p>
        </div>
      )}
    </article>
  );
};

// ── Patient dropdown — names only, searchable, scrollable ─────────────────────
const PatientDropdown = ({ patients, loading, value, onChange, error }) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const wrapRef = useRef(null);
  const searchRef = useRef(null);

  useClickOutside(wrapRef, () => setOpen(false));

  useEffect(() => {
    if (open) searchRef.current?.focus();
  }, [open]);

  const selected = patients.find((p) => String(p.id) === String(value));

  const filtered = useMemo(() => {
    if (!search.trim()) return patients;
    const q = search.toLowerCase();
    return patients.filter((p) => p.fullName.toLowerCase().includes(q));
  }, [patients, search]);

  const choose = (p) => {
    onChange(String(p.id));
    setSearch("");
    setOpen(false);
  };

  return (
    <div className="relative" ref={wrapRef}>
      <label className="label">Patient</label>

      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`input w-full flex items-center justify-between text-left cursor-pointer ${error ? "input-error" : ""}`}
      >
        <span className={selected ? "text-dark-a0" : "text-dark-a0/40"}>
          {loading
            ? "Loading patients…"
            : selected
              ? selected.fullName
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

      {/* Panel */}
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
                    String(p.id) === String(value)
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

      {error && <p className="error-text mt-1">{error}</p>}
    </div>
  );
};

// ── Calculate Modal ───────────────────────────────────────────────────────────
const CalculateModal = ({
  patients,
  patientsLoading,
  onClose,
  onCalculated,
}) => {
  const modalRef = useRef(null);
  useClickOutside(modalRef, onClose);

  const [form, setForm] = useState({
    patient: "",
    respiration_rate: "",
    systolic_bp: "",
    consciousness: "alert",
    on_oxygen: false,
    notes: "",
    // manual vitals — revealed when device has no data
    heart_rate: "",
    temperature: "",
    spo2: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [needManualVitals, setNeedManualVitals] = useState(false);

  const set = (field, value) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!form.patient) {
      setError("Please select a patient.");
      return;
    }

    // If manual vitals are required, validate them before sending
    if (
      needManualVitals &&
      (!form.heart_rate || !form.temperature || !form.spo2)
    ) {
      setError("Please enter heart rate, temperature, and SpO₂.");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        patient: Number(form.patient),
        respiration_rate: Number(form.respiration_rate),
        systolic_bp: Number(form.systolic_bp),
        consciousness: form.consciousness,
        on_oxygen: form.on_oxygen,
        notes: form.notes.trim(),
      };

      // Include manual vitals if the nurse filled them in
      if (needManualVitals) {
        payload.heart_rate = Number(form.heart_rate);
        payload.temperature = Number(form.temperature);
        payload.spo2 = Number(form.spo2);
      }

      const { data } = await client.post("/news2/", payload);
      onCalculated(normalizeScore(data));
      onClose();
    } catch (err) {
      const respData = err?.response?.data;

      // Backend signals no device data — reveal the manual vital fields
      if (respData?.error === "no_device_data") {
        setNeedManualVitals(true);
        setError(
          "No sensor readings found for this patient. Please enter heart rate, temperature, and SpO₂ manually below.",
        );
        setIsSubmitting(false);
        return;
      }

      const msg =
        respData?.message ||
        respData?.error ||
        respData?.detail ||
        "Failed to calculate. Check your connection and try again.";
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-dark-a0/80">
      <form
        ref={modalRef}
        onSubmit={handleSubmit}
        className="relative m-4 max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg bg-light-a0 p-6"
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-5 top-5 cursor-pointer text-dark-a0/40 hover:text-dark-a0"
        >
          <X className="size-4" />
        </button>

        <h3 className="text-lg font-bold text-dark-a0">
          Calculate NEWS2 Score
        </h3>
        <p className="text-sm text-dark-a0/60">
          Enter manually measured values. Heart rate, temperature, and SpO₂ are
          pulled from the patient's device automatically.
        </p>

        <div className="mt-6 space-y-4">
          {/* Patient — names-only scrollable dropdown */}
          <PatientDropdown
            patients={patients}
            loading={patientsLoading}
            value={form.patient}
            onChange={(v) => {
              set("patient", v);
              setNeedManualVitals(false);
              setError("");
            }}
            error={!form.patient && error ? "Please select a patient." : ""}
          />

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="label">Respiration rate</label>
              <input
                required
                min="1"
                type="number"
                value={form.respiration_rate}
                onChange={(e) => set("respiration_rate", e.target.value)}
                placeholder="breaths/min"
                className="input"
              />
            </div>
            <div>
              <label className="label">Systolic BP</label>
              <input
                required
                min="1"
                type="number"
                value={form.systolic_bp}
                onChange={(e) => set("systolic_bp", e.target.value)}
                placeholder="mmHg"
                className="input"
              />
            </div>
          </div>

          <div>
            <label className="label">Consciousness</label>
            <select
              value={form.consciousness}
              onChange={(e) => set("consciousness", e.target.value)}
              className="input"
            >
              {CONSCIOUSNESS_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => set("on_oxygen", !form.on_oxygen)}
              className={`relative inline-flex h-6 w-11 shrink-0 rounded-full transition-colors duration-200 ${
                form.on_oxygen ? "bg-primary-a20" : "bg-surface-a30"
              }`}
            >
              <span
                className={`absolute top-1 left-1 size-4 rounded-full bg-white shadow transition-transform duration-200 ${
                  form.on_oxygen ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
            <span className="text-sm font-medium text-dark-a0/75">
              On oxygen
            </span>
          </div>

          <div>
            <label className="label">
              Notes{" "}
              <span className="font-normal text-dark-a0/40">(optional)</span>
            </label>
            <textarea
              rows={3}
              value={form.notes}
              onChange={(e) => set("notes", e.target.value)}
              placeholder="e.g. Patient looks slightly unwell…"
              className="input resize-none"
            />
          </div>

          {/* Manual vitals — revealed when device has no readings */}
          {needManualVitals && (
            <div className="rounded-md border border-warning-a10/40 bg-warning-a20 p-4 space-y-3">
              <p className="text-xs font-bold uppercase text-warning-a0">
                Enter vitals manually
              </p>
              <div className="grid gap-3 md:grid-cols-3">
                <div>
                  <label className="label">Heart rate</label>
                  <input
                    required
                    min="1"
                    type="number"
                    value={form.heart_rate}
                    onChange={(e) => set("heart_rate", e.target.value)}
                    placeholder="bpm"
                    className="input"
                  />
                </div>
                <div>
                  <label className="label">Temperature</label>
                  <input
                    required
                    type="number"
                    step="0.1"
                    value={form.temperature}
                    onChange={(e) => set("temperature", e.target.value)}
                    placeholder="°C"
                    className="input"
                  />
                </div>
                <div>
                  <label className="label">SpO₂</label>
                  <input
                    required
                    min="0"
                    max="100"
                    type="number"
                    value={form.spo2}
                    onChange={(e) => set("spo2", e.target.value)}
                    placeholder="%"
                    className="input"
                  />
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="flex items-start gap-2 rounded-md border border-danger-a10/40 bg-danger-a20 px-3 py-2">
              <AlertTriangle className="size-4 text-danger-a10 shrink-0 mt-0.5" />
              <p className="text-sm text-danger-a0">{error}</p>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <LoaderCircle className="size-4 animate-spin" /> Calculating…
                </span>
              ) : (
                "Calculate"
              )}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
};

// ── Main page ─────────────────────────────────────────────────────────────────
const NEWS2 = () => {
  const [patients, setPatients] = useState([]);
  const [patientsLoading, setPatientsLoading] = useState(true);
  const [scores, setScores] = useState([]);
  const [scoresLoading, setScoresLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [search, setSearch] = useState("");
  const [riskFilter, setRiskFilter] = useState("all");
  const [showModal, setShowModal] = useState(false);

  // ── Fetch patients from PostgreSQL ────────────────────────────────────────
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
          ward: p.ward,
          bed: p.bed_number,
        })),
      );
    } catch {
      setLoadError("Could not load patients.");
    } finally {
      setPatientsLoading(false);
    }
  }, []);

  // ── Fetch NEWS2 scores from PostgreSQL ────────────────────────────────────
  const fetchScores = useCallback(async () => {
    setScoresLoading(true);
    try {
      const { data } = await client.get("/news2/?page_size=100");
      const list = data?.results ?? data ?? [];
      setScores(list.map(normalizeScore));
    } catch {
      setLoadError("Could not load NEWS2 scores.");
    } finally {
      setScoresLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPatients();
    fetchScores();
  }, [fetchPatients, fetchScores]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return scores.filter((s) => {
      const matchSearch =
        !q ||
        getName(s).toLowerCase().includes(q) ||
        getWard(s).toLowerCase().includes(q);
      const matchRisk = riskFilter === "all" || getRisk(s) === riskFilter;
      return matchSearch && matchRisk;
    });
  }, [scores, search, riskFilter]);

  const loading = scoresLoading;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <Heading
          title="NEWS2 Score"
          subtitle="Calculate and review patient early warning scores"
        />
        <Button iconLeft={ClipboardPlus} onClick={() => setShowModal(true)}>
          Calculate Score
        </Button>
      </div>

      {loadError && (
        <div className="flex items-center gap-3 rounded-lg border border-danger-a10/40 bg-danger-a20 px-4 py-3">
          <AlertTriangle className="size-5 shrink-0 text-danger-a10" />
          <p className="text-sm font-medium text-danger-a0">{loadError}</p>
        </div>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative sm:w-72">
          <Search className="pointer-events-none absolute left-3 top-3 size-4 text-dark-a0/35" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by patient name"
            className="input pl-9"
          />
        </div>

        <select
          value={riskFilter}
          onChange={(e) => setRiskFilter(e.target.value)}
          className="input sm:w-56"
        >
          <option value="all">All risk levels</option>
          <option value="low">Low risk</option>
          <option value="medium">Medium risk</option>
          <option value="high">High risk</option>
        </select>

        <span className="text-xs text-dark-a0/45 sm:ml-auto">
          {filtered.length} {filtered.length === 1 ? "score" : "scores"} shown
        </span>
      </div>

      <div className="space-y-4">
        {loading ? (
          <div className="flex items-center justify-center gap-2 py-16 text-sm text-dark-a0/50">
            <LoaderCircle className="size-4 animate-spin" /> Loading scores…
          </div>
        ) : filtered.length === 0 ? (
          <div className="mt-16 flex flex-col items-center justify-center text-center text-dark-a0/40">
            <ClipboardPlus className="mb-3 size-8" />
            <p className="text-sm font-medium">No NEWS2 scores found</p>
            <p className="mt-1 text-xs">
              Try changing your filters or calculate a new score.
            </p>
          </div>
        ) : (
          filtered.map((s) => <ScoreCard key={s.id} score={s} />)
        )}
      </div>

      {showModal && (
        <CalculateModal
          patients={patients}
          patientsLoading={patientsLoading}
          onClose={() => setShowModal(false)}
          onCalculated={(s) => setScores((prev) => [s, ...prev])}
        />
      )}
    </div>
  );
};

export default NEWS2;
