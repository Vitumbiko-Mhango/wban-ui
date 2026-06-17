import React from "react";
import Layout from "../../components/common/Layout";
import { Activity, BedDouble, Bell, LayoutDashboard, Lock, Users } from "lucide-react";
import { Outlet } from "react-router";

const Dashboard = () => {
  const menuItems = [
    {
      name: "Dashboard",
      icon: LayoutDashboard,
      link: "/staff/dashboard",
    },
    {
      name: "Patients",
      icon: Users,
      link: "/staff/patients",
    },
    { name: "Live Monitoring", icon: Activity, link: "/staff/live-monitoring" },
    {
      name: "Alerts",
      icon: Bell,
      link: "/staff/alerts",
    },
    {
      name: "Wards & Beds",
      icon: BedDouble,
      link: "/staff/wards",
    },
  ];
  return (
    <Layout menuItems={menuItems}>
      <Outlet />
    </Layout>
  );
};

export default Dashboard;
