import React from "react";
import Heading from "../../components/common/Heading";
import { Bed, Bell, Cpu, Users } from "lucide-react";
import DashboardCard from "../../components/DashboardCard";

const AdminDashboard = () => {
  const dashboardData = [
    {
      title: "Total Users",
      icon: Users,
      total: 5,
      iconClass: "text-primary-a20 bg-primary-a20/10",
    },
    {
      title: "Total Patients",
      icon: Bed,
      total: 10,
      iconClass: "text-success-a10 bg-success-a10/10",
    },
    {
      title: "Total Alerts",
      icon: Bell,
      total: 3,
      iconClass: "text-danger-a10 bg-danger-a10/10",
    },
    {
      title: "Active Monitors",
      icon: Cpu,
      total: "1/120",
      iconClass: "text-primary-a0 bg-primary-a0/10",
    },
  ];

  return (
    <div>
      <Heading title="Admin Dashboard" subtitle="Overview of the system." />

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
    </div>
  );
};

export default AdminDashboard;
