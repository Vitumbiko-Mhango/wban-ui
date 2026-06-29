import React, { useEffect, useState } from "react";
import { LoaderCircle } from "lucide-react";
import client from "../api/client";

const STATUS_STYLES = {
  Normal: "bg-success-a20 text-success-a10",
  Warning: "bg-warning-a20 text-warning-a10",
  Critical: "bg-danger-a20 text-danger-a10",
};

// Map InfluxDB reading → a display status
const toStatus = (r) => {
  if (r.fall_detected) return "Critical";
  const hr = r.heart_rate;
  const temp = r.temperature;
  const spo2 = r.spo2;
  if (
    (hr && (hr < 40 || hr > 120)) ||
    (temp && (temp < 35 || temp > 38.5)) ||
    (spo2 && spo2 < 85)
  )
    return "Critical";
  if (
    (hr && (hr < 50 || hr > 110)) ||
    (temp && (temp < 36 || temp > 38)) ||
    (spo2 && spo2 < 90)
  )
    return "Warning";
  return "Normal";
};

export function PatientTable() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetch = async () => {
      try {
        const { data } = await client.get("/influx/readings/");
        const list = Array.isArray(data) ? data : (data?.results ?? []);
        setRows(
          list
            .filter((r) => r.patient_name && r.patient_name !== "Unassigned")
            .slice(0, 8) // cap preview at 8 rows
            .map((r) => ({
              id: r.device_id,
              name: r.patient_name,
              ward: r.ward || "—",
              heartRate: r.heart_rate != null ? `${r.heart_rate} bpm` : "—",
              temp: r.temperature != null ? `${r.temperature} °C` : "—",
              fall: r.fall_detected ? "Yes" : "No",
              status: toStatus(r),
            })),
        );
      } catch {
        setError("Could not load live vitals.");
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 py-10 text-sm text-dark-a0/50 bg-surface-a0 border border-dark-a0/10 rounded-b-lg">
        <LoaderCircle className="size-4 animate-spin" /> Loading vitals…
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-8 text-center text-sm text-danger-a0 bg-surface-a0 border border-dark-a0/10 rounded-b-lg">
        {error}
      </div>
    );
  }

  return (
    <div className="overflow-hidden bg-surface-a0 border border-dark-a0/10 rounded-b-lg">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-primary-a20/10">
              {[
                "Patient",
                "Ward",
                "Heart Rate",
                "Temperature",
                "Fall Detection",
                "Status",
              ].map((col) => (
                <th
                  key={col}
                  className="text-left px-5 py-3 text-xs font-medium text-dark-a0 uppercase tracking-wider"
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-a10">
            {rows.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-5 py-8 text-center text-sm text-dark-a0/40"
                >
                  No live readings available.
                </td>
              </tr>
            ) : (
              rows.map((p) => (
                <tr
                  key={p.id}
                  className="hover:bg-surface-a10/30 transition-colors"
                >
                  <td className="px-5 py-3.5 font-medium text-dark-a0/80">
                    {p.name}
                  </td>
                  <td className="px-5 py-3.5 text-dark-a0/60">{p.ward}</td>
                  <td className="px-5 py-3.5 text-dark-a0/60">{p.heartRate}</td>
                  <td className="px-5 py-3.5 text-dark-a0/60">{p.temp}</td>
                  <td className="px-5 py-3.5 text-dark-a0/60">{p.fall}</td>
                  <td className="px-5 py-3.5">
                    <span
                      className={`font-medium text-xs px-2 py-1 rounded-full ${STATUS_STYLES[p.status]}`}
                    >
                      {p.status}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
