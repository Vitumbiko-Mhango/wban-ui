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

const CHIP_STYLES = {
  all: { border: "#1e40af", bg: "#eff6ff", color: "#1e40af" },
  occupied: { border: "#475569", bg: "#f1f5f9", color: "#1e293b" },
  empty: { border: "#94a3b8", bg: "#f8fafc", color: "#475569" },
  stable: { border: "#16a34a", bg: "#dcfce7", color: "#166534" },
  warning: { border: "#ca8a04", bg: "#fef9c3", color: "#854d0e" },
  critical: { border: "#dc2626", bg: "#fee2e2", color: "#991b1b" },
};

const FILTERS = ["all", "occupied", "empty", "stable", "warning", "critical"];
const ALERT_POLL_MS = 10_000;

const FILTER_LABELS = {
  all: "All beds",
  occupied: "Occupied",
  empty: "Empty",
  stable: "Stable",
  warning: "Warning",
  critical: "Critical",
};

const UI = {
  page: "var(--color-surface-a0)",
  card: "var(--color-surface-a0)",
  cardAlt: "var(--color-surface-a10)",
  border: "var(--color-surface-a30)",
  muted: "color-mix(in srgb, var(--color-dark-a0) 55%, transparent)",
  faint: "color-mix(in srgb, var(--color-dark-a0) 38%, transparent)",
  text: "var(--color-dark-a0)",
  primary: "var(--color-primary-a20)",
};

const ALERT_BLINK_STYLE_ID = "wban-bed-alert-blink-styles";
const ALERT_BADGE = {
  critical: {
    label: "Critical alert",
    color: "#dc2626",
    fill: "#fee2e2",
    shadow: "rgba(220, 38, 38, 0.45)",
  },
  warning: {
    label: "Warning alert",
    color: "#ca8a04",
    fill: "#fef3c7",
    shadow: "rgba(202, 138, 4, 0.38)",
  },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

// MODIFIED: Removed discharge filter to show ALL patients
function groupByWard(patients) {
  const map = {};
  patients.forEach((p) => {
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

function bedVisible(bedNum, bedMap, filter) {
  const p = bedMap[String(bedNum)] ?? null;
  if (filter === "all") return true;
  if (filter === "occupied") return !!p;
  if (filter === "empty") return !p;
  return p?.condition === filter;
}

function normalizeKey(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

function getPatientKeys(patient) {
  if (!patient) return [];
  const fullName = [patient.first_name, patient.last_name].filter(Boolean).join(" ");

  return [
    patient.id,
    patient.patient_id,
    fullName,
    `${fullName} ${patient.ward || ""}`,
  ]
    .filter(Boolean)
    .flatMap((value) => [value, normalizeKey(value)]);
}

function getPatientAlertSeverity(patient, alertMap) {
  if (!patient) return null;

  for (const key of getPatientKeys(patient)) {
    const severity = alertMap.get(key);
    if (severity) return severity;
  }

  return null;
}

function buildPatientAlertMap(alerts) {
  const map = new Map();

  const setSeverity = (key, severity) => {
    if (!key) return;
    const normalizedKey = typeof key === "number" ? key : normalizeKey(key);
    const current = map.get(normalizedKey);
    if (current === "critical") return;
    map.set(normalizedKey, severity === "critical" ? "critical" : current || "warning");
  };

  alerts.forEach((alert) => {
    if (alert.is_resolved) return;
    const severity = String(alert.severity || "").toLowerCase();
    if (severity !== "critical" && severity !== "warning") return;

    const patientId = Number(alert.patient);
    if (patientId) {
      setSeverity(patientId, severity);
      setSeverity(String(patientId), severity);
    }

    setSeverity(alert.patient_id, severity);
    setSeverity(alert.patient_name, severity);
    setSeverity(`${alert.patient_name || ""} ${alert.patient_ward || ""}`, severity);
  });

  return map;
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

// ─── FilterChips ──────────────────────────────────────────────────────────────

function FilterChips({ active, onChange }) {
  const dotColor = {
    all: null,
    occupied: "#64748b",
    empty: null,
    stable: "#16a34a",
    warning: "#ca8a04",
    critical: "#dc2626",
  };

  return (
    <div
      style={{
        display: "flex",
        gap: "8px",
        flexWrap: "wrap",
        marginBottom: "20px",
        alignItems: "center",
      }}
    >
      <span
        style={{
          fontSize: "11px",
          fontWeight: 500,
          color: UI.faint,
          marginRight: "2px",
        }}
      >
        Filter
      </span>
      {FILTERS.map((f) => {
        const isActive = active === f;
        const s = CHIP_STYLES[f];
        return (
          <div
            key={f}
            onClick={() => onChange(f)}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "5px",
              fontSize: "12px",
              fontWeight: 500,
              borderRadius: "20px",
              padding: "5px 13px",
              border: `1.5px solid ${isActive ? s.border : UI.border}`,
              background: isActive ? s.bg : UI.card,
              color: isActive ? s.color : UI.muted,
              cursor: "pointer",
              transition: "all 0.15s",
              userSelect: "none",
            }}
          >
            {f === "empty" ? (
              <span
                style={{
                  width: "7px",
                  height: "7px",
                  borderRadius: "2px",
                  border: "1.5px dashed #94a3b8",
                  display: "inline-block",
                }}
              />
            ) : dotColor[f] ? (
              <span
                style={{
                  width: "7px",
                  height: "7px",
                  borderRadius: "50%",
                  background: dotColor[f],
                  display: "inline-block",
                }}
              />
            ) : null}
            {FILTER_LABELS[f]}
          </div>
        );
      })}
    </div>
  );
}

// ─── BedCard ──────────────────────────────────────────────────────────────────

function BedCard({ bedNumber, patient, alertSeverity, onClick }) {
  const [hovered, setHovered] = useState(false);

  if (!patient) {
    return (
      <div
        style={{
          background: UI.cardAlt,
          border: `1.5px dashed ${UI.border}`,
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
              color: UI.faint,
              letterSpacing: "0.07em",
              textTransform: "uppercase",
              marginBottom: "3px",
            }}
          >
            Bed {String(bedNumber).padStart(2, "0")}
          </div>
          <div style={{ fontSize: "12px", color: UI.faint }}>Available</div>
        </div>
      </div>
    );
  }

  const c = CONDITION_CONFIG[patient.condition] || CONDITION_CONFIG.stable;
  const alert = ALERT_BADGE[alertSeverity] || null;
  const cardBackground = alert ? alert.fill : hovered ? c.fill : UI.card;
  const borderColor = alert ? alert.color : hovered ? c.dot : UI.border;

  return (
    <div
      className={alert ? `wban-bed-alert-blink wban-bed-alert-${alertSeverity}` : undefined}
      onClick={() => onClick(patient)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        "--bed-alert-color": alert?.color,
        "--bed-alert-shadow": alert?.shadow,
        "--bed-alert-fill": alert?.fill,
        background: cardBackground,
        border: `1.5px solid ${borderColor}`,
        borderLeft: `5px solid ${alert?.color || c.dot}`,
        borderRadius: "0 12px 12px 0",
        padding: "12px 14px",
        minHeight: "86px",
        display: "flex",
        alignItems: "flex-start",
        gap: "10px",
        cursor: "pointer",
        transition: "background 0.15s, border-color 0.15s, box-shadow 0.15s",
        position: "relative",
      }}
    >
      <BedSVG color={alert?.color || c.dot} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: "10px",
            fontWeight: 500,
            color: UI.faint,
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
            color: hovered ? "#0f172a" : UI.text,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {patient.first_name} {patient.last_name}
        </div>
        <div style={{ fontSize: "11px", color: hovered ? "#64748b" : UI.muted, marginTop: "3px" }}>
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
        {alert && (
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "4px",
              fontSize: "10px",
              fontWeight: 800,
              borderRadius: "20px",
              padding: "2px 8px",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              background: UI.card,
              color: alert.color,
              border: `1px solid ${alert.color}`,
              marginTop: "5px",
              marginLeft: "4px",
            }}
          >
            <span
              className="wban-bed-alert-dot"
              style={{
                width: "7px",
                height: "7px",
                borderRadius: "50%",
                background: alert.color,
                display: "inline-block",
              }}
            />
            {alert.label}
          </div>
        )}
        {/* NEW: Show discharge status if patient is discharged */}
        {patient.is_discharged && (
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "4px",
              fontSize: "9px",
              fontWeight: 500,
              borderRadius: "20px",
              padding: "2px 8px",
              background: UI.cardAlt,
              color: UI.muted,
              marginTop: "3px",
              marginLeft: "4px",
            }}
          >
            <span
              style={{
                width: "6px",
                height: "6px",
                borderRadius: "50%",
                background: "#94a3b8",
                display: "inline-block",
              }}
            />
            Discharged
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Corridor ─────────────────────────────────────────────────────────────────

function Corridor() {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "4px",
      }}
    >
      <div style={{ width: "1px", flex: 1, background: UI.border }} />
      <div
        style={{
          width: "5px",
          height: "5px",
          borderRadius: "50%",
          background: UI.border,
        }}
      />
      <div style={{ width: "1px", flex: 1, background: UI.border }} />
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
        borderBottom: `0.5px solid ${UI.border}`,
        alignItems: "center",
      }}
    >
      <span
        style={{
          fontSize: "10px",
          fontWeight: 500,
          color: UI.faint,
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
          <span style={{ fontSize: "12px", color: UI.muted }}>{label}</span>
        </div>
      ))}
      {/* NEW: Discharged indicator */}
      <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
        <span
          style={{
            width: "8px",
            height: "8px",
            borderRadius: "50%",
            background: "#94a3b8",
            display: "inline-block",
          }}
        />
        <span style={{ fontSize: "12px", color: UI.muted }}>Discharged</span>
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
          background: UI.card,
          borderRadius: "16px",
          width: "90%",
          maxWidth: "400px",
          boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            background: patient.is_discharged ? UI.cardAlt : c.fill,
            borderBottom: `2px solid ${patient.is_discharged ? "#94a3b8" : c.dot}`,
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
                  background: patient.is_discharged ? "#94a3b8" : c.dot,
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
                    color: patient.is_discharged ? UI.text : "#0f172a",
                  }}
                >
                  {patient.first_name} {patient.last_name}
                </div>
                <div
                  style={{
                    fontSize: "12px",
                    color: patient.is_discharged ? UI.muted : "#64748b",
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
              color: patient.is_discharged ? "#64748b" : c.text,
              background: UI.card,
              borderRadius: "20px",
              padding: "3px 10px",
              border: `1px solid ${patient.is_discharged ? "#94a3b8" : c.dot}`,
            }}
          >
            <span
              style={{
                width: "7px",
                height: "7px",
                borderRadius: "50%",
                background: patient.is_discharged ? "#94a3b8" : c.dot,
                display: "inline-block",
              }}
            />
            {patient.is_discharged ? "Discharged" : c.label}
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
            // NEW: Show discharge information if available
            ...(patient.is_discharged
              ? [
                  [
                    "Discharged At",
                    patient.discharged_at
                      ? new Date(patient.discharged_at).toLocaleDateString()
                      : "—",
                  ],
                  ["Discharge Reason", patient.discharge_reason || "—"],
                ]
              : []),
          ].map(([lbl, val]) => (
            <div
              key={lbl}
              style={{ borderLeft: `2px solid ${UI.border}`, paddingLeft: "10px" }}
            >
              <div
                style={{
                  fontSize: "10px",
                  fontWeight: 600,
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                  color: UI.faint,
                }}
              >
                {lbl}
              </div>
              <div
                style={{
                  fontSize: "13px",
                  fontWeight: 600,
                  color: UI.text,
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

// ─── WardPanel ────────────────────────────────────────────────────────────────

function WardPanel({ wardName, wardPatients, alertMap, onSelectPatient }) {
  const [filter, setFilter] = useState("all");

  const bedMap = buildBedMap(wardPatients);
  const occupied = wardPatients.filter((p) => !p.is_discharged).length;
  const discharged = wardPatients.filter((p) => p.is_discharged).length;
  const critical = wardPatients.filter(
    (p) => p.condition === "critical" && !p.is_discharged,
  ).length;
  const activeAlertCounts = wardPatients.reduce(
    (counts, patient) => {
      const severity = getPatientAlertSeverity(patient, alertMap);
      if (severity === "critical") counts.critical += 1;
      if (severity === "warning") counts.warning += 1;
      return counts;
    },
    { critical: 0, warning: 0 },
  );
  const empty = 10 - wardPatients.length;

  const rows = [
    [1, 2],
    [3, 4],
    [5, 6],
    [7, 8],
    [9, 10],
  ];

  const visibleRows = rows.filter(
    ([l, r]) => bedVisible(l, bedMap, filter) || bedVisible(r, bedMap, filter),
  );

  return (
    <div
      style={{
        background: UI.card,
        borderRadius: "12px",
        overflow: "hidden",
        marginBottom: "28px",
        border: `0.5px solid ${UI.border}`,
      }}
    >
      {/* Header */}
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
            { label: "Discharged", value: discharged, color: "#94a3b8" },
            { label: "Empty", value: empty, color: "rgba(255,255,255,0.35)" },
            { label: "Critical", value: critical, color: "#fca5a5" },
            {
              label: "Active Alerts",
              value: activeAlertCounts.critical + activeAlertCounts.warning,
              color: activeAlertCounts.critical ? "#fecaca" : "#fde68a",
            },
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

      {/* Body */}
      <div style={{ padding: "20px 24px 28px" }}>
        <Legend />
        <FilterChips active={filter} onChange={setFilter} />

        {/* Side labels */}
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
              color: UI.faint,
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
              color: UI.faint,
              textTransform: "uppercase",
              letterSpacing: "0.07em",
              textAlign: "right",
            }}
          >
            Side B →
          </div>
        </div>

        {/* Bed rows */}
        {visibleRows.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: "32px 0",
              fontSize: "13px",
              color: UI.faint,
            }}
          >
            No beds match this filter.
          </div>
        ) : (
          visibleRows.map(([leftN, rightN]) => {
            const showL = bedVisible(leftN, bedMap, filter);
            const showR = bedVisible(rightN, bedMap, filter);
            return (
              <div
                key={leftN}
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 40px 1fr",
                  marginBottom: "14px",
                  alignItems: "stretch",
                }}
              >
                <div>
                  {showL ? (
                    <BedCard
                      bedNumber={leftN}
                      patient={bedMap[String(leftN)] ?? null}
                      alertSeverity={getPatientAlertSeverity(
                        bedMap[String(leftN)] ?? null,
                        alertMap,
                      )}
                      onClick={onSelectPatient}
                    />
                  ) : (
                    <div style={{ minHeight: "86px" }} />
                  )}
                </div>
                <Corridor />
                <div>
                  {showR ? (
                    <BedCard
                      bedNumber={rightN}
                      patient={bedMap[String(rightN)] ?? null}
                      alertSeverity={getPatientAlertSeverity(
                        bedMap[String(rightN)] ?? null,
                        alertMap,
                      )}
                      onClick={onSelectPatient}
                    />
                  ) : (
                    <div style={{ minHeight: "86px" }} />
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function Wards() {
  const [patients, setPatients] = useState([]);
  const [activeAlerts, setActiveAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [activeWard, setActiveWard] = useState(null);

  useEffect(() => {
    if (document.getElementById(ALERT_BLINK_STYLE_ID)) return;

    const style = document.createElement("style");
    style.id = ALERT_BLINK_STYLE_ID;
    style.textContent = `
      @keyframes wbanBedAlertPulse {
        0%, 100% {
          background: var(--bed-alert-fill);
          box-shadow:
            0 0 0 0 var(--bed-alert-shadow),
            inset 0 0 0 2px var(--bed-alert-color);
          outline: 0 solid var(--bed-alert-shadow);
          transform: translateY(0);
        }
        50% {
          background: var(--color-surface-a0);
          box-shadow:
            0 0 0 8px var(--bed-alert-shadow),
            inset 0 0 0 3px var(--bed-alert-color);
          outline: 4px solid var(--bed-alert-shadow);
          transform: translateY(-2px);
        }
      }

      @keyframes wbanBedAlertDotPulse {
        0%, 100% {
          opacity: 1;
          transform: scale(1);
        }
        50% {
          opacity: 0.35;
          transform: scale(1.45);
        }
      }

      .wban-bed-alert-blink {
        animation: wbanBedAlertPulse 0.95s ease-in-out infinite !important;
      }

      .wban-bed-alert-critical {
        animation-duration: 0.7s;
      }

      .wban-bed-alert-warning {
        animation-duration: 1.15s;
      }

      .wban-bed-alert-dot {
        animation: wbanBedAlertDotPulse 0.7s ease-in-out infinite !important;
      }
    `;
    document.head.appendChild(style);
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        // MODIFIED: Get ALL patients including discharged and archived
        const { data } = await client.get(
          "/patients/?include_archived=true&page_size=500",
        );
        if (!cancelled) {
          const list = Array.isArray(data) ? data : (data.results ?? []);
          setPatients(list);
        }
      } catch (error) {
        if (!cancelled) {
          console.error("Failed to load patients:", error);
          setError("Could not load patient data. Please try again.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    const loadAlerts = async () => {
      try {
        const { data } = await client.get("/alerts/", {
          params: { page_size: 500, is_resolved: false },
        });
        if (!cancelled) {
          setActiveAlerts(data?.results ?? data ?? []);
        }
      } catch {
        if (!cancelled) setActiveAlerts([]);
      }
    };

    loadAlerts();
    const interval = window.setInterval(loadAlerts, ALERT_POLL_MS);

    const handleResolved = (event) => {
      const id = event.detail?.id;
      if (!id) return;
      setActiveAlerts((prev) => prev.filter((alert) => alert.id !== id));
    };

    window.addEventListener("wban:alert-resolved", handleResolved);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
      window.removeEventListener("wban:alert-resolved", handleResolved);
    };
  }, []);

  const activePatients = patients.filter(
    (p) => !p.is_discharged && !p.is_archived,
  );

  const wardMap = groupByWard(activePatients);
  const wardNames = Object.keys(wardMap).sort();
  const alertMap = buildPatientAlertMap(activeAlerts);

  useEffect(() => {
    if (wardNames.length && activeWard === null) setActiveWard(wardNames[0]);
  }, [wardNames.join(",")]);

  const totalPatients = patients.length;
  const activeCount = patients.filter((p) => !p.is_discharged).length;
  const dischargedCount = patients.filter((p) => p.is_discharged).length;
  const archivedCount = patients.filter((p) => p.is_archived).length;

  const visibleWards = activeWard
    ? wardNames.filter((w) => w === activeWard)
    : wardNames;

  if (loading) {
    return (
      <div
        style={{
          padding: "40px",
          textAlign: "center",
          color: UI.muted,
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
        background: UI.page,
        minHeight: "100vh",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          flexWrap: "wrap",
          gap: "16px",
        }}
      >
        <div>
          <h1
            style={{
              margin: "0 0 4px",
              fontSize: "22px",
              fontWeight: 800,
              color: UI.text,
            }}
          >
            Ward Bed Layout
          </h1>
          <p style={{ margin: "0 0 20px", fontSize: "13px", color: UI.muted }}>
            {totalPatients} total patients ({activeCount} active,{" "}
            {dischargedCount} discharged, {archivedCount} archived) across{" "}
            {wardNames.length} ward{wardNames.length !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

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
                borderColor: activeWard === w ? UI.primary : UI.border,
                background: activeWard === w ? UI.primary : UI.card,
                color: activeWard === w ? "#fff" : UI.muted,
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
        <p style={{ color: UI.faint, fontSize: "14px" }}>No patients found.</p>
      ) : (
        visibleWards.map((w) => (
          <WardPanel
            key={w}
            wardName={w}
            wardPatients={wardMap[w]}
            alertMap={alertMap}
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
