import { AlertTriangle, Bell, Gauge, Users } from "lucide-react";
import React from "react";
import DashboardCard from "../../components/DashboardCard";
import { Link } from "react-router";
import AlertCard from "../../components/AlertCard";

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
      title: "Sensor Readings",
      total: 1,
      icon: Gauge,
      iconClass: "text-success-a10 bg-success-a10/10",
    },
  ];
  const AlertData = [
    {
      alert: "Abnormal heart rate detected for Robert Chunga: 130.0 bpm",
      dateTime: "3/16/2026, 10:22 PM",
      status: "active",
    },
  ];
  return (
    <div>
      <div>
        <h3 className="text-2xl text-dark-a0 font-semibold">Dashboard</h3>
        <p className="text-sm text-dark-a0/70">
          Real-time patient monitoring overview
        </p>
      </div>

      {/* dashboard cards container */}
      <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
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

      {/* alerts */}
      <div className="mt-8">
        <div className="mb-2">
          <h3 className="text-xl font-medium">Recent Alerts</h3>
        </div>

        <div className="space-y-4">
          {/* alert card */}
          {AlertData.map((item) => (
            <AlertCard
              key={item.id}
              alert={item.alert}
              dateTime={item.dateTime}
              status={item.status}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default StaffDashboard;
