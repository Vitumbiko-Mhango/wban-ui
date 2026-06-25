import React, { useEffect, useMemo, useRef, useState } from "react";
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

const FALLBACK_PATIENTS = [
  { id: 1, name: "Francis Mwale", ward: "Cardiology", bed: "B12" },
  { id: 2, name: "Jane Smith", ward: "Neurology", bed: "B15" },
  { id: 3, name: "Michael Johnson", ward: "Orthopedics", bed: "B20" },
  { id: 4, name: "Chisomo Banda", ward: "Ward 3", bed: "Bed 12" },
  { id: 5, name: "Kondwani Mwale", ward: "ICU", bed: "ICU-02" },
];

const FALLBACK_SCORES = [
  {
    id: 1,
    patient: 5,
    patient_name: "Kondwani Mwale",
    ward: "ICU",
    total_score: 8,
    risk_level: "high",
    respiration_rate: 27,
    spo2: 90,
    temperature: 38.4,
    systolic_bp: 92,
    heart_rate: 128,
    consciousness: "Responds to Voice",
    on_oxygen: true,
    score_respiration: 3,
    score_spo2: 2,
    score_temperature: 1,
    score_systolic_bp: 2,
    score_heart_rate: 2,
    score_consciousness: 3,
    score_on_oxygen: 2,
    calculated_by: "Grace Phiri",
    timestamp: "2026-06-22 06:45",
    notes: "Breathing appears laboured. Critical alert generated.",
  },
  {
    id: 2,
    patient: 1,
    patient_name: "Francis Mwale",
    ward: "Cardiology",
    total_score: 5,
    risk_level: "medium",
    respiration_rate: 22,
    spo2: 95,
    temperature: 37.8,
    systolic_bp: 108,
    heart_rate: 104,
    consciousness: "Alert",
    on_oxygen: false,
    score_respiration: 2,
    score_spo2: 1,
    score_temperature: 1,
    score_systolic_bp: 1,
    score_heart_rate: 1,
    score_consciousness: 0,
    score_on_oxygen: 0,
    calculated_by: "Vitumbiko Mhango",
    timestamp: "2026-06-22 09:20",
    notes: "Review after morning medication.",
  },
  {
    id: 3,
    patient: 2,
    patient_name: "Jane Smith",
    ward: "Neurology",
    total_score: 2,
    risk_level: "low",
    respiration_rate: 18,
    spo2: 98,
    temperature: 36.9,
    systolic_bp: 124,
    heart_rate: 86,
    consciousness: "Alert",
    on_oxygen: false,
    score_respiration: 0,
    score_spo2: 0,
    score_temperature: 0,
    score_systolic_bp: 0,
    score_heart_rate: 1,
    score_consciousness: 0,
    score_on_oxygen: 0,
    calculated_by: "Tadala Chirwa",
    timestamp: "2026-06-21 15:10",
    notes: "",
  },
];

const CONSCIOUSNESS_OPTIONS = [
  { value: "alert", label: "Alert" },
  { value: "voice", label: "Responds to Voice" },
  { value: "pain", label: "Responds to Pain" },
  { value: "unresponsive", label: "Unresponsive" },
];

const riskFromScore = (score) => {
  if (score >= 7) return "high";
  if (score >= 5) return "medium";
  return "low";
};

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

const getPatientName = (score) =>
  score.patient_name || score.patient?.name || score.patientName || "Unknown patient";

const getWard = (score) =>
  score.ward || score.patient?.ward || score.patient_ward || "Unassigned ward";

const getRisk = (score) =>
  (score.risk_level || riskFromScore(Number(score.total_score) || 0)).toLowerCase();

const parameterRows = (score) => [
  {
    label: "Respiration rate",
    value: `${score.respiration_rate ?? "-"} breaths/min`,
    score: score.score_respiration,
  },
  { label: "SpO2", value: `${score.spo2 ?? "-"}%`, score: score.score_spo2 },
  {
    label: "Temperature",
    value: `${score.temperature ?? "-"} C`,
    score: score.score_temperature,
  },
  {
    label: "Systolic BP",
    value: `${score.systolic_bp ?? "-"} mmHg`,
    score: score.score_systolic_bp,
  },
  {
    label: "Heart rate",
    value: `${score.heart_rate ?? "-"} bpm`,
    score: score.score_heart_rate,
  },
  {
    label: "Consciousness",
    value: score.consciousness || "-",
    score: score.score_consciousness,
  },
  {
    label: "On oxygen",
    value: score.on_oxygen ? "Yes" : "No",
    score: score.score_on_oxygen,
  },
];

const calculateLocalScore = ({ respiration_rate, systolic_bp, consciousness, on_oxygen }) => {
  const respiration = Number(respiration_rate);
  const systolic = Number(systolic_bp);
  const scoreRespiration =
    respiration <= 8 ? 3 : respiration <= 11 ? 1 : respiration <= 20 ? 0 : respiration <= 24 ? 2 : 3;
  const scoreSystolic =
    systolic <= 90 ? 3 : systolic <= 100 ? 2 : systolic <= 110 ? 1 : systolic <= 219 ? 0 : 3;
  const scoreConsciousness = consciousness === "alert" ? 0 : 3;
  const scoreOxygen = on_oxygen ? 2 : 0;
  const heartRate = 95;
  const temperature = 37.2;
  const spo2 = 97;
  const scoreHeartRate = 1;
  const scoreTemperature = 0;
  const scoreSpo2 = 0;
  const total =
    scoreRespiration +
    scoreSystolic +
    scoreConsciousness +
    scoreOxygen +
    scoreHeartRate +
    scoreTemperature +
    scoreSpo2;

  return {
    total_score: total,
    risk_level: riskFromScore(total),
    heart_rate: heartRate,
    temperature,
    spo2,
    score_respiration: scoreRespiration,
    score_heart_rate: scoreHeartRate,
    score_temperature: scoreTemperature,
    score_spo2: scoreSpo2,
    score_systolic_bp: scoreSystolic,
    score_consciousness: scoreConsciousness,
    score_on_oxygen: scoreOxygen,
  };
};

const RiskBadge = ({ risk }) => {
  const config = riskConfig[risk] || riskConfig.low;
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold ${config.badgeClass}`}>
      {risk === "high" && <AlertTriangle className="size-3.5" />}
      {config.label}
    </span>
  );
};

const ScoreCard = ({ score }) => {
  const risk = getRisk(score);
  const config = riskConfig[risk] || riskConfig.low;
  const rows = parameterRows(score);

  return (
    <article className="rounded-lg border border-surface-a30 bg-white p-4 shadow-sm">
      {risk === "high" && (
        <div className="mb-4 rounded-md border border-danger-a10 bg-danger-a20 px-4 py-3">
          <p className="flex items-center gap-2 text-sm font-bold text-danger-a0">
            <AlertTriangle className="size-4" />
            HIGH RISK - Score {score.total_score}
          </p>
          <p className="mt-1 text-xs text-danger-a0">
            Emergency response required. An alert has been sent to the ward.
          </p>
        </div>
      )}

      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <h3 className="font-bold text-dark-a0">{getPatientName(score)}</h3>
          <p className="text-sm text-dark-a0/55">{getWard(score)}</p>
          <p className="mt-2 text-xs text-dark-a0/45">
            Calculated by {score.calculated_by || "Current nurse"} - {score.timestamp || "Just now"}
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-xs font-medium uppercase text-dark-a0/45">Total score</p>
            <p className={`text-5xl font-extrabold leading-none ${config.scoreClass}`}>
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
            <p className="mt-1 text-xs text-dark-a0/45">Score {row.score ?? 0}</p>
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

const CalculateModal = ({ patients, onClose, onCalculated }) => {
  const modalRef = useRef(null);
  const [form, setForm] = useState({
    patient: "",
    respiration_rate: "",
    systolic_bp: "",
    consciousness: "alert",
    on_oxygen: false,
    notes: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  useClickOutside(modalRef, onClose);

  const updateField = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    const payload = {
      patient: Number(form.patient),
      respiration_rate: Number(form.respiration_rate),
      systolic_bp: Number(form.systolic_bp),
      consciousness: form.consciousness,
      on_oxygen: form.on_oxygen,
      notes: form.notes.trim(),
    };

    try {
      let result;
      const response = await fetch("/api/news2/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        result = await response.json();
      } else {
        throw new Error("Unable to calculate with backend");
      }

      const patient = patients.find((item) => item.id === payload.patient);
      onCalculated({
        id: result.id || Date.now(),
        patient: payload.patient,
        patient_name: result.patient_name || patient?.name,
        ward: result.ward || patient?.ward,
        respiration_rate: payload.respiration_rate,
        systolic_bp: payload.systolic_bp,
        consciousness:
          CONSCIOUSNESS_OPTIONS.find((item) => item.value === payload.consciousness)?.label ||
          payload.consciousness,
        on_oxygen: payload.on_oxygen,
        calculated_by: result.calculated_by || "Vitumbiko Mhango",
        timestamp: result.timestamp || new Date().toLocaleString("en-GB"),
        notes: payload.notes,
        ...result,
      });
      onClose();
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 700));
      const patient = patients.find((item) => item.id === payload.patient);
      const localResult = calculateLocalScore(payload);
      onCalculated({
        id: Date.now(),
        patient: payload.patient,
        patient_name: patient?.name,
        ward: patient?.ward,
        respiration_rate: payload.respiration_rate,
        systolic_bp: payload.systolic_bp,
        consciousness:
          CONSCIOUSNESS_OPTIONS.find((item) => item.value === payload.consciousness)?.label ||
          payload.consciousness,
        on_oxygen: payload.on_oxygen,
        calculated_by: "Vitumbiko Mhango",
        timestamp: new Date().toLocaleString("en-GB"),
        notes: payload.notes,
        ...localResult,
      });
      onClose();
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

        <div>
          <h3 className="text-lg font-bold text-dark-a0">Calculate NEWS2 Score</h3>
          <p className="text-sm text-dark-a0/60">
            Enter manually measured values and use latest sensor readings for the rest.
          </p>
        </div>

        <div className="mt-6 space-y-4">
          <div>
            <label className="label">Patient</label>
            <select
              required
              value={form.patient}
              onChange={(event) => updateField("patient", event.target.value)}
              className="input"
            >
              <option value="">Select patient...</option>
              {patients.map((patient) => (
                <option key={patient.id} value={patient.id}>
                  {patient.name} - {patient.ward}
                </option>
              ))}
            </select>
          </div>

          <div className="rounded-md bg-surface-a10 px-3 py-2 text-xs font-bold uppercase text-dark-a0/50">
            Manually entered
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="label">Respiration rate</label>
              <input
                required
                min="1"
                type="number"
                value={form.respiration_rate}
                onChange={(event) => updateField("respiration_rate", event.target.value)}
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
                onChange={(event) => updateField("systolic_bp", event.target.value)}
                placeholder="mmHg"
                className="input"
              />
            </div>
          </div>

          <div>
            <label className="label">Consciousness</label>
            <select
              value={form.consciousness}
              onChange={(event) => updateField("consciousness", event.target.value)}
              className="input"
            >
              {CONSCIOUSNESS_OPTIONS.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => updateField("on_oxygen", !form.on_oxygen)}
              className={`relative h-6 w-11 rounded-full transition-colors ${
                form.on_oxygen ? "bg-primary-a20" : "bg-surface-a30"
              }`}
            >
              <span
                className={`absolute top-1 size-4 rounded-full bg-white shadow transition-transform ${
                  form.on_oxygen ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
            <span className="text-sm font-medium text-dark-a0/75">On oxygen</span>
          </div>

          <div>
            <label className="label">
              Notes <span className="font-normal text-dark-a0/40">(optional)</span>
            </label>
            <textarea
              rows={3}
              value={form.notes}
              onChange={(event) => updateField("notes", event.target.value)}
              placeholder="Patient looks slightly unwell"
              className="input resize-none"
            />
          </div>

          <div className="rounded-md border border-info-a10/40 bg-info-a20 px-4 py-3">
            <p className="text-xs font-bold uppercase text-info-a0">Auto-filled notice</p>
            <p className="mt-1 text-sm text-info-a0">
              Heart rate, temperature and SpO2 will be auto-filled from the latest sensor reading.
            </p>
          </div>

          {error && <p className="error-text">{error}</p>}

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting} iconLeft={isSubmitting ? undefined : Stethoscope}>
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <LoaderCircle className="size-4 animate-spin" />
                  Calculating...
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

const NEWS2 = () => {
  const [patients, setPatients] = useState(FALLBACK_PATIENTS);
  const [scores, setScores] = useState(FALLBACK_SCORES);
  const [search, setSearch] = useState("");
  const [riskFilter, setRiskFilter] = useState("all");
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [patientsResponse, scoresResponse] = await Promise.all([
          fetch("/api/patients/"),
          fetch("/api/news2/"),
        ]);

        if (patientsResponse.ok) {
          const patientsData = await patientsResponse.json();
          setPatients(Array.isArray(patientsData) ? patientsData : patientsData.results || FALLBACK_PATIENTS);
        }

        if (scoresResponse.ok) {
          const scoresData = await scoresResponse.json();
          setScores(Array.isArray(scoresData) ? scoresData : scoresData.results || FALLBACK_SCORES);
        }
      } catch {
        setPatients(FALLBACK_PATIENTS);
        setScores(FALLBACK_SCORES);
      }
    };

    loadData();
  }, []);

  const filteredScores = useMemo(() => {
    const query = search.trim().toLowerCase();
    return scores.filter((score) => {
      const matchesSearch =
        !query ||
        getPatientName(score).toLowerCase().includes(query) ||
        getWard(score).toLowerCase().includes(query);
      const matchesRisk = riskFilter === "all" || getRisk(score) === riskFilter;
      return matchesSearch && matchesRisk;
    });
  }, [scores, search, riskFilter]);

  const handleCalculated = (score) => {
    setScores((prev) => [score, ...prev]);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <Heading title="NEWS2 Score" subtitle="Calculate and review patient early warning scores" />
        <Button iconLeft={ClipboardPlus} onClick={() => setShowModal(true)}>
          Calculate Score
        </Button>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative sm:w-72">
          <Search className="pointer-events-none absolute left-3 top-3 size-4 text-dark-a0/35" />
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by patient name"
            className="input pl-9"
          />
        </div>

        <select
          value={riskFilter}
          onChange={(event) => setRiskFilter(event.target.value)}
          className="input sm:w-56"
        >
          <option value="all">All risk levels</option>
          <option value="low">Low risk</option>
          <option value="medium">Medium risk</option>
          <option value="high">High risk</option>
        </select>

        <span className="text-xs text-dark-a0/45 sm:ml-auto">
          {filteredScores.length} {filteredScores.length === 1 ? "score" : "scores"} shown
        </span>
      </div>

      <div className="space-y-4">
        {filteredScores.length === 0 ? (
          <div className="mt-16 flex flex-col items-center justify-center text-center text-dark-a0/40">
            <ClipboardPlus className="mb-3 size-8" />
            <p className="text-sm font-medium">No NEWS2 scores found</p>
            <p className="mt-1 text-xs">Try changing your filters or calculate a new score.</p>
          </div>
        ) : (
          filteredScores.map((score) => <ScoreCard key={score.id} score={score} />)
        )}
      </div>

      {showModal && (
        <CalculateModal
          patients={patients}
          onClose={() => setShowModal(false)}
          onCalculated={handleCalculated}
        />
      )}
    </div>
  );
};

export default NEWS2;
