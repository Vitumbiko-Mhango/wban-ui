import Analytics from "../staff/Analytics";

const AdminDashboard = () => (
  <Analytics
    title="Admin Dashboard"
    subtitle="System overview, analytics, reports and exportable operational data."
    dashboardLinks={{
      totalPatients: "/admin/patients",
      activePatients: "/admin/patients?view=active",
      alerts: "/staff/alerts?status=unresolved",
      devices: "/admin/devices",
    }}
  />
);

export default AdminDashboard;
