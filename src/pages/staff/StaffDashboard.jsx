import { Activity, AlertTriangle, Bell, Users } from "lucide-react";
import React from "react";
import DashboardCard from "../../components/DashboardCard";
import AlertCard from "../../components/AlertCard";
import Heading from "../../components/common/Heading";
import { Link } from "react-router";
import { PatientTable } from "../../components/PatientsTable";

const StaffDashboard = () => {
  const dashboardData = [
    {
      title: "Total Patients",
      total: 5,
      icon: Users,
      iconClass: "text-primary-a20 bg-primary-a20/10",
    },
    {
      title: "Alerts",
      total: 3,
      icon: Bell,
      iconClass: "text-danger-a10 bg-danger-a10/10",
    },
    {
      title: "Unresolved Alerts",
      total: 1,
      icon: AlertTriangle,
      iconClass: "text-warning-a10 bg-warning-a10/10",
    },
    {
      title: "Active Monitors",
      total: 1,
      icon: Activity,
      iconClass: "text-success-a10 bg-success-a10/10",
    },
  ];
  const AlertData = [
    {
      patientName: "Robert Chunga",
      alert: "High Heart Rate",
      reading: "120 bpm",
      dateTime: "2 min ago",
    },
    {
      patientName: "John Mwakikunga",
      alert: "Temperature Alert",
      reading: "39°C",
      dateTime: "5 min ago",
    },
    {
      patientName: "Amon Phiri",
      alert: "Low Oxygen Level",
      reading: "88%",
      dateTime: "10 min ago",
    },
    {
      patientName: "Jane Doe",
      alert: "High Blood Pressure",
      reading: "150/95 mmHg",
      dateTime: "15 min ago",
    },
    {
      patientName: "Emily Ngoma",
      alert: "Fall Detected",
      reading: "N/A",
      dateTime: "20 min ago",
    },
  ];
  return (
    <div>
      {/* heading */}
      <Heading
        title={"Dashboard"}
        subtitle={"Real-time patient monitoring overview"}
      />

      {/* dashboard cards container */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        {/* card */}
        {dashboardData.map((item) => (
          <DashboardCard
            key={item.id}
            title={item.title}
            total={item.total}
            Icon={item.icon}
            iconClass={item.iconClass}
          />
        ))}
      </div>

      {/* alerts container and live updates */}
      <div className="mt-6 grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* live updates */}
        <div className="xl:col-span-2">
          <div className="p-4 bg-surface-a10 rounded-t-lg">
            <div>
              <h3 className="text-lg font-medium">Live Monitoring Preview</h3>
              <p className="text-sm text-dark-a0/50">
                Real-time patient vitals overview
              </p>
            </div>
          </div>
          <PatientTable />
        </div>

        {/* recent alerts */}
        <div>
          <div className="p-4 bg-surface-a10 flex items-center justify-between rounded-t-lg">
            <div>
              <h3 className="text-lg font-medium">Recent Alerts</h3>
              <p className="text-sm text-dark-a0/50">
                Latest emergency notifications
              </p>
            </div>
            <div>
              <Link
                to="/staff/alerts"
                className="text-sm text-primary-a20 hover:underline"
              >
                View All
              </Link>
            </div>
          </div>
          {/* alert card */}
          <div className="border border-dark-a0/10 divide-y divide-dark-a0/10 bg-surface-a0 rounded-b-lg">
            {AlertData.map((item) => (
              <AlertCard
                key={item.id}
                alert={item.alert}
                reading={item.reading}
                patientName={item.patientName}
                dateTime={item.dateTime}
                status={item.status}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StaffDashboard;
