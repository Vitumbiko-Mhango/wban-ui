/**
 * src/pages/staff/LiveMonitoring.jsx  (REPLACE YOUR EXISTING FILE)
 *
 * Changes from original:
 *  - Polls GET /api/influx/readings/ every 5 seconds instead of using samplePatients
 *  - Falls back to empty state gracefully if backend is unreachable
 *  - Passes real vitals data into LiveMonitorCard
 */

import React, { useState, useMemo, useEffect, useCallback } from "react";
import Heading from "../../components/common/Heading";
import LiveMonitorCard from "../../components/LiveMonitorCard";
import { Search } from "lucide-react";
import client from "../../api/client";

const HR_HIGH = 100;
const HR_LOW = 50;
const TEMP_HIGH = 38;
const TEMP_LOW = 35;

const CONDITIONS = [
  { label: "All", value: "all" },
  { label: "Normal", value: "normal" },
  { label: "Warning", value: "warning" },
  { label: "High HR", value: "high_hr" },
  { label: "Low HR", value: "low_hr" },
  { label: "High Temp", value: "high_temp" },
  { label: "Low Temp", value: "low_temp" },
  { label: "Falls", value: "falls" },
];

function matchesCondition(p, condition) {
  switch (condition) {
    case "all":
      return true;
    case "normal":
      return (
        p.hr >= HR_LOW &&
        p.hr <= HR_HIGH &&
        p.temp >= TEMP_LOW &&
        p.temp <= TEMP_HIGH
      );
    case "warning":
      return (
        p.hr > HR_HIGH ||
        p.hr < HR_LOW ||
        p.temp > TEMP_HIGH ||
        p.temp < TEMP_LOW
      );
    case "high_hr":
      return p.hr > HR_HIGH;
    case "low_hr":
      return p.hr < HR_LOW;
    case "high_temp":
      return p.temp > TEMP_HIGH;
    case "low_temp":
      return p.temp < TEMP_LOW;
    case "falls":
      return p.fallsDetected;
    default:
      return true;
  }
}

// Shape the InfluxDB response into what LiveMonitorCard expects
// GET /api/influx/readings/ returns an array of { patient_id, patient_name, ward, bed,
//   heart_rate, temperature, spo2, stress_index, fall_detected, timestamp }
const normalize = (r) => ({
  name: r.patient_name ?? `Patient ${r.patient_id}`,
  ward: r.ward ?? "",
  bed: r.bed ?? "",
  hr: r.heart_rate ?? 0,
  temp: r.temperature ?? 0,
  spo2: r.spo2 ?? 0,
  stressIndex: r.stress_index ?? 0,
  fallsDetected: r.fall_detected ?? false,
  timestamp: r.timestamp,
});

const POLL_MS = 5_000;

const LiveMonitoring = () => {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeCondition, setActiveCondition] = useState("all");

  const fetchReadings = useCallback(async () => {
    try {
      const { data } = await client.get("/influx/readings/");
      const list = Array.isArray(data) ? data : (data?.results ?? []);
      setPatients(list.map(normalize));
    } catch {
      // keep existing data; backend may briefly be unreachable
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReadings();
    const interval = setInterval(fetchReadings, POLL_MS);
    return () => clearInterval(interval);
  }, [fetchReadings]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return patients.filter((p) => {
      const matchSearch =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.ward.toLowerCase().includes(q) ||
        p.bed.toLowerCase().includes(q);
      return matchSearch && matchesCondition(p, activeCondition);
    });
  }, [patients, search, activeCondition]);

  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <Heading
          title="Live Patient Monitoring"
          subtitle="Real-time patient vitals with auto-refresh every 5 seconds"
        />
        <div className="mt-2 flex items-center gap-1 text-dark-a0/80 text-sm md:mt-0">
          <div className="size-2 bg-success-a10 rounded-full animate-pulse" />
          Live
        </div>
      </div>

      {/* Filters + search */}
      <div className="mt-6 flex flex-col space-y-4 md:flex-row md:space-y-0 md:items-center md:justify-between">
        <div className="flex flex-wrap gap-2">
          {CONDITIONS.map(({ label, value }) => (
            <button
              key={value}
              onClick={() => setActiveCondition(value)}
              className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${
                activeCondition === value
                  ? "bg-primary-a20 text-white border-primary-a20"
                  : "border-surface-a30 text-dark-a0/60 hover:border-primary-a20 hover:text-primary-a20"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="relative flex md:w-1/3 items-center gap-2">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-dark-a0/40" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 pr-4 py-2 border border-surface-a30 rounded-md focus:outline-none focus:ring-1 focus:ring-primary-a20 focus:border-primary-a20 w-full placeholder:text-sm"
            placeholder="Search patients..."
          />
        </div>
      </div>

      {/* Results */}
      {loading && (
        <p className="text-center text-sm text-dark-a0/50 mt-16">
          Loading live data…
        </p>
      )}
      {!loading && filtered.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6 mt-8">
          {filtered.map((patient) => (
            <LiveMonitorCard key={patient.name} {...patient} />
          ))}
        </div>
      )}
      {!loading && filtered.length === 0 && (
        <div className="mt-16 flex flex-col items-center justify-center text-center text-dark-a0/40">
          <Search className="size-8 mb-3" />
          <p className="text-sm font-medium">No patients found</p>
          <p className="text-xs mt-1">
            {patients.length === 0
              ? "No live readings available. Ensure devices are online."
              : "Try adjusting your search or filter."}
          </p>
        </div>
      )}
    </div>
  );
};

export default LiveMonitoring;
