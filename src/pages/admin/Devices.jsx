/**
 * src/pages/admin/Devices.jsx  (REPLACE YOUR EXISTING FILE — only the fetch calls change)
 *
 * Changes from original:
 *  - All fetch() calls replaced with client (Axios) so the JWT token is attached
 *  - Removed demo/fallback paths that generated fake API keys
 *  - Everything else (UI, modals, filters) is identical to your original
 */

import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Copy,
  Cpu,
  Eye,
  Link,
  Link2Off,
  Plus,
  PowerOff,
  Radio,
  TriangleAlert,
  X,
} from "lucide-react";
import DashboardCard from "../../components/DashboardCard";
import Button from "../../components/common/Button";
import GeneralTable from "../../components/common/GeneralTable";
import Heading from "../../components/common/Heading";
import useClickOutside from "../../hooks/useClickOutside";
import client from "../../api/client";
import { formatDate } from "../../utils/DateFormatter";

// ── Helpers ───────────────────────────────────────────────────────────────────
const getDeviceName = (d) => d.name || d.device_name || "Unnamed device";
const getDeviceStatus = (d) => (d.status || "offline").toLowerCase();
const getDeviceKey = (d) => d.id || d.device_id;
const getFirmware = (d) => d.firmware_version || d.firmware || "Not set";
const getAssignedName = (d) => {
  const p = d.assigned_patient || d.patient;
  if (!p) return "Unassigned";
  if (typeof p === "string") return p;
  return p.name || p.full_name || "Assigned patient";
};
const isPaired = (d) =>
  Boolean(d.assigned_patient || d.patient || d.patient_id || d.is_paired);
const patientHasDevice = (p) =>
  Boolean(p.device || p.assigned_device || p.device_id);
const normalizeList = (data, fallback) =>
  Array.isArray(data)
    ? data
    : Array.isArray(data?.results)
      ? data.results
      : fallback;

const STATUS_META = {
  online: {
    label: "Online",
    dot: "bg-success-a10 animate-pulse",
    badge: "bg-success-a20 text-success-a0",
  },
  offline: {
    label: "Offline",
    dot: "bg-surface-a50",
    badge: "bg-surface-a20 text-dark-a0/60",
  },
  low_battery: {
    label: "Low Battery",
    dot: "bg-warning-a10",
    badge: "bg-warning-a20 text-warning-a0",
  },
  faulty: {
    label: "Faulty",
    dot: "bg-danger-a10",
    badge: "bg-danger-a20 text-danger-a0",
  },
};

const tableHeaders = [
  "Device ID",
  "Device Name",
  "Status",
  "Assigned Patient",
  "Battery",
  "Last Seen",
  "Firmware",
  "Actions",
];

const StatusBadge = ({ status }) => {
  const meta = STATUS_META[status] || STATUS_META.offline;
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full px-2.5 py-1 text-xs font-bold ${meta.badge}`}
    >
      <span className={`size-2 rounded-full ${meta.dot}`} />
      {meta.label}
    </span>
  );
};

const BatteryBar = ({ value = 0 }) => {
  const level = Math.max(0, Math.min(100, Number(value) || 0));
  const color =
    level <= 20
      ? "bg-danger-a10"
      : level <= 40
        ? "bg-warning-a10"
        : "bg-success-a10";
  return (
    <div className="min-w-32">
      <div className="mb-1 flex items-center justify-between text-xs text-dark-a0/55">
        <span>{level}%</span>
      </div>
      <div className="h-2 rounded-full bg-surface-a20">
        <div
          className={`h-2 rounded-full ${color}`}
          style={{ width: `${level}%` }}
        />
      </div>
    </div>
  );
};

const ModalShell = ({ children, onClose, maxWidth = "max-w-xl" }) => {
  const ref = useRef(null);
  useClickOutside(ref, onClose);
  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-dark-a0/80">
      <div
        ref={ref}
        className={`relative m-4 max-h-[90vh] w-full ${maxWidth} overflow-y-auto rounded-lg bg-light-a0 p-6`}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-5 top-5 cursor-pointer text-dark-a0/40 hover:text-dark-a0"
        >
          <X className="size-4" />
        </button>
        {children}
      </div>
    </div>
  );
};

// ── Register Device Modal ─────────────────────────────────────────────────────
const RegisterDeviceModal = ({ onClose, onRegistered }) => {
  const [form, setForm] = useState({
    device_id: "",
    name: "",
    firmware_version: "",
  });
  const [apiKey, setApiKey] = useState("");
  const [isSubmitting, setSubmit] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const set = (field, val) => setForm((p) => ({ ...p, [field]: val }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmit(true);
    try {
      const { data } = await client.post("/devices/", {
        device_id: form.device_id.trim().toLowerCase(),
        name: form.name.trim(),
        firmware_version: form.firmware_version.trim(),
      });
      setApiKey(data.api_key || "");
      onRegistered(data);
    } catch (err) {
      setError(
        err?.response?.data?.detail ||
          err?.response?.data?.device_id?.[0] ||
          "Unable to register device.",
      );
    } finally {
      setSubmit(false);
    }
  };

  return (
    <ModalShell onClose={onClose}>
      <h3 className="text-lg font-bold text-dark-a0">Register Device</h3>
      <p className="mt-1 text-sm text-dark-a0/60">
        Add a WBAN device and generate the API key for the ESP32 firmware.
      </p>

      {apiKey ? (
        <div className="mt-6 space-y-4">
          <div className="rounded-md border border-warning-a10 bg-warning-a20 px-4 py-3">
            <p className="text-sm font-bold text-warning-a0">
              This key will only be shown once.
            </p>
            <p className="mt-1 text-sm text-warning-a0">
              Copy it now and flash it to the ESP32 before closing.
            </p>
          </div>
          <div className="rounded bg-surface-a10 p-3 font-mono text-sm break-all">
            {apiKey}
          </div>
          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              iconLeft={Copy}
              onClick={async () => {
                await navigator.clipboard.writeText(apiKey);
                setCopied(true);
              }}
            >
              {copied ? "Copied" : "Copy Key"}
            </Button>
            <Button onClick={onClose}>Done</Button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="label">Device ID</label>
            <input
              required
              value={form.device_id}
              onChange={(e) => set("device_id", e.target.value.toLowerCase())}
              pattern="[a-z0-9]+(_[a-z0-9]+)*"
              title="Use lowercase letters, numbers, and hyphens, for example esp32-001."
              placeholder="esp32_001"
              className="input"
            />
          </div>
          <div>
            <label className="label">
              Device Name{" "}
              <span className="font-normal text-dark-a0/40">(optional)</span>
            </label>
            <input
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              placeholder="Esp32"
              className="input"
            />
          </div>
          <div>
            <label className="label">
              Firmware Version{" "}
              <span className="font-normal text-dark-a0/40">(optional)</span>
            </label>
            <input
              value={form.firmware_version}
              onChange={(e) => set("firmware_version", e.target.value)}
              placeholder="v1.2.4"
              className="input"
            />
          </div>
          {error && <p className="error-text">{error}</p>}
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting} iconLeft={Plus}>
              {isSubmitting ? "Registering…" : "Register"}
            </Button>
          </div>
        </form>
      )}
    </ModalShell>
  );
};

// ── Pair Device Modal ─────────────────────────────────────────────────────────
const PairDeviceModal = ({ device, patients, onClose, onPaired }) => {
  const [patientId, setPatientId] = useState("");
  const [isSubmitting, setSubmit] = useState(false);
  const [error, setError] = useState("");

  const available = patients.filter(
    (p) => !p.is_discharged && !patientHasDevice(p),
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmit(true);
    try {
      const { data } = await client.post(
        `/devices/${getDeviceKey(device)}/pair/`,
        {
          patient: Number(patientId),
        },
      );
      onPaired({
        ...device,
        ...data,
        assigned_patient: data.assigned_patient || data.patient,
      });
      onClose();
    } catch (err) {
      setError(err?.response?.data?.detail || "Unable to pair device.");
    } finally {
      setSubmit(false);
    }
  };

  return (
    <ModalShell onClose={onClose}>
      <h3 className="text-lg font-bold text-dark-a0">Pair Device</h3>
      <p className="mt-1 text-sm text-dark-a0/60">
        Assign {device.device_id} to an active patient without a device.
      </p>
      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <div>
          <label className="label">Patient</label>
          <select
            required
            value={patientId}
            onChange={(e) => setPatientId(e.target.value)}
            className="input"
          >
            <option value="">Select patient...</option>
            {available.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name || `${p.first_name} ${p.last_name}`} — {p.ward}
              </option>
            ))}
          </select>
          {available.length === 0 && (
            <p className="mt-2 text-sm text-dark-a0/50">
              No active unpaired patients available.
            </p>
          )}
        </div>
        {error && <p className="error-text">{error}</p>}
        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting || available.length === 0}
            iconLeft={Link}
          >
            {isSubmitting ? "Pairing…" : "Pair"}
          </Button>
        </div>
      </form>
    </ModalShell>
  );
};

// ── API Key Modal (unchanged from original) ───────────────────────────────────
const ApiKeyModal = ({ device, onClose }) => {
  const [copied, setCopied] = useState(false);
  return (
    <ModalShell onClose={onClose}>
      <h3 className="text-lg font-bold text-dark-a0">Device API Key</h3>
      <p className="mt-1 text-sm text-dark-a0/60">{device.device_id}</p>
      {device.api_key ? (
        <div className="mt-6 space-y-4">
          <div className="rounded-md border border-warning-a10 bg-warning-a20 px-4 py-3">
            <p className="text-sm font-bold text-warning-a0">
              Only shown immediately after registration.
            </p>
          </div>
          <div className="rounded bg-surface-a10 p-3 font-mono text-sm break-all">
            {device.api_key}
          </div>
          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              iconLeft={Copy}
              onClick={async () => {
                await navigator.clipboard.writeText(device.api_key);
                setCopied(true);
              }}
            >
              {copied ? "Copied" : "Copy Key"}
            </Button>
            <Button onClick={onClose}>Done</Button>
          </div>
        </div>
      ) : (
        <div className="mt-6 rounded-md bg-surface-a10 p-4 text-sm text-dark-a0/65">
          Key no longer visible. Re-register if a new key is needed.
        </div>
      )}
    </ModalShell>
  );
};

// ── Main Component ────────────────────────────────────────────────────────────
const Devices = () => {
  const [devices, setDevices] = useState([]);
  const [patients, setPatients] = useState([]);
  const [statusFilter, setStatusFilter] = useState("all");
  const [pairingFilter, setPairingFilter] = useState("all");
  const [registerOpen, setRegisterOpen] = useState(false);
  const [pairingDevice, setPairingDevice] = useState(null);
  const [apiKeyDevice, setApiKeyDevice] = useState(null);
  const [actionError, setActionError] = useState("");

  const fetchDevices = async () => {
    try {
      const { data } = await client.get("/devices/");
      setDevices(normalizeList(data, []));
    } catch {
      /* keep existing */
    }
  };

  useEffect(() => {
    fetchDevices();
    const interval = setInterval(fetchDevices, 30_000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    client
      .get("/patients/?is_discharged=false")
      .then(({ data }) => setPatients(normalizeList(data, [])))
      .catch(() => {});
  }, []);

  const stats = useMemo(
    () => ({
      total: devices.length,
      online: devices.filter((d) => getDeviceStatus(d) === "online").length,
      offline: devices.filter((d) => getDeviceStatus(d) === "offline").length,
      faulty: devices.filter((d) => getDeviceStatus(d) === "faulty").length,
    }),
    [devices],
  );

  const filtered = useMemo(
    () =>
      devices.filter((d) => {
        const s = getDeviceStatus(d);
        const matchStatus = statusFilter === "all" || s === statusFilter;
        const matchPairing =
          pairingFilter === "all" ||
          (pairingFilter === "paired" && isPaired(d)) ||
          (pairingFilter === "unpaired" && !isPaired(d));
        return matchStatus && matchPairing;
      }),
    [devices, statusFilter, pairingFilter],
  );

  const upsert = (updated) =>
    setDevices((prev) =>
      prev.some((d) => getDeviceKey(d) === getDeviceKey(updated))
        ? prev.map((d) =>
            getDeviceKey(d) === getDeviceKey(updated) ? updated : d,
          )
        : [updated, ...prev],
    );

  const handleUnpair = async (device) => {
    if (
      !window.confirm(
        `Unpair ${device.device_id} from ${getAssignedName(device)}?`,
      )
    )
      return;
    setActionError("");
    try {
      const { data } = await client.post(
        `/devices/${getDeviceKey(device)}/unpair/`,
      );
      upsert({
        ...device,
        ...data,
        assigned_patient: null,
        patient: null,
        status: data.status || "offline",
      });
    } catch (err) {
      setActionError(err?.response?.data?.detail || "Unable to unpair device.");
    }
  };

  const renderRows = (device) => {
    const status = getDeviceStatus(device);
    return (
      <tr key={getDeviceKey(device)} className="text-sm hover:bg-surface-a10">
        <td className="border border-surface-a30 px-6 py-4 font-mono text-xs">
          {device.device_id}
        </td>
        <td className="border border-surface-a30 px-6 py-4 font-medium">
          {getDeviceName(device)}
        </td>
        <td className="border border-surface-a30 px-6 py-4">
          <StatusBadge status={status} />
        </td>
        <td className="border border-surface-a30 px-6 py-4 text-dark-a0/70">
          {getAssignedName(device)}
        </td>
        <td className="border border-surface-a30 px-6 py-4">
          <BatteryBar value={device.battery_level} />
        </td>
        <td className="border border-surface-a30 px-6 py-4 whitespace-nowrap text-dark-a0/65">
          {formatDate(device.last_seen) || "Not seen yet"}
        </td>
        <td className="border border-surface-a30 px-6 py-4 whitespace-nowrap text-dark-a0/65">
          {getFirmware(device)}
        </td>
        <td className="border border-surface-a30 px-6 py-4">
          <div className="flex flex-wrap gap-2">
            {isPaired(device) ? (
              <Button
                variant="outline"
                size="sm"
                iconLeft={Link2Off}
                onClick={() => handleUnpair(device)}
              >
                Unpair
              </Button>
            ) : (
              <Button
                variant="outline"
                size="sm"
                iconLeft={Link}
                onClick={() => setPairingDevice(device)}
              >
                Pair
              </Button>
            )}
            <Button
              variant="secondary"
              size="sm"
              iconLeft={Eye}
              onClick={() => setApiKeyDevice(device)}
            >
              View API Key
            </Button>
          </div>
        </td>
      </tr>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <Heading
          title="Devices"
          subtitle="Register, pair and monitor WBAN sensor devices."
        />
        <Button
          variant="primary"
          size="md"
          iconLeft={Plus}
          onClick={() => setRegisterOpen(true)}
        >
          Register Device
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <DashboardCard title="Total Devices" total={stats.total} Icon={Cpu} />
        <DashboardCard
          title="Online"
          total={stats.online}
          Icon={Radio}
          iconClass="text-success-a10"
        />
        <DashboardCard
          title="Offline"
          total={stats.offline}
          Icon={PowerOff}
          iconClass="text-dark-a0/45"
        />
        <DashboardCard
          title="Faulty"
          total={stats.faulty}
          Icon={TriangleAlert}
          iconClass="text-danger-a10"
        />
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="input sm:w-56"
        >
          <option value="all">All statuses</option>
          <option value="online">Online</option>
          <option value="offline">Offline</option>
          <option value="faulty">Faulty</option>
          <option value="low_battery">Low battery</option>
        </select>
        <div className="inline-flex rounded-md border border-surface-a30 bg-white p-1">
          {[
            { label: "All", value: "all" },
            { label: "Paired only", value: "paired" },
            { label: "Unpaired only", value: "unpaired" },
          ].map((o) => (
            <button
              key={o.value}
              type="button"
              onClick={() => setPairingFilter(o.value)}
              className={`rounded px-3 py-1.5 text-sm font-medium transition-colors ${pairingFilter === o.value ? "bg-primary-a20 text-light-a0" : "text-dark-a0/65 hover:bg-surface-a10"}`}
            >
              {o.label}
            </button>
          ))}
        </div>
        <span className="text-xs text-dark-a0/45 sm:ml-auto">
          Refreshes every 30 seconds
        </span>
      </div>

      {actionError && (
        <div className="rounded-md border border-danger-a10 bg-danger-a20 px-4 py-3 text-sm text-danger-a0">
          {actionError}
        </div>
      )}

      <GeneralTable
        tableTitle="Devices"
        headers={tableHeaders}
        rows={filtered}
        renderRows={renderRows}
        showSearch={false}
      />

      {registerOpen && (
        <RegisterDeviceModal
          onClose={() => setRegisterOpen(false)}
          onRegistered={upsert}
        />
      )}
      {pairingDevice && (
        <PairDeviceModal
          device={pairingDevice}
          patients={patients}
          onClose={() => setPairingDevice(null)}
          onPaired={upsert}
        />
      )}
      {apiKeyDevice && (
        <ApiKeyModal
          device={apiKeyDevice}
          onClose={() => setApiKeyDevice(null)}
        />
      )}
    </div>
  );
};

export default Devices;
