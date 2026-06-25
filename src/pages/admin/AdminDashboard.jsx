/**
 * src/pages/admin/AdminDashboard.jsx  (REPLACE YOUR EXISTING FILE)
 *
 * Changes from original:
 *  - Fetches stats from GET /api/dashboard/stats/
 */

import React, { useEffect, useState } from "react";
import Heading from "../../components/common/Heading";
import { Bed, Bell, Cpu, Users } from "lucide-react";
import DashboardCard from "../../components/DashboardCard";
import client from "../../api/client";

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    client
      .get("/dashboard/stats/")
      .then(({ data }) => setStats(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const dashboardData = [
    {
      title: "Total Users",
      icon: Users,
      total: loading ? "…" : (stats?.total_users ?? 0),
      iconClass: "text-primary-a20 bg-primary-a20/10",
    },
    {
      title: "Total Patients",
      icon: Bed,
      total: loading ? "…" : (stats?.total_patients ?? 0),
      iconClass: "text-success-a10 bg-success-a10/10",
    },
    {
      title: "Total Alerts",
      icon: Bell,
      total: loading ? "…" : (stats?.total_alerts ?? 0),
      iconClass: "text-danger-a10 bg-danger-a10/10",
    },
    {
      title: "Active Monitors",
      icon: Cpu,
      total: loading
        ? "…"
        : `${stats?.active_monitors ?? 0}/${stats?.total_devices ?? 0}`,
      iconClass: "text-primary-a0 bg-primary-a0/10",
    },
  ];

  return (
    <div>
      <Heading title="Admin Dashboard" subtitle="Overview of the system." />
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4 mt-8">
        {dashboardData.map((item) => (
          <DashboardCard
            key={item.title}
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
