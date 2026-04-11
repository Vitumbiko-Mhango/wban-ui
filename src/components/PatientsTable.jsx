export function PatientTable() {
  const patients = [
    {
      id: 1,
      name: "Mary Banda",
      heartRate: 72,
      temp: 36.5,
      fall: "No",
      status: "Normal",
    },
    {
      id: 2,
      name: "Michael Chirwa",
      heartRate: 110,
      temp: 38.2,
      fall: "Yes",
      status: "Warning",
    },
    {
      id: 3,
      name: "Emily Ngoma",
      heartRate: 68,
      temp: 37.0,
      fall: "No",
      status: "Normal",
    },
    {
      id: 4,
      name: "Robert Kamanga",
      heartRate: 135,
      temp: 39.0,
      fall: "Yes",
      status: "Critical",
    },
    {
      id: 5,
      name: "Lisa Mwanza",
      heartRate: 95,
      temp: 37.5,
      fall: "Yes",
      status: "Warning",
    },
  ];

  const statusStyles = {
    Normal: "bg-success-a10/20 text-success-a0",
    Warning: "bg-warning-a10/20 text-warning-a0",
    Critical: "bg-danger-a10/20 text-danger-a0",
  };
  return (
    <div className="overflow-hidden bg-surface-a0 border border-dark-a0/10 rounded-b-lg">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-primary-a20/10">
              {[
                "Patient",
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
            {patients.map((p) => (
              <tr key={p.id} className="hover:bg-surface-a10/30 transition-colors">
                <td className="px-5 py-3.5 font-medium text-dark-a0/80">
                  {p.name}
                </td>
                <td className="px-5 py-3.5 text-dark-a0/60">
                  {p.heartRate} bpm
                </td>
                <td className="px-5 py-3.5 text-dark-a0/60">{p.temp}°C</td>
                <td className="px-5 py-3.5 text-dark-a0/60">{p.fall}</td>
                <td className="px-5 py-3.5">
                  <span
                    className={`${statusStyles[p.status]} border-none font-medium text-xs px-2 py-1 rounded-full`}
                  >
                    {p.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
