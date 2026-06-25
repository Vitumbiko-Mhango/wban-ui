import React from "react";
import Layout from "../../components/common/Layout";
import { Activity, ArrowRightLeft, BarChart2, BedDouble, Bell, ClipboardList, ClipboardPlus, LayoutDashboard, Users } from "lucide-react";
import { Outlet } from "react-router";

const Dashboard = () => {
  const menuItems = [
    { name: "Dashboard", icon: LayoutDashboard, link: "/staff/dashboard" },
    { name: "Patients", icon: Users, link: "/staff/patients" },
    { name: "Live Monitoring", icon: Activity, link: "/staff/live-monitoring" },
    { name: "Alerts", icon: Bell, link: "/staff/alerts" },
    { name: "Wards & Beds", icon: BedDouble, link: "/staff/wards" },
    { name: "Shift Handover", icon: ClipboardList, link: "/staff/handover" },
    { name: "Ward Transfer", icon: ArrowRightLeft, link: "/staff/ward-transfer" },
    { name: "NEWS2 Score", icon: ClipboardPlus, link: "/staff/news2" },
    { name: "Analytics", icon: BarChart2, link: "/staff/analytics" },
  ];
  return (
    <Layout menuItems={menuItems}>
      <Outlet />
    </Layout>
  );
};

export default Dashboard;
