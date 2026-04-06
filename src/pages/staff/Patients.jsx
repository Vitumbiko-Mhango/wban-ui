import React, { useState } from "react";
import GeneralTable from "../../components/common/GeneralTable";
import Heading from "../../components/common/Heading";
import { Cpu, Eye, Plus, SquarePen } from "lucide-react";
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
            className="border border-surface-a20 hover:bg-surface-a10 cursor-pointer"
          >
            <td className="px-6 py-4 whitespace-nowrap">{row.id}</td>
            <td className="px-6 py-4 font-bol4 whitespace-nowrap">{row.name}</td>
            <td className="px-6 py-4 whitespace-nowrap">{row.ward}</td>
            <td className="px-6 py-4 whitespace-nowrap">{row.bed}</td>
            <td className="px-6 py-4 text-primary-a20 text-sm flex items-center whitespace-nowrap">
              <Cpu className="size-4 inline-block mr-1" />
              {row.assignedDevice}
            </td>
            <td className="px-6 py-4 whitespace-nowrap">{row.condition}</td>
            <td className="px-6 py-4 whitespace-nowrap">
              <button className="text-sm text-primary-a20 hover:underline cursor-pointer">
                <Eye className="w-4 h-4 inline-block mr-1" />
              </button>
              <button className="ml-4 text-sm text-primary-a0 hover:underline cursor-pointer">
                <SquarePen className="w-4 h-4 text-primary-a20 inline-block mr-1" />
              </button>
            </td>
          </tr>
        )}
      />
    </div>
  );
};

export default Patients;
