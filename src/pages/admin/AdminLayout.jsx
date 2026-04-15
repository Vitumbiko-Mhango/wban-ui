import React from "react";
import Layout from "../../components/common/Layout";
import { Outlet } from "react-router";
import { Bed, Cpu, HeartCrack, LayoutDashboard, Settings, Settings2, Users } from "lucide-react";

const AdminLayout = () => {
  const menuItems = [
    {
      name: "Dashboard",
      icon: LayoutDashboard,
      link: "/admin/dashboard",
    },
    {
      name: "Patients",
      icon: HeartCrack,
      link: "/admin/patients",
    },
    {
      name: "Devices",
      icon: Cpu,
      link: "/admin/devices",
    },
      {
        name: "Alert Thresholds",
        icon: Settings2,
        link: "/admin/thresholds",
      },
    {
      name: "Users",
      icon: Users,
      link: "/admin/users",
    },
    {
      name: "Configurations",
      icon: Settings,
      link: "/admin/configurations",
    },
  ];
  return (
    <Layout menuItems={menuItems}>
      <Outlet />
    </Layout>
  );
};

export default AdminLayout;
