import React from "react";
import Layout from "../../components/common/Layout";
import { Bell, ChartPie, Lock, Users } from "lucide-react";
import { Outlet } from "react-router";

const Dashboard = () => {
  const menuItems = [
    {
      name: "Dashboard",
      icon: ChartPie,
      link: "/staff/dashboard",
    },
    {
      name: "Alerts",
      icon: Bell,
      link: "/staff/alerts",
    },
    {
      name: "Patients",
      icon: Users,
      link: "/staff/patients",
    },
    {
      name: "Security",
      icon: Lock,
      link: "/staff/security",
    },
  ];
  return (
    <Layout menuItems={menuItems}>
      <Outlet />
    </Layout>
  );
};

export default Dashboard;
