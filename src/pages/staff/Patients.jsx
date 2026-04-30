import React, { useState } from "react";
import GeneralTable from "../../components/common/GeneralTable";
import Heading from "../../components/common/Heading";
import { Cpu, Eye, Plus, SquarePen, UserMinus } from "lucide-react";
import Button from "../../components/common/Button";
import PatientForm from "../../components/PatientForm";
import PatientDetails from "../../components/PatientDetails";

const Patients = () => {
  const [openForm, setOpenForm] = useState(false);
  const [openDetails, setOpenDetails] = useState(false);
  const [editForm, setEditForm] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);

  const patientsData = [
    {
      id: "PT-2026-001",
      firstname: "Francis",
      surname: "Mwale",
      age: 45,
      gender: "Male",
      ward: "Cardiology",
      bed: "B12",
      assignedDevice: "ESP32-A1",
      status: "Stable",
      condition: "Severe Malaria",
    },
    {
      id: "PT-2026-002",
      firstname: "Jane",
      surname: "Smith",
      age: 60,
      gender: "Female",
      ward: "Neurology",
      bed: "B15",
      assignedDevice: "ESP32-B1",
      status: "Critical",
      condition: "aspiration pneumonia",
    },
    {
      id: "PT-2026-003",
      firstname: "Michael",
      surname: "Johnson",
      age: 50,
      gender: "Male",
      ward: "Orthopedics",
      bed: "B20",
      assignedDevice: "ESP32-C1",
      status: "Stable",
      condition: "asthma exacerbation",
    },
  ];

  return (
    <div>
      {/* heading */}
      <Heading
        title={"Patients"}
        subtitle={"Register patients and assign WBAN monitoring devices"}
      />

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
        tableTitle={"Patient List"}
        headers={[
          "Patient ID",
          "Patient Name",
          "Ward",
          "Bed",
          "Assigned Device",
          "status",
          "Actions",
        ]}
        rows={patientsData}
        renderRows={(row) => (
          <tr
            key={row.id}
            className="border border-surface-a20 text-sm hover:bg-surface-a10 cursor-pointer"
          >
            <td className="px-6 py-3 whitespace-nowrap">{row.id}</td>
            <td className="px-6 py-3 font-medium whitespace-nowrap flex flex-col">
              {row.firstname} {row.surname}
              <span className="text-xs font-normal text-dark-a0/60">
                {row.age}yrs, {row.gender} - {row.condition}
              </span>
            </td>
            <td className="px-6 py-3 whitespace-nowrap">{row.ward}</td>
            <td className="px-6 py-3 whitespace-nowrap">{row.bed}</td>
            <td className="px-6 py-3 text-primary-a20 whitespace-nowrap">
              <div className="flex items-center gap-1">
                <Cpu className="size-4" />
                {row.assignedDevice}
              </div>
            </td>
            <td className="px-6 py-3 whitespace-nowrap">{row.status}</td>
            <td className="px-6 py-3 space-x-4 whitespace-nowrap">
              <button
                title="View Patient"
                onClick={() => setOpenDetails(true)}
                className="text-sm hover:underline cursor-pointer"
              >
                <Eye className="size-4  text-primary-a20 inline-block" />
              </button>
              <button
                title="Edit Patient"
                onClick={() => {
                  setSelectedPatient(row);
                  setEditForm(true);
                }}
                className="text-sm hover:underline cursor-pointer"
              >
                <SquarePen className="size-4 text-primary-a20 inline-block" />
              </button>
              <button
                title="Discharge Patient"
                className="text-sm hover:underline cursor-pointer"
              >
                <UserMinus className="size-4 text-danger-a0 inline-block" />
              </button>
            </td>
          </tr>
        )}
      />

      {openForm && <PatientForm closeForm={() => setOpenForm(false)} />}
      {editForm && (
        <PatientForm
          closeForm={() => setEditForm(false)}
          patient={selectedPatient}
        />
      )}
      {openDetails && (
        <PatientDetails closeForm={() => setOpenDetails(false)} />
      )}
    </div>
  );
};

export default Patients;
