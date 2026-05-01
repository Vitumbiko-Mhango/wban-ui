import React, { useState, useMemo } from "react";
import Heading from "../../components/common/Heading";
import LiveMonitorCard from "../../components/LiveMonitorCard";
import { Search } from "lucide-react";
import { samplePatients } from "../../samplePatients";

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

function matchesCondition(patient, condition) {
  switch (condition) {
    case "all":
      return true;
    case "normal":
      return (
        patient.hr <= HR_HIGH &&
        patient.hr >= HR_LOW &&
        patient.temp <= TEMP_HIGH &&
        patient.temp >= TEMP_LOW
      );
    case "warning":
      return (
        patient.hr > HR_HIGH ||
        patient.hr < HR_LOW ||
        patient.temp > TEMP_HIGH ||
        patient.temp < TEMP_LOW
      );
    case "high_hr":
      return patient.hr > HR_HIGH;
    case "low_hr":
      return patient.hr < HR_LOW;
    case "high_temp":
      return patient.temp > TEMP_HIGH;
    case "low_temp":
      return patient.temp < TEMP_LOW;
    case "falls":
      return patient.fallsDetected;
    default:
      return true;
  }
}

const LiveMonitoring = () => {
  const [search, setSearch] = useState("");
  const [activeCondition, setActiveCondition] = useState("all");

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return samplePatients.filter((p) => {
      const matchesSearch =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.ward.toLowerCase().includes(q) ||
        p.bed.toLowerCase().includes(q);
      return matchesSearch && matchesCondition(p, activeCondition);
    });
  }, [search, activeCondition]);

  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <Heading
          title={"Live Patient Monitoring"}
          subtitle={
            "Real-time patient vitals with auto-refresh every 3 seconds"
          }
        />
        <div className="mt-2 flex items-center gap-1 text-dark-a0/80 text-sm md:mt-0">
          <div className="size-2 bg-success-a10 rounded-full animate-pulse" />
          Live
        </div>
      </div>

      {/* filter and search container */}
      <div className="mt-6 flex flex-col space-y-4 md:flex-row md:space-y-0 md:items-center md:justify-between">
        {/* condition filters */}
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

        {/* search */}
        <div className="relative flex md:w-1/3 items-center gap-2">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-dark-a0/40" />
          <input
            type="search"
            name="search"
            id="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 pr-4 py-2 border border-surface-a30 rounded-md focus:outline-none focus:ring-1 focus:ring-primary-a20 focus:border-primary-a20 w-full placeholder:text-sm"
            placeholder="Search patients, ward, bed..."
          />
        </div>
      </div>

      {/* results */}
      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6 mt-8">
          {filtered.map((patient) => (
            <LiveMonitorCard key={patient.name} {...patient} />
          ))}
        </div>
      ) : (
        <div className="mt-16 flex flex-col items-center justify-center text-center text-dark-a0/40">
          <Search className="size-8 mb-3" />
          <p className="text-sm font-medium">No patients found</p>
          <p className="text-xs mt-1">Try adjusting your search or filter</p>
        </div>
      )}
    </div>
  );
};

export default LiveMonitoring;
