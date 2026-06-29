import { useState, useEffect } from "react";
import client from "../../api/client";

// ─── Clinical defaults (mirrors backend model defaults) ───────────────────────

const DEFAULTS = {
  heart_rate_normal_min: 60,
  heart_rate_normal_max: 100,
  heart_rate_warning_min: 50,
  heart_rate_warning_max: 110,
  heart_rate_critical_min: 40,
  heart_rate_critical_max: 120,
  temperature_normal_min: 36.1,
  temperature_normal_max: 37.5,
  temperature_warning_min: 36.0,
  temperature_warning_max: 38.0,
  temperature_critical_min: 35.0,
  temperature_critical_max: 38.5,
  spo2_normal_min: 95.0,
  spo2_warning_min: 90.0,
  spo2_critical_min: 85.0,
  stress_normal_max: 0.4,
  stress_warning_max: 0.6,
  stress_critical_max: 0.8,
};

// ─── Vital sign groups displayed in the UI ────────────────────────────────────

const VITALS = [
  {
    key: "heart_rate",
    label: "Heart Rate",
    unit: "bpm",
    icon: "❤️",
    fields: [
      {
        label: "Normal",
        min: "heart_rate_normal_min",
        max: "heart_rate_normal_max",
        color: "#16a34a",
      },
      {
        label: "Warning",
        min: "heart_rate_warning_min",
        max: "heart_rate_warning_max",
        color: "#ca8a04",
      },
      {
        label: "Critical",
        min: "heart_rate_critical_min",
        max: "heart_rate_critical_max",
        color: "#dc2626",
      },
    ],
  },
  {
    key: "temperature",
    label: "Temperature",
    unit: "°C",
    icon: "🌡️",
    fields: [
      {
        label: "Normal",
        min: "temperature_normal_min",
        max: "temperature_normal_max",
        color: "#16a34a",
      },
      {
        label: "Warning",
        min: "temperature_warning_min",
        max: "temperature_warning_max",
        color: "#ca8a04",
      },
      {
        label: "Critical",
        min: "temperature_critical_min",
        max: "temperature_critical_max",
        color: "#dc2626",
      },
    ],
  },
  {
    key: "spo2",
    label: "SpO₂",
    unit: "%",
    icon: "🫁",
    // SpO2 only has min thresholds (lower = worse)
    minOnly: true,
    fields: [
      { label: "Normal min", min: "spo2_normal_min", color: "#16a34a" },
      { label: "Warning min", min: "spo2_warning_min", color: "#ca8a04" },
      { label: "Critical min", min: "spo2_critical_min", color: "#dc2626" },
    ],
  },
  {
    key: "stress",
    label: "Stress Index",
    unit: "0–1",
    icon: "🧠",
    // Stress only has max thresholds (higher = worse)
    maxOnly: true,
    fields: [
      { label: "Normal max", max: "stress_normal_max", color: "#16a34a" },
      { label: "Warning max", max: "stress_warning_max", color: "#ca8a04" },
      { label: "Critical max", max: "stress_critical_max", color: "#dc2626" },
    ],
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const S = {
  page: {
    padding: "28px",
    fontFamily: "'Inter','Segoe UI',sans-serif",
    background: "#f8fafc",
    minHeight: "100vh",
  },
  card: {
    background: "#fff",
    borderRadius: "12px",
    border: "0.5px solid #e2e8f0",
    marginBottom: "20px",
    overflow: "hidden",
  },
  cardHead: {
    padding: "14px 20px",
    borderBottom: "0.5px solid #e2e8f0",
    display: "flex",
    alignItems: "center",
    gap: "10px",
  },
  cardBody: { padding: "20px" },
  label: {
    fontSize: "11px",
    fontWeight: 600,
    color: "#64748b",
    textTransform: "uppercase",
    letterSpacing: "0.06em",
    display: "block",
    marginBottom: "4px",
  },
  input: {
    width: "100%",
    padding: "8px 10px",
    borderRadius: "8px",
    border: "1.5px solid #e2e8f0",
    fontSize: "13px",
    color: "#0f172a",
    outline: "none",
    boxSizing: "border-box",
    transition: "border-color 0.15s",
  },
  row: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))",
    gap: "12px",
    marginBottom: "16px",
  },
  bandLabel: (color) => ({
    fontSize: "11px",
    fontWeight: 600,
    color,
    textTransform: "uppercase",
    letterSpacing: "0.06em",
    marginBottom: "8px",
    display: "flex",
    alignItems: "center",
    gap: "5px",
  }),
  dot: (color) => ({
    width: "7px",
    height: "7px",
    borderRadius: "50%",
    background: color,
    display: "inline-block",
  }),
  btn: (primary) => ({
    padding: "9px 20px",
    borderRadius: "8px",
    fontSize: "13px",
    fontWeight: 600,
    cursor: "pointer",
    border: "none",
    transition: "opacity 0.15s",
    background: primary ? "#1e40af" : "#f1f5f9",
    color: primary ? "#fff" : "#475569",
  }),
};

// ─── VitalCard ────────────────────────────────────────────────────────────────

function VitalCard({ vital, values, onChange }) {
  return (
    <div style={S.card}>
      <div style={S.cardHead}>
        <span style={{ fontSize: "18px" }}>{vital.icon}</span>
        <div>
          <div style={{ fontSize: "14px", fontWeight: 600, color: "#0f172a" }}>
            {vital.label}
          </div>
          <div style={{ fontSize: "11px", color: "#94a3b8" }}>
            Unit: {vital.unit}
          </div>
        </div>
      </div>
      <div style={S.cardBody}>
        {vital.fields.map((f) => (
          <div key={f.label} style={{ marginBottom: "16px" }}>
            <div style={S.bandLabel(f.color)}>
              <span style={S.dot(f.color)} />
              {f.label}
            </div>
            <div style={S.row}>
              {f.min && (
                <div>
                  <span style={S.label}>Min</span>
                  <input
                    type="number"
                    step="0.1"
                    value={values[f.min] ?? ""}
                    onChange={(e) => onChange(f.min, e.target.value)}
                    style={S.input}
                    onFocus={(e) => {
                      e.target.style.borderColor = f.color;
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = "#e2e8f0";
                    }}
                  />
                </div>
              )}
              {f.max && (
                <div>
                  <span style={S.label}>Max</span>
                  <input
                    type="number"
                    step="0.1"
                    value={values[f.max] ?? ""}
                    onChange={(e) => onChange(f.max, e.target.value)}
                    style={S.input}
                    onFocus={(e) => {
                      e.target.style.borderColor = f.color;
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = "#e2e8f0";
                    }}
                  />
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AlertThresholds() {
  const [patients, setPatients] = useState([]);
  const [patientId, setPatientId] = useState("");
  const [values, setValues] = useState({ ...DEFAULTS });
  const [thresholdId, setThresholdId] = useState(null); // existing record id
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null); // { msg, type }

  // Load patient list on mount
  useEffect(() => {
    client
      .get("/patients/?is_discharged=false")
      .then(({ data }) => {
        const list = Array.isArray(data) ? data : (data.results ?? []);
        setPatients(list);
      })
      .catch(() => showToast("Could not load patients.", "error"));
  }, []);

  // Load threshold when patient changes
  useEffect(() => {
    if (!patientId) {
      setValues({ ...DEFAULTS });
      setThresholdId(null);
      return;
    }
    setLoading(true);
    client
      .get(`/thresholds/?patient=${patientId}`)
      .then(({ data }) => {
        const list = Array.isArray(data) ? data : (data.results ?? []);
        if (list.length > 0) {
          const t = list[0];
          setThresholdId(t.id);
          setValues({
            heart_rate_normal_min: t.heart_rate_normal_min,
            heart_rate_normal_max: t.heart_rate_normal_max,
            heart_rate_warning_min: t.heart_rate_warning_min,
            heart_rate_warning_max: t.heart_rate_warning_max,
            heart_rate_critical_min: t.heart_rate_critical_min,
            heart_rate_critical_max: t.heart_rate_critical_max,
            temperature_normal_min: t.temperature_normal_min,
            temperature_normal_max: t.temperature_normal_max,
            temperature_warning_min: t.temperature_warning_min,
            temperature_warning_max: t.temperature_warning_max,
            temperature_critical_min: t.temperature_critical_min,
            temperature_critical_max: t.temperature_critical_max,
            spo2_normal_min: t.spo2_normal_min,
            spo2_warning_min: t.spo2_warning_min,
            spo2_critical_min: t.spo2_critical_min,
            stress_normal_max: t.stress_normal_max,
            stress_warning_max: t.stress_warning_max,
            stress_critical_max: t.stress_critical_max,
          });
        } else {
          setThresholdId(null);
          setValues({ ...DEFAULTS });
        }
      })
      .catch(() => showToast("Could not load thresholds.", "error"))
      .finally(() => setLoading(false));
  }, [patientId]);

  function showToast(msg, type = "success") {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  }

  function handleChange(field, val) {
    setValues((prev) => ({
      ...prev,
      [field]: val === "" ? "" : parseFloat(val),
    }));
  }

  function handleReset() {
    setValues({ ...DEFAULTS });
    showToast("Reset to clinical defaults — not saved yet.", "info");
  }

  async function handleSave() {
    if (!patientId) {
      showToast("Please select a patient first.", "error");
      return;
    }
    setSaving(true);
    try {
      const payload = { patient: Number(patientId), ...values };
      if (thresholdId) {
        await client.patch(`/thresholds/${thresholdId}/`, payload);
      } else {
        const { data } = await client.post("/thresholds/", payload);
        setThresholdId(data.id);
      }
      showToast("Thresholds saved successfully.");
    } catch {
      showToast("Failed to save thresholds.", "error");
    } finally {
      setSaving(false);
    }
  }

  const selectedPatient = patients.find(
    (p) => String(p.id) === String(patientId),
  );

  return (
    <div style={S.page}>
      {/* Toast */}
      {toast && (
        <div
          style={{
            position: "fixed",
            top: "20px",
            right: "24px",
            zIndex: 9999,
            padding: "12px 20px",
            borderRadius: "10px",
            fontSize: "13px",
            fontWeight: 500,
            color: "#fff",
            boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
            background:
              toast.type === "error"
                ? "#dc2626"
                : toast.type === "info"
                  ? "#1e40af"
                  : "#16a34a",
            transition: "opacity 0.3s",
          }}
        >
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <h1
        style={{
          margin: "0 0 4px",
          fontSize: "22px",
          fontWeight: 800,
          color: "#0f172a",
        }}
      >
        Alert Thresholds
      </h1>
      <p style={{ margin: "0 0 24px", fontSize: "13px", color: "#64748b" }}>
        Set per-patient vital sign ranges. Readings outside these limits will
        trigger alerts.
      </p>

      {/* Patient selector card */}
      <div style={S.card}>
        <div style={S.cardBody}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "20px",
              alignItems: "end",
            }}
          >
            <div>
              <span style={S.label}>Select Patient</span>
              <select
                value={patientId}
                onChange={(e) => setPatientId(e.target.value)}
                style={{ ...S.input, appearance: "none", background: "#fff" }}
              >
                <option value="">— Choose a patient —</option>
                {patients.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.first_name} {p.last_name} — {p.ward}, Bed {p.bed_number}
                  </option>
                ))}
              </select>
            </div>

            {selectedPatient && (
              <div
                style={{ display: "flex", gap: "12px", alignItems: "center" }}
              >
                <div
                  style={{
                    width: "42px",
                    height: "42px",
                    borderRadius: "50%",
                    flexShrink: 0,
                    background: "#1e40af",
                    color: "#fff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "15px",
                    fontWeight: 700,
                  }}
                >
                  {(
                    selectedPatient.first_name[0] + selectedPatient.last_name[0]
                  ).toUpperCase()}
                </div>
                <div>
                  <div
                    style={{
                      fontSize: "14px",
                      fontWeight: 600,
                      color: "#0f172a",
                    }}
                  >
                    {selectedPatient.first_name} {selectedPatient.last_name}
                  </div>
                  <div style={{ fontSize: "12px", color: "#64748b" }}>
                    {selectedPatient.ward} · Bed {selectedPatient.bed_number}
                    {selectedPatient.disease
                      ? ` · ${selectedPatient.disease}`
                      : ""}
                  </div>
                </div>
                <div
                  style={{
                    marginLeft: "auto",
                    fontSize: "11px",
                    fontWeight: 600,
                    padding: "4px 10px",
                    borderRadius: "20px",
                    background: thresholdId ? "#dcfce7" : "#fef9c3",
                    color: thresholdId ? "#166534" : "#854d0e",
                  }}
                >
                  {thresholdId ? "Custom thresholds" : "Using defaults"}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div
          style={{
            textAlign: "center",
            padding: "40px 0",
            color: "#64748b",
            fontSize: "13px",
          }}
        >
          Loading thresholds…
        </div>
      )}

      {/* Vital cards */}
      {!loading && patientId && (
        <>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "20px",
            }}
          >
            {VITALS.map((v) => (
              <VitalCard
                key={v.key}
                vital={v}
                values={values}
                onChange={handleChange}
              />
            ))}
          </div>

          {/* Action bar */}
          <div
            style={{
              position: "sticky",
              bottom: "20px",
              background: "#fff",
              border: "0.5px solid #e2e8f0",
              borderRadius: "12px",
              padding: "14px 20px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
            }}
          >
            <span style={{ fontSize: "12px", color: "#64748b" }}>
              {thresholdId
                ? "Editing existing thresholds, changes take effect immediately on save."
                : "No custom thresholds yet, the system will use clinical defaults."}
            </span>
            <div style={{ display: "flex", gap: "10px" }}>
              <button style={S.btn(false)} onClick={handleReset}>
                Reset to defaults
              </button>
              <button
                style={{ ...S.btn(true), opacity: saving ? 0.7 : 1 }}
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? "Saving…" : "Save thresholds"}
              </button>
            </div>
          </div>
        </>
      )}

      {/* Empty state */}
      {!loading && !patientId && (
        <div
          style={{
            textAlign: "center",
            padding: "60px 0",
            color: "#94a3b8",
            fontSize: "14px",
          }}
        >
          Select a patient above to view or edit their thresholds.
        </div>
      )}
    </div>
  );
}
