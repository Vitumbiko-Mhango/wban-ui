/**
 * src/pages/staff/Patients.jsx  (REPLACE YOUR EXISTING FILE)
 *
 * Changes from original:
 *  - Loads patients from GET /api/patients/
 *  - Add patient: POST /api/patients/
 *  - Edit patient: PATCH /api/patients/{id}/
 *  - Discharge patient: POST /api/patients/{id}/discharge/
 *  - Passes real onSubmit handlers into PatientForm
 */

import React, { useCallback, useEffect, useState } from "react";
import GeneralTable from "../../components/common/GeneralTable";
import Heading from "../../components/common/Heading";
import { Cpu, Eye, Plus, SquarePen, UserMinus } from "lucide-react";
import Button from "../../components/common/Button";
import PatientForm from "../../components/PatientForm";
import PatientDetails from "../../components/PatientDetails";
import client from "../../api/client";

// Map backend field names → what PatientForm expects
const normalizePatient = (p) => ({
  id: p.id,
  patient_id: p.patient_id,
  firstname: p.first_name,
  surname: p.last_name,
  age: p.age,
  gender: p.gender,
  ward: p.ward,
  bed: p.bed_number,
  assignedDevice: p.assigned_device || "",
  status: p.condition, // stable / warning / critical
  condition: p.condition,
});

const Patients = () => {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [openForm, setOpenForm] = useState(false);
  const [openDetails, setOpenDetails] = useState(false);
  const [editForm, setEditForm] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);

  // ── Fetch ────────────────────────────────────────────────────────────────────
  const fetchPatients = useCallback(async () => {
    try {
      const { data } = await client.get("/patients/");
      const list = data?.results ?? data ?? [];
      setPatients(list.map(normalizePatient));
    } catch {
      setError("Failed to load patients.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPatients();
  }, [fetchPatients]);

  // ── Add ──────────────────────────────────────────────────────────────────────
  const handleAdd = async (formData) => {
    await client.post("/patients/", {
      first_name: formData.firstname,
      last_name: formData.surname,
      age: formData.age,
      gender: formData.gender,
      ward: formData.ward,
      bed_number: formData.bed,
      assigned_device: formData.device || "",
      condition: formData.status,
    });
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
      assigned_device: formData.device || "",
      condition: formData.status,
    });
    setEditForm(false);
    setSelectedPatient(null);
    fetchPatients();
  };

  // ── Discharge ────────────────────────────────────────────────────────────────
  const handleDischarge = async (patient) => {
    if (!window.confirm(`Discharge ${patient.firstname} ${patient.surname}?`))
      return;
    await client.post(`/patients/${patient.id}/discharge/`, {
      discharge_reason: "recovered",
    });
    fetchPatients();
  };

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

      <div className="flex justify-end mt-4">
        <Button
          variant="primary"
          size="md"
          iconLeft={Plus}
          onClick={() => setOpenForm(true)}
        >
          Add Patient
        </Button>
      </div>

      <GeneralTable
        tableTitle="Patient List"
        headers={[
          "Patient ID",
          "Patient Name",
          "Ward",
          "Bed",
          "Assigned Device",
          "Status",
          "Actions",
        ]}
        rows={loading ? [] : patients}
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
            <td className="px-6 py-3 whitespace-nowrap">{row.bed}</td>
            <td className="px-6 py-3 text-primary-a20 whitespace-nowrap">
              <div className="flex items-center gap-1">
                <Cpu className="size-4" />
                {row.assignedDevice || "None"}
              </div>
            </td>
            <td className="px-6 py-3 whitespace-nowrap capitalize">
              {row.status}
            </td>
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
                onClick={() => handleDischarge(row)}
              >
                <UserMinus className="size-4 text-danger-a0 inline-block" />
              </button>
            </td>
          </tr>
        )}
      />

      {loading && (
        <p className="text-center text-sm text-dark-a0/50 py-8">
          Loading patients…
        </p>
      )}

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
    </div>
  );
};

export default Patients;
