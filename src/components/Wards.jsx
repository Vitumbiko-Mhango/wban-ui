import { useState, useEffect } from "react";
import client from "../api/client";

// ─── Constants ────────────────────────────────────────────────────────────────

const CONDITION_CONFIG = {
  stable: { dot: "#16a34a", fill: "#dcfce7", text: "#166534", label: "Stable" },
  warning: {
    dot: "#ca8a04",
    fill: "#fef9c3",
    text: "#854d0e",
    label: "Warning",
  },
  critical: {
    dot: "#dc2626",
    fill: "#fee2e2",
    text: "#991b1b",
    label: "Critical",
  },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function groupByWard(patients) {
  const map = {};
  patients
    .filter((p) => !p.is_discharged && !p.is_archived)
    .forEach((p) => {
      const w = p.ward || "Unassigned";
      if (!map[w]) map[w] = [];
      map[w].push(p);
    });
  return map;
}

function buildBedMap(wardPatients) {
  const map = {};
  wardPatients.forEach((p) => {
    const n = parseInt(p.bed_number, 10);
    if (!isNaN(n)) map[String(n)] = p;
  });
  return map;
}

function totalBeds(bedMap) {
  const nums = Object.keys(bedMap).map(Number);
  const max = nums.length > 0 ? Math.max(...nums) : 0;
  const ceil = max % 2 === 0 ? max : max + 1;
  return Math.max(10, ceil);
}

// ─── BedSVG ───────────────────────────────────────────────────────────────────

function BedSVG({ color }) {
  const c = color || "#d1d5db";
  return (
    <svg
      width="34"
      height="26"
      viewBox="0 0 34 26"
      fill="none"
      aria-hidden="true"
      style={{ flexShrink: 0, marginTop: "2px" }}
    >
      <rect
        x="1"
        y="12"
        width="32"
        height="10"
        rx="3"
        fill={c}
        fillOpacity="0.2"
        stroke={c}
        strokeWidth="1.2"
      />
      <rect
        x="1"
        y="6"
        width="8"
        height="7"
        rx="2"
        fill={c}
        fillOpacity="0.3"
        stroke={c}
        strokeWidth="1.2"
      />
      <rect
        x="1"
        y="20"
        width="4"
        height="5"
        rx="1.5"
        fill={c}
        fillOpacity="0.5"
      />
      <rect
        x="29"
        y="20"
        width="4"
        height="5"
        rx="1.5"
        fill={c}
        fillOpacity="0.5"
      />
      <line
        x1="9"
        y1="16"
        x2="33"
        y2="16"
        stroke={c}
        strokeWidth="0.8"
        strokeOpacity="0.45"
      />
    </svg>
  );
}

// ─── BedCard ──────────────────────────────────────────────────────────────────

function BedCard({ bedNumber, patient, onClick }) {
  const [hovered, setHovered] = useState(false);

  if (!patient) {
    return (
      <div
        style={{
          background: "var(--surface-1, #f8fafc)",
          border: "1.5px dashed #d1d5db",
          borderRadius: "12px",
          padding: "12px 14px",
          minHeight: "86px",
          display: "flex",
          alignItems: "center",
          gap: "10px",
        }}
      >
        <BedSVG color={null} />
        <div>
          <div
            style={{
              fontSize: "10px",
              fontWeight: 500,
              color: "#94a3b8",
              letterSpacing: "0.07em",
              textTransform: "uppercase",
              marginBottom: "3px",
            }}
          >
            Bed {String(bedNumber).padStart(2, "0")}
          </div>
          <div style={{ fontSize: "12px", color: "#94a3b8" }}>Available</div>
        </div>
      </div>
    );
  }

  const c = CONDITION_CONFIG[patient.condition] || CONDITION_CONFIG.stable;

  return (
    <div
      onClick={() => onClick(patient)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: hovered ? c.fill : "var(--surface-2, #ffffff)",
        border: `0.5px solid ${hovered ? c.dot : "var(--border, #e2e8f0)"}`,
        borderLeft: `3px solid ${c.dot}`,
        borderRadius: "0 12px 12px 0",
        padding: "12px 14px",
        minHeight: "86px",
        display: "flex",
        alignItems: "flex-start",
        gap: "10px",
        cursor: "pointer",
        transition: "background 0.15s, border-color 0.15s",
      }}
    >
      <BedSVG color={c.dot} />

      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: "10px",
            fontWeight: 500,
            color: "#94a3b8",
            letterSpacing: "0.07em",
            textTransform: "uppercase",
            marginBottom: "3px",
          }}
        >
          Bed {String(bedNumber).padStart(2, "0")}
        </div>
        <div
          style={{
            fontSize: "13px",
            fontWeight: 500,
            color: "var(--text-primary, #0f172a)",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {patient.first_name} {patient.last_name}
        </div>
        <div
          style={{
            fontSize: "11px",
            color: "var(--text-secondary, #64748b)",
            marginTop: "3px",
          }}
        >
          {patient.disease || patient.diagnosis || "—"} · Age {patient.age}
        </div>
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "4px",
            fontSize: "10px",
            fontWeight: 500,
            borderRadius: "20px",
            padding: "2px 8px",
            textTransform: "uppercase",
            letterSpacing: "0.05em",
            background: c.fill,
            color: c.text,
            marginTop: "5px",
          }}
        >
          <span
            style={{
              width: "6px",
              height: "6px",
              borderRadius: "50%",
              background: c.dot,
              display: "inline-block",
            }}
          />
          {c.label}
        </div>
      </div>
    </div>
  );
}

// ─── PatientModal ─────────────────────────────────────────────────────────────

function PatientModal({ patient, onClose }) {
  if (!patient) return null;
  const c = CONDITION_CONFIG[patient.condition] || CONDITION_CONFIG.stable;
  const ini = (
    (patient.first_name?.[0] ?? "") + (patient.last_name?.[0] ?? "")
  ).toUpperCase();

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(15,23,42,0.45)",
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
          borderRadius: "16px",
          width: "90%",
          maxWidth: "400px",
          boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            background: c.fill,
            borderBottom: `2px solid ${c.dot}`,
            padding: "20px 24px 16px",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div
                style={{
                  width: "44px",
                  height: "44px",
                  borderRadius: "50%",
                  background: c.dot,
                  color: "#fff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "15px",
                  fontWeight: 700,
                  flexShrink: 0,
                }}
              >
                {ini}
              </div>
              <div>
                <div
                  style={{
                    fontSize: "17px",
                    fontWeight: 600,
                    color: "#0f172a",
                  }}
                >
                  {patient.first_name} {patient.last_name}
                </div>
                <div
                  style={{
                    fontSize: "12px",
                    color: "#64748b",
                    marginTop: "2px",
                  }}
                >
                  {patient.patient_id}
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              style={{
                border: "none",
                background: "none",
                cursor: "pointer",
                fontSize: "22px",
                color: "#94a3b8",
                lineHeight: 1,
                padding: "0 0 0 8px",
              }}
            >
              ×
            </button>
          </div>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "5px",
              marginTop: "12px",
              fontSize: "11px",
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              color: c.text,
              background: "#fff",
              borderRadius: "20px",
              padding: "3px 10px",
              border: `1px solid ${c.dot}`,
            }}
          >
            <span
              style={{
                width: "7px",
                height: "7px",
                borderRadius: "50%",
                background: c.dot,
                display: "inline-block",
              }}
            />
            {c.label}
          </div>
        </div>

        <div
          style={{
            padding: "20px 24px 24px",
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "16px",
          }}
        >
          {[
            ["Ward", patient.ward],
            ["Bed", `Bed ${patient.bed_number}`],
            ["Age", `${patient.age} yrs`],
            ["Gender", patient.gender],
            ["Disease", patient.disease || patient.diagnosis || "—"],
            ["Device", patient.assigned_device || "—"],
          ].map(([lbl, val]) => (
            <div
              key={lbl}
              style={{ borderLeft: "2px solid #e2e8f0", paddingLeft: "10px" }}
            >
              <div
                style={{
                  fontSize: "10px",
                  fontWeight: 600,
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                  color: "#94a3b8",
                }}
              >
                {lbl}
              </div>
              <div
                style={{
                  fontSize: "13px",
                  fontWeight: 600,
                  color: "#0f172a",
                  marginTop: "3px",
                  textTransform: "capitalize",
                }}
              >
                {val}
              </div>
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
        gap: "16px",
        flexWrap: "wrap",
        marginBottom: "20px",
        paddingBottom: "16px",
        borderBottom: "0.5px solid #e2e8f0",
        alignItems: "center",
      }}
    >
      <span
        style={{
          fontSize: "10px",
          fontWeight: 500,
          color: "#94a3b8",
          textTransform: "uppercase",
          letterSpacing: "0.07em",
        }}
      >
        Status
      </span>
      {Object.entries(CONDITION_CONFIG).map(([key, { dot, label }]) => (
        <div
          key={key}
          style={{ display: "flex", alignItems: "center", gap: "5px" }}
        >
          <span
            style={{
              width: "8px",
              height: "8px",
              borderRadius: "50%",
              background: dot,
              display: "inline-block",
            }}
          />
          <span style={{ fontSize: "12px", color: "#64748b" }}>{label}</span>
        </div>
      ))}
    </div>
  );
}

// ─── WardPanel ────────────────────────────────────────────────────────────────

function WardPanel({ wardName, wardPatients, onSelectPatient }) {
  const bedMap = buildBedMap(wardPatients);
  const total = totalBeds(bedMap);
  const occupied = wardPatients.length;
  const empty = total - occupied;
  const critical = wardPatients.filter(
    (p) => p.condition === "critical",
  ).length;

  const rows = [];
  for (let i = 1; i <= total; i += 2) {
    rows.push([i, i + 1]);
  }

  return (
    <div
      style={{
        background: "#fff",
        borderRadius: "12px",
        overflow: "hidden",
        marginBottom: "28px",
        border: "0.5px solid #e2e8f0",
      }}
    >
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
        <div>
          <div
            style={{
              fontSize: "10px",
              fontWeight: 500,
              color: "rgba(255,255,255,0.6)",
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              marginBottom: "2px",
            }}
          >
            General ward
          </div>
          <div style={{ fontSize: "17px", fontWeight: 500, color: "#fff" }}>
            {wardName}
          </div>
        </div>
        <div style={{ display: "flex", gap: "24px" }}>
          {[
            { label: "Occupied", value: occupied, color: "#93c5fd" },
            { label: "Empty", value: empty, color: "rgba(255,255,255,0.35)" },
            { label: "Critical", value: critical, color: "#fca5a5" },
          ].map(({ label, value, color }) => (
            <div key={label} style={{ textAlign: "center" }}>
              <div style={{ fontSize: "22px", fontWeight: 500, color }}>
                {value}
              </div>
              <div
                style={{
                  fontSize: "10px",
                  color: "rgba(255,255,255,0.6)",
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                }}
              >
                {label}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ padding: "20px 24px 28px" }}>
        <Legend />

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 40px 1fr",
            marginBottom: "8px",
          }}
        >
          <div
            style={{
              fontSize: "10px",
              fontWeight: 500,
              color: "#94a3b8",
              textTransform: "uppercase",
              letterSpacing: "0.07em",
            }}
          >
            ← Side A
          </div>
          <div />
          <div
            style={{
              fontSize: "10px",
              fontWeight: 500,
              color: "#94a3b8",
              textTransform: "uppercase",
              letterSpacing: "0.07em",
              textAlign: "right",
            }}
          >
            Side B →
          </div>
        </div>

        {rows.map(([leftN, rightN], ri) => (
          <div
            key={ri}
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 40px 1fr",
              marginBottom: "14px",
              alignItems: "stretch",
            }}
          >
            <BedCard
              bedNumber={leftN}
              patient={bedMap[String(leftN)] ?? null}
              onClick={onSelectPatient}
            />

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: "4px",
              }}
            >
              <div style={{ width: "1px", flex: 1, background: "#e2e8f0" }} />
              <div
                style={{
                  width: "5px",
                  height: "5px",
                  borderRadius: "50%",
                  background: "#e2e8f0",
                }}
              />
              <div style={{ width: "1px", flex: 1, background: "#e2e8f0" }} />
            </div>

            <BedCard
              bedNumber={rightN}
              patient={bedMap[String(rightN)] ?? null}
              onClick={onSelectPatient}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function Wards() {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [activeWard, setActiveWard] = useState(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const { data } = await client.get("/patients/?is_discharged=false");
        if (!cancelled) {
          const list = Array.isArray(data) ? data : (data.results ?? []);
          setPatients(list);
        }
      } catch {
        if (!cancelled)
          setError("Could not load patient data. Please try again.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const wardMap = groupByWard(patients);
  const wardNames = Object.keys(wardMap).sort();

  useEffect(() => {
    if (wardNames.length && activeWard === null) setActiveWard(wardNames[0]);
  }, [wardNames.join(",")]);

  const activeCount = patients.filter(
    (p) => !p.is_discharged && !p.is_archived,
  ).length;
  const visibleWards = activeWard
    ? wardNames.filter((w) => w === activeWard)
    : wardNames;

  if (loading) {
    return (
      <div
        style={{
          padding: "40px",
          textAlign: "center",
          color: "#64748b",
          fontFamily: "'Inter','Segoe UI',sans-serif",
        }}
      >
        Loading ward data…
      </div>
    );
  }

  if (error) {
    return (
      <div
        style={{
          padding: "40px",
          textAlign: "center",
          color: "#dc2626",
          fontFamily: "'Inter','Segoe UI',sans-serif",
        }}
      >
        {error}
      </div>
    );
  }

  return (
    <div
      style={{
        padding: "28px",
        fontFamily: "'Inter','Segoe UI',sans-serif",
        background: "#f8fafc",
        minHeight: "100vh",
      }}
    >
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
      <p style={{ margin: "0 0 20px", fontSize: "13px", color: "#64748b" }}>
        {activeCount} active patient{activeCount !== 1 ? "s" : ""} across{" "}
        {wardNames.length} ward{wardNames.length !== 1 ? "s" : ""}
      </p>

      {wardNames.length > 1 && (
        <div
          style={{
            display: "flex",
            gap: "8px",
            flexWrap: "wrap",
            marginBottom: "24px",
          }}
        >
          {wardNames.map((w) => (
            <button
              key={w}
              onClick={() => setActiveWard(activeWard === w ? null : w)}
              style={{
                padding: "6px 18px",
                borderRadius: "20px",
                border: "1.5px solid",
                borderColor: activeWard === w ? "#1e40af" : "#e2e8f0",
                background: activeWard === w ? "#1e40af" : "#fff",
                color: activeWard === w ? "#fff" : "#64748b",
                fontSize: "13px",
                fontWeight: 600,
                cursor: "pointer",
                transition: "all 0.15s",
              }}
            >
              {w}
            </button>
          ))}
        </div>
      )}

      {wardNames.length === 0 ? (
        <p style={{ color: "#94a3b8", fontSize: "14px" }}>
          No active patients found.
        </p>
      ) : (
        visibleWards.map((w) => (
          <WardPanel
            key={w}
            wardName={w}
            wardPatients={wardMap[w]}
            onSelectPatient={setSelectedPatient}
          />
        ))
      )}

      <PatientModal
        patient={selectedPatient}
        onClose={() => setSelectedPatient(null)}
      />
    </div>
  );
}
