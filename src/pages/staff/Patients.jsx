/**
 * src/pages/staff/Patients.jsx
 *
 * Adds the Archive feature on top of the existing Add/Edit/Discharge flow:
 *  - View toggle: Active / Discharged / Archived (matches is_discharged + is_archived in Postgres)
 *  - Archive   : POST /api/patients/{id}/archive/    (only allowed once discharged)
 *  - Unarchive : POST /api/patients/{id}/unarchive/
 *  - Readmit   : POST /api/patients/{id}/readmit/    (brings a discharged/archived patient back to Active)
 */

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router";
import GeneralTable from "../../components/common/GeneralTable";
import Heading from "../../components/common/Heading";
import {
  Archive,
  ArchiveRestore,
  Cpu,
  Eye,
  Plus,
  RotateCcw,
  SquarePen,
  UserMinus,
} from "lucide-react";
import Button from "../../components/common/Button";
import PatientForm from "../../components/PatientForm";
import PatientDetails from "../../components/PatientDetails";
import client from "../../api/client";

const getAssignedDeviceId = (patient) => {
  const assigned = patient.assigned_device || patient.device;
  if (typeof assigned === "string") return assigned;
  return assigned?.device_id || patient.device_id || "";
};

const getAssignedDeviceName = (patient) => {
  const assigned = patient.assigned_device || patient.device;
  if (typeof assigned === "object" && assigned !== null) {
    return assigned.name || assigned.device_name || "";
  }
  return patient.device_name || "";
};

const isDeviceAssigned = (device) =>
  Boolean(
    device?.patient ||
    device?.assigned_patient ||
    device?.patient_id ||
    device?.is_paired,
  );

const getAssignedPatientId = (device) => {
  const assigned = device?.assigned_patient || device?.patient;
  if (typeof assigned === "object" && assigned !== null) {
    return assigned.id || assigned.patient_id || null;
  }
  return device?.patient_id || assigned || null;
};

// Map backend field names → what PatientForm / table expects.
// Carries is_discharged / is_archived through so the view tabs can filter.
const normalizePatient = (p) => ({
  id: p.id,
  patient_id: p.patient_id,
  firstname: p.first_name,
  surname: p.last_name,
  age: p.age,
  gender: p.gender,
  ward: p.ward,
  bed: p.bed_number,
  disease: p.disease || "",
  assignedDevice: getAssignedDeviceId(p),
  deviceName: getAssignedDeviceName(p),
  status: p.condition, // stable / warning / critical
  condition: p.condition,
  is_discharged: p.is_discharged,
  discharged_at: p.discharged_at,
  discharge_reason: p.discharge_reason,
  is_archived: p.is_archived,
  archived_at: p.archived_at,
});

const VIEWS = [
  { key: "active", label: "Active" },
  { key: "discharged", label: "Discharged" },
  { key: "archived", label: "Archived" },
];

const DISCHARGE_REASONS = [
  { value: "recovered", label: "Recovered" },
  { value: "deceased", label: "Deceased" },
  { value: "home_based_care", label: "Home-based Care" },
  { value: "referred", label: "Referred" },
];

const formatDate = (iso) =>
  iso
    ? new Date(iso).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "—";

const Patients = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialView = searchParams.get("view");
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [openForm, setOpenForm] = useState(false);
  const [openDetails, setOpenDetails] = useState(false);
  const [editForm, setEditForm] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [dischargePatient, setDischargePatient] = useState(null);
  const [dischargeForm, setDischargeForm] = useState({
    reason: "",
    notes: "",
  });
  const [view, setView] = useState(
    VIEWS.some((item) => item.key === initialView) ? initialView : "active",
  ); // active | discharged | archived

  // ── Fetch — always pull archived rows too, filter client-side by tab ───────
  // include_archived=true is required or the backend hides is_archived=True rows entirely.
  const fetchPatients = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await client.get(
        "/patients/?include_archived=true&page_size=500",
      );
      const list = data?.results ?? data ?? [];
      setPatients(list.map(normalizePatient));
      setError("");
    } catch {
      setError("Failed to load patients.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPatients();
  }, [fetchPatients]);

  useEffect(() => {
    setSearchParams(view === "active" ? {} : { view }, { replace: true });
  }, [view, setSearchParams]);

  // ── Tab counts + filtered rows ───────────────────────────────────────────────
  const counts = useMemo(
    () => ({
      active: patients.filter((p) => !p.is_discharged && !p.is_archived).length,
      discharged: patients.filter((p) => p.is_discharged && !p.is_archived)
        .length,
      archived: patients.filter((p) => p.is_archived).length,
    }),
    [patients],
  );

  const visibleRows = useMemo(() => {
    if (view === "active")
      return patients.filter((p) => !p.is_discharged && !p.is_archived);
    if (view === "discharged")
      return patients.filter((p) => p.is_discharged && !p.is_archived);
    return patients.filter((p) => p.is_archived); // archived
  }, [patients, view]);

  // ── Device helpers (unchanged) ───────────────────────────────────────────────
  const getDeviceByDeviceId = async (deviceId) => {
    const { data } = await client.get("/devices/");
    const list = data?.results ?? data ?? [];
    return list.find((device) => device.device_id === deviceId);
  };

  const assertDeviceAssignable = async (deviceId, patientId) => {
    if (!deviceId) return null;

    const device = await getDeviceByDeviceId(deviceId);
    if (!device) {
      throw new Error(`${deviceId} is not a registered device_id.`);
    }

    const assignedPatientId = getAssignedPatientId(device);
    if (
      isDeviceAssigned(device) &&
      (!patientId || String(assignedPatientId) !== String(patientId))
    ) {
      throw new Error(`${deviceId} is already assigned to another patient.`);
    }

    return device;
  };

  const syncDevice = async (patientId, newDeviceId, oldDeviceId) => {
    if (newDeviceId === oldDeviceId) return;

    const newDevice = newDeviceId
      ? await assertDeviceAssignable(newDeviceId, patientId)
      : null;

    if (oldDeviceId) {
      try {
        const { data: devices } = await client.get(
          `/devices/?patient=${patientId}`,
        );
        const list = devices?.results ?? devices ?? [];
        const old = list.find((d) => d.device_id === oldDeviceId);
        if (old) await client.post(`/devices/${old.id}/unpair/`);
      } catch {
        /* ignore */
      }
    }

    if (newDevice) {
      await client.post(`/devices/${newDevice.id}/pair/`, {
        patient_id: patientId,
      });
    }
  };

  // ── Add ──────────────────────────────────────────────────────────────────────
  const handleAdd = async (formData) => {
    await assertDeviceAssignable(formData.device_id, null);

    const { data: patient } = await client.post("/patients/", {
      first_name: formData.firstname,
      last_name: formData.surname,
      age: formData.age,
      gender: formData.gender,
      ward: formData.ward,
      bed_number: formData.bed,
      disease: formData.disease,
      condition: formData.status,
    });
    if (formData.device_id) {
      await syncDevice(patient.id, formData.device_id, null);
    }
    setOpenForm(false);
    fetchPatients();
  };

  // ── Edit ─────────────────────────────────────────────────────────────────────
  const handleEdit = async (formData) => {
    await client.patch(`/patients/${selectedPatient.id}/`, {
      first_name: formData.firstname,
      last_name: formData.surname,
      age: formData.age,
      gender: formData.gender,
      ward: formData.ward,
      bed_number: formData.bed,
      disease: formData.disease,
      condition: formData.status,
    });
    await syncDevice(
      selectedPatient.id,
      formData.device_id,
      selectedPatient.assignedDevice,
    );
    setEditForm(false);
    setSelectedPatient(null);
    fetchPatients();
  };

  // ── Discharge ────────────────────────────────────────────────────────────────
  const openDischargeModal = (patient) => {
    setDischargePatient(patient);
    setDischargeForm({ reason: "", notes: "" });
    setError("");
  };

  const closeDischargeModal = () => {
    setDischargePatient(null);
    setDischargeForm({ reason: "", notes: "" });
  };

  const handleDischarge = async (event) => {
    event.preventDefault();
    if (!dischargePatient || !dischargeForm.reason) return;

    await client.post(`/patients/${dischargePatient.id}/discharge/`, {
      discharge_reason: dischargeForm.reason,
      discharge_notes: dischargeForm.notes,
    });
    closeDischargeModal();
    fetchPatients();
  };

  // ── Archive — only allowed once discharged (enforced by backend too) ────────
  const handleArchive = async (patient) => {
    if (
      !window.confirm(
        `Archive ${patient.firstname} ${patient.surname}? They will be hidden from active and discharged lists.`,
      )
    )
      return;
    try {
      await client.post(`/patients/${patient.id}/archive/`);
      fetchPatients();
    } catch (err) {
      setError(err?.response?.data?.error || "Could not archive patient.");
    }
  };

  // ── Unarchive — moves back to Discharged tab ─────────────────────────────────
  const handleUnarchive = async (patient) => {
    await client.post(`/patients/${patient.id}/unarchive/`);
    fetchPatients();
  };

  // ── Readmit — clears discharge + archive, moves back to Active ──────────────
  const handleReadmit = async (patient) => {
    if (
      !window.confirm(
        `Readmit ${patient.firstname} ${patient.surname} to Active?`,
      )
    )
      return;
    await client.post(`/patients/${patient.id}/readmit/`);
    fetchPatients();
  };

  // ── Table columns depend on the active tab ───────────────────────────────────
  const headers =
    view === "active"
      ? [
          "Patient ID",
          "Patient Name",
          "Ward",
          "Bed",
          "Disease",
          "device_id",
          "Status",
          "Actions",
        ]
      : view === "discharged"
        ? [
            "Patient ID",
            "Patient Name",
            "Ward",
            "Discharged",
            "Reason",
          "Actions",
        ]
      : ["Patient ID", "Patient Name", "Ward", "Archived", "Actions"];

  const sortableColumns = useMemo(() => {
    const base = {
      "Patient ID": (row) => row.patient_id,
      "Patient Name": (row) => `${row.firstname} ${row.surname}`,
      Ward: (row) => row.ward,
    };

    if (view === "active") {
      return {
        ...base,
        Bed: (row) => row.bed,
        Disease: (row) => row.disease,
        device_id: (row) => row.assignedDevice || "",
        Status: (row) => row.status,
      };
    }

    if (view === "discharged") {
      return {
        ...base,
        Discharged: (row) => row.discharged_at || "",
        Reason: (row) => row.discharge_reason || "",
      };
    }

    return {
      ...base,
      Archived: (row) => row.archived_at || "",
    };
  }, [view]);

  return (
    <div>
      <Heading
        title="Patients"
        subtitle="Register patients and assign WBAN monitoring devices"
      />

      {error && (
        <div className="mt-4 px-3 py-2 rounded-md bg-red-50 border border-red-200 text-sm text-danger-a0">
          {error}
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mt-4">
        {/* View tabs */}
        <div className="flex items-center gap-1 bg-surface-a10 rounded-lg p-1 w-fit">
          {VIEWS.map((v) => (
            <button
              key={v.key}
              onClick={() => setView(v.key)}
              className={`px-3.5 py-1.5 text-sm font-medium rounded-md transition-colors ${
                view === v.key
                  ? "bg-white text-primary-a20 shadow-sm"
                  : "text-dark-a0/55 hover:text-dark-a0"
              }`}
            >
              {v.label}
              <span className="ml-1.5 text-xs text-dark-a0/40">
                ({counts[v.key]})
              </span>
            </button>
          ))}
        </div>

        {view === "active" && (
          <Button
            variant="primary"
            size="md"
            iconLeft={Plus}
            onClick={() => setOpenForm(true)}
          >
            Add Patient
          </Button>
        )}
      </div>

      <div className="mt-4">
        <GeneralTable
          tableTitle="Patient List"
          headers={headers}
          rows={loading ? [] : visibleRows}
          sortableColumns={sortableColumns}
          renderRows={(row) => (
            <tr
              key={row.id}
              className="border border-surface-a20 text-sm hover:bg-surface-a10 cursor-pointer"
            >
              <td className="px-6 py-3 whitespace-nowrap">{row.patient_id}</td>
              <td className="px-6 py-3 font-medium whitespace-nowrap flex flex-col">
                {row.firstname} {row.surname}
                <span className="text-xs font-normal text-dark-a0/60">
                  {row.age}yrs, {row.gender}
                </span>
              </td>
              <td className="px-6 py-3 whitespace-nowrap">{row.ward}</td>

              {/* ── Active tab columns ── */}
              {view === "active" && (
                <>
                  <td className="px-6 py-3 whitespace-nowrap">{row.bed}</td>
                  <td className="px-6 py-3 whitespace-nowrap">
                    {row.disease || "—"}
                  </td>
                  <td className="px-6 py-3 text-primary-a20 whitespace-nowrap">
                    <div className="flex items-center gap-1">
                      <Cpu className="size-4" />
                      {row.assignedDevice || "None"}
                    </div>
                  </td>
                  <td className="px-6 py-3 whitespace-nowrap capitalize">
                    {row.status}
                  </td>
                </>
              )}

              {/* ── Discharged tab columns ── */}
              {view === "discharged" && (
                <>
                  <td className="px-6 py-3 whitespace-nowrap text-dark-a0/70">
                    {formatDate(row.discharged_at)}
                  </td>
                  <td className="px-6 py-3 whitespace-nowrap capitalize text-dark-a0/70">
                    {row.discharge_reason || "—"}
                  </td>
                </>
              )}

              {/* ── Archived tab columns ── */}
              {view === "archived" && (
                <td className="px-6 py-3 whitespace-nowrap text-dark-a0/70">
                  {formatDate(row.archived_at)}
                </td>
              )}

              {/* ── Actions — contextual per tab ── */}
              <td className="px-6 py-3 space-x-4 whitespace-nowrap">
                <button
                  title="View Patient"
                  onClick={() => {
                    setSelectedPatient(row);
                    setOpenDetails(true);
                  }}
                >
                  <Eye className="size-4 text-primary-a20 inline-block" />
                </button>

                {view === "active" && (
                  <>
                    <button
                      title="Edit Patient"
                      onClick={() => {
                        setSelectedPatient(row);
                        setEditForm(true);
                      }}
                    >
                      <SquarePen className="size-4 text-primary-a20 inline-block" />
                    </button>
                    <button
                      title="Discharge Patient"
                      onClick={() => openDischargeModal(row)}
                    >
                      <UserMinus className="size-4 text-danger-a0 inline-block" />
                    </button>
                  </>
                )}

                {view === "discharged" && (
                  <>
                    <button
                      title="Archive Patient"
                      onClick={() => handleArchive(row)}
                    >
                      <Archive className="size-4 text-dark-a0/60 inline-block" />
                    </button>
                    <button
                      title="Readmit Patient"
                      onClick={() => handleReadmit(row)}
                    >
                      <RotateCcw className="size-4 text-success-a10 inline-block" />
                    </button>
                  </>
                )}

                {view === "archived" && (
                  <>
                    <button
                      title="Unarchive Patient"
                      onClick={() => handleUnarchive(row)}
                    >
                      <ArchiveRestore className="size-4 text-primary-a20 inline-block" />
                    </button>
                    <button
                      title="Readmit Patient"
                      onClick={() => handleReadmit(row)}
                    >
                      <RotateCcw className="size-4 text-success-a10 inline-block" />
                    </button>
                  </>
                )}
              </td>
            </tr>
          )}
        />

        {loading && (
          <p className="text-center text-sm text-dark-a0/50 py-8">
            Loading patients…
          </p>
        )}

        {!loading && visibleRows.length === 0 && (
          <p className="text-center text-sm text-dark-a0/40 py-10">
            No {view} patients found.
          </p>
        )}
      </div>

      {openForm && (
        <PatientForm
          closeForm={() => setOpenForm(false)}
          onSubmit={handleAdd}
        />
      )}
      {editForm && (
        <PatientForm
          closeForm={() => {
            setEditForm(false);
            setSelectedPatient(null);
          }}
          onSubmit={handleEdit}
          patient={selectedPatient}
        />
      )}
      {openDetails && (
        <PatientDetails
          closeForm={() => {
            setOpenDetails(false);
            setSelectedPatient(null);
          }}
          patient={selectedPatient}
        />
      )}
      {dischargePatient && (
        <div className="fixed z-50 inset-0 flex items-center justify-center bg-dark-a0/80">
          <form
            onSubmit={handleDischarge}
            className="bg-light-a0 p-6 rounded-lg w-full max-w-lg m-4 shadow-xl"
          >
            <h3 className="text-lg font-bold text-dark-a0">
              Discharge Patient
            </h3>
            <p className="text-sm text-dark-a0/60 mt-1">
              Select why {dischargePatient.firstname}{" "}
              {dischargePatient.surname} is being discharged.
            </p>

            <div className="mt-5 space-y-4">
              <div>
                <label className="label">Discharge Reason</label>
                <select
                  required
                  value={dischargeForm.reason}
                  onChange={(event) =>
                    setDischargeForm((current) => ({
                      ...current,
                      reason: event.target.value,
                    }))
                  }
                  className="input"
                >
                  <option value="">Select a reason</option>
                  {DISCHARGE_REASONS.map((reason) => (
                    <option key={reason.value} value={reason.value}>
                      {reason.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="label">
                  Discharge Notes
                  <span className="ml-1 font-normal text-dark-a0/40 text-xs">
                    (optional)
                  </span>
                </label>
                <textarea
                  rows={4}
                  value={dischargeForm.notes}
                  onChange={(event) =>
                    setDischargeForm((current) => ({
                      ...current,
                      notes: event.target.value,
                    }))
                  }
                  className="input resize-none"
                  placeholder="Add clinical notes, referral details, or home-care instructions..."
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <Button
                type="button"
                variant="secondary"
                onClick={closeDischargeModal}
              >
                Cancel
              </Button>
              <Button type="submit" variant="primary">
                Discharge Patient
              </Button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default Patients;
