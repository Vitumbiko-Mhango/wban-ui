import React from "react";
import GeneralTable from "../../components/common/GeneralTable";
import Heading from "../../components/common/Heading";
import { Cpu, Eye, Plus, SquarePen, UserMinus } from "lucide-react";
import Button from "../../components/common/Button";

const Patients = () => {
  const patientsData = [
    {
      id: "PT-2026-001",
      name: "John Doe",
      age: 45,
      gender: "Male",
      ward: "Cardiology",
      bed: "B12",
      assignedDevice: "ESP32-A1",
      condition: "Stable",
    },
    {
      id: "PT-2026-002",
      name: "Jane Smith",
      age: 60,
      gender: "Female",
      ward: "Neurology",
      bed: "B15",
      assignedDevice: "ESP32-B1",
      condition: "Critical",
    },
    {
      id: "PT-2026-003",
      name: "Michael Johnson",
      age: 50,
      gender: "Male",
      ward: "Orthopedics",
      bed: "B20",
      assignedDevice: "ESP32-C1",
      condition: "Stable",
    },
  ];

  return (
    <div>
      {/* heading */}
      <Heading
        title={"Patients"}
        subtitle={"Register patients and assign WBAN monitoring devices"}
      />

      <div className="flex justify-end">
        <Button variant="primary" size="md" iconLeft={Plus}>
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
          "Condition",
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
              {row.name}
              <span className="text-xs font-normal text-dark-a0/60">
                {row.age}yrs, {row.gender}
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
            <td className="px-6 py-3 whitespace-nowrap">{row.condition}</td>
            <td className="px-6 py-3 space-x-4 whitespace-nowrap">
              <button
                title="Monitor Patient"
                className="text-sm hover:underline cursor-pointer"
              >
                <Eye className="size-4  text-primary-a20 inline-block" />
              </button>
              <button
                title="Edit Patient"
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
    </div>
  );
};

export default Patients;
