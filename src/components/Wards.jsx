import { useState } from "react";

// ─── Constants ───────────────────────────────────────────────────────────────

const TOTAL_BEDS = 10; // 2 columns × 10 rows
const COLUMNS = 2;

const CONDITION_CONFIG = {
  stable: { bg: "#16a34a", label: "Stable" },
  warning: { bg: "#f59e0b", label: "Warning" },
  critical: { bg: "#dc2626", label: "Critical" },
};

// ─── Sample Data (Ward C only) ────────────────────────────────────────────────

const SAMPLE_PATIENTS = [
  {
    patient_id: "PT-2026-020",
    first_name: "Mary",
    last_name: "Kachingwe",
    age: 36,
    gender: "female",
    ward: "Ward C",
    bed_number: "1",
    condition: "stable",
    assigned_device: "ESP32-018",
    is_discharged: false,
    is_archived: false,
  },
  {
    patient_id: "PT-2026-021",
    first_name: "David",
    last_name: "Mwanza",
    age: 60,
    gender: "male",
    ward: "Ward C",
    bed_number: "3",
    condition: "critical",
    assigned_device: "ESP32-019",
    is_discharged: false,
    is_archived: false,
  },
  {
    patient_id: "PT-2026-022",
    first_name: "Beatrice",
    last_name: "Nkhata",
    age: 44,
    gender: "female",
    ward: "Ward C",
    bed_number: "5",
    condition: "warning",
    assigned_device: "ESP32-020",
    is_discharged: false,
    is_archived: false,
  },
  {
    patient_id: "PT-2026-023",
    first_name: "Henry",
    last_name: "Singini",
    age: 31,
    gender: "male",
    ward: "Ward C",
    bed_number: "7",
    condition: "stable",
    assigned_device: "",
    is_discharged: false,
    is_archived: false,
  },
  {
    patient_id: "PT-2026-024",
    first_name: "Judith",
    last_name: "Nankhumwa",
    age: 52,
    gender: "female",
    ward: "Ward C",
    bed_number: "9",
    condition: "stable",
    assigned_device: "ESP32-021",
    is_discharged: false,
    is_archived: false,
  },
  {
    patient_id: "PT-2026-025",
    first_name: "George",
    last_name: "Sikelo",
    age: 68,
    gender: "male",
    ward: "Ward C",
    bed_number: "11",
    condition: "warning",
    assigned_device: "ESP32-022",
    is_discharged: false,
    is_archived: false,
  },
  {
    patient_id: "PT-2026-026",
    first_name: "Rose",
    last_name: "Dzimadzi",
    age: 23,
    gender: "female",
    ward: "Ward C",
    bed_number: "14",
    condition: "stable",
    assigned_device: "ESP32-023",
    is_discharged: false,
    is_archived: false,
  },
  {
    patient_id: "PT-2026-027",
    first_name: "Wilson",
    last_name: "Chienda",
    age: 57,
    gender: "male",
    ward: "Ward C",
    bed_number: "19",
    condition: "critical",
    assigned_device: "ESP32-024",
    is_discharged: false,
    is_archived: false,
  },
  {
    patient_id: "PT-2026-028",
    first_name: "Chisomo",
    last_name: "Mwale",
    age: 61,
    gender: "male",
    ward: "Ward C",
    bed_number: "2",
    condition: "critical",
    assigned_device: "ESP32-003",
    is_discharged: false,
    is_archived: false,
  },
  {
    patient_id: "PT-2026-029",
    first_name: "Grace",
    last_name: "Phiri",
    age: 32,
    gender: "female",
    ward: "Ward C",
    bed_number: "6",
    condition: "warning",
    assigned_device: "ESP32-002",
    is_discharged: false,
    is_archived: false,
  },
];

const WARD_NAME = "Ward C";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function buildBedMap(patients) {
  const map = {};
  patients
    .filter((p) => p.ward === WARD_NAME && !p.is_discharged && !p.is_archived)
    .forEach((p) => {
      map[String(parseInt(p.bed_number, 10))] = p;
    });
  return map;
}

// ─── BedCard ─────────────────────────────────────────────────────────────────

function BedCard({ bedNumber, patient, onClick }) {
  const condition = patient?.condition;
  const badge = condition ? CONDITION_CONFIG[condition] : null;

  return (
    <div
      onClick={() => patient && onClick(patient)}
      style={{
        background: "#ffffff",
        border: "1.5px solid #e2e8f0",
        borderRadius: "10px",
        padding: "12px 14px",
        cursor: patient ? "pointer" : "default",
        display: "flex",
        alignItems: "center",
        gap: "12px",
        minHeight: "70px",
        transition: "box-shadow 0.15s, border-color 0.15s",
        boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
      }}
      onMouseEnter={(e) => {
        if (patient) {
          e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.12)";
          e.currentTarget.style.borderColor = "#94a3b8";
        }
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,0.06)";
        e.currentTarget.style.borderColor = "#e2e8f0";
      }}
    >
      {/* Bed icon */}
      <div style={{ flexShrink: 0 }}>
        <svg width="32" height="24" viewBox="0 0 32 24" fill="none">
          <rect x="0" y="12" width="32" height="9" rx="2" fill="#cbd5e1" />
          <rect x="0" y="7" width="7" height="7" rx="1" fill="#cbd5e1" />
          <rect x="0" y="18" width="3" height="6" rx="1" fill="#94a3b8" />
          <rect x="29" y="18" width="3" height="6" rx="1" fill="#94a3b8" />
        </svg>
      </div>

      {/* Text block */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: "11px",
            fontWeight: 700,
            color: "#94a3b8",
            letterSpacing: "0.05em",
          }}
        >
          BED {String(bedNumber).padStart(2, "0")}
        </div>

        {patient ? (
          <div
            style={{
              fontSize: "13px",
              fontWeight: 600,
              color: "#1e293b",
              marginTop: "2px",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {patient.first_name} {patient.last_name}
          </div>
        ) : (
          <div style={{ fontSize: "12px", color: "#cbd5e1", marginTop: "2px" }}>
            EMPTY
          </div>
        )}
      </div>

      {/* Condition badge — coloured only here */}
      {badge && (
        <span
          style={{
            flexShrink: 0,
            fontSize: "10px",
            fontWeight: 700,
            letterSpacing: "0.06em",
            textTransform: "uppercase",
            color: "#fff",
            background: badge.bg,
            borderRadius: "5px",
            padding: "3px 8px",
          }}
        >
          {badge.label}
        </span>
      )}
    </div>
  );
}

// ─── PatientModal ─────────────────────────────────────────────────────────────

function PatientModal({ patient, onClose }) {
  if (!patient) return null;
  const badge = CONDITION_CONFIG[patient.condition];

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.4)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "#fff",
          borderRadius: "14px",
          padding: "28px 32px",
          width: "90%",
          maxWidth: "400px",
          boxShadow: "0 8px 40px rgba(0,0,0,0.2)",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            marginBottom: "4px",
          }}
        >
          <h2 style={{ margin: 0, fontSize: "18px", color: "#0f172a" }}>
            {patient.first_name} {patient.last_name}
          </h2>
          <button
            onClick={onClose}
            style={{
              border: "none",
              background: "none",
              cursor: "pointer",
              fontSize: "22px",
              color: "#94a3b8",
              lineHeight: 1,
            }}
          >
            ×
          </button>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            marginBottom: "20px",
          }}
        >
          <span style={{ fontSize: "12px", color: "#64748b" }}>
            {patient.patient_id}
          </span>
          {badge && (
            <span
              style={{
                fontSize: "10px",
                fontWeight: 700,
                textTransform: "uppercase",
                color: "#fff",
                background: badge.bg,
                borderRadius: "4px",
                padding: "2px 8px",
              }}
            >
              {badge.label}
            </span>
          )}
        </div>

        {/* Details grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "14px",
          }}
        >
          {[
            ["Ward", patient.ward],
            ["Bed", patient.bed_number],
            ["Age", patient.age],
            ["Gender", patient.gender],
            ["Device", patient.assigned_device || "—"],
          ].map(([lbl, val]) => (
            <div key={lbl}>
              <p
                style={{
                  margin: 0,
                  fontSize: "10px",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  color: "#94a3b8",
                }}
              >
                {lbl}
              </p>
              <p
                style={{
                  margin: "2px 0 0",
                  fontSize: "14px",
                  fontWeight: 600,
                  color: "#1e293b",
                  textTransform: "capitalize",
                }}
              >
                {val}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Legend ───────────────────────────────────────────────────────────────────

function Legend() {
  return (
    <div
      style={{
        display: "flex",
        gap: "14px",
        flexWrap: "wrap",
        marginBottom: "20px",
      }}
    >
      {Object.entries(CONDITION_CONFIG).map(([key, { bg, label }]) => (
        <div
          key={key}
          style={{ display: "flex", alignItems: "center", gap: "6px" }}
        >
          <div
            style={{
              width: "10px",
              height: "10px",
              borderRadius: "3px",
              background: bg,
            }}
          />
          <span style={{ fontSize: "12px", color: "#64748b" }}>{label}</span>
        </div>
      ))}
      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
        <div
          style={{
            width: "10px",
            height: "10px",
            borderRadius: "3px",
            background: "#e2e8f0",
          }}
        />
        <span style={{ fontSize: "12px", color: "#64748b" }}>Empty</span>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function Wards() {
  const [selectedPatient, setSelectedPatient] = useState(null);

  const bedMap = buildBedMap(SAMPLE_PATIENTS);
  const beds = Array.from({ length: TOTAL_BEDS }, (_, i) => i + 1);
  const occupied = Object.keys(bedMap).length;
  const available = TOTAL_BEDS - occupied;
  const critical = Object.values(bedMap).filter(
    (p) => p.condition === "critical",
  ).length;

  return (
    <div
      style={{
        padding: "28px",
        fontFamily: "'Inter', 'Segoe UI', sans-serif",
        background: "#f8fafc",
        minHeight: "100vh",
      }}
    >
      {/* Page header */}
      <h1
        style={{
          margin: "0 0 4px",
          fontSize: "22px",
          fontWeight: 800,
          color: "#0f172a",
        }}
      >
        Ward Bed Layout
      </h1>
      <p style={{ margin: "0 0 24px", fontSize: "13px", color: "#64748b" }}>
        {WARD_NAME} · 2 × 5 grid
      </p>

      {/* Ward card */}
      <div
        style={{
          background: "#fff",
          borderRadius: "14px",
          boxShadow: "0 2px 12px rgba(0,0,0,0.08)",
          overflow: "hidden",
        }}
      >
        {/* Ward header bar */}
        <div
          style={{
            background: "#1e40af",
            padding: "16px 24px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "12px",
          }}
        >
          <h2
            style={{
              margin: 0,
              fontSize: "17px",
              fontWeight: 700,
              color: "#fff",
            }}
          >
            {WARD_NAME}
          </h2>
          <div style={{ display: "flex", gap: "20px" }}>
            {[
              { label: "Occupied", value: occupied, color: "#93c5fd" },
              { label: "Available", value: available, color: "#86efac" },
              { label: "Critical", value: critical, color: "#fca5a5" },
            ].map(({ label, value, color }) => (
              <div key={label} style={{ textAlign: "center" }}>
                <div style={{ fontSize: "20px", fontWeight: 800, color }}>
                  {value}
                </div>
                <div
                  style={{
                    fontSize: "10px",
                    color: "rgba(255,255,255,0.65)",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                  }}
                >
                  {label}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Legend + grid */}
        <div style={{ padding: "20px 24px" }}>
          <Legend />
          <div
            style={{
              display: "grid",
              gridTemplateColumns: `repeat(${COLUMNS}, 1fr)`,
              gap: "18px",
            }}
          >
            {beds.map((n) => (
              <BedCard
                key={n}
                bedNumber={n}
                patient={bedMap[String(n)] ?? null}
                onClick={setSelectedPatient}
              />
            ))}
          </div>
        </div>
      </div>

      <PatientModal
        patient={selectedPatient}
        onClose={() => setSelectedPatient(null)}
      />
    </div>
  );
}
