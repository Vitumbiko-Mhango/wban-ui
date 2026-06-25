/**
 * src/pages/staff/StaffDashboard.jsx  (REPLACE YOUR EXISTING FILE)
 *
 * Changes from original:
 *  - Fetches stats from GET /api/dashboard/stats/
 *  - Fetches recent alerts from GET /api/alerts/?page_size=5
 *  - Fetches patients for the live preview from GET /api/patients/
 *  - Shows loading spinners and error states
 */

import { Activity, AlertTriangle, Bell, Users } from "lucide-react";
import React, { useEffect, useState } from "react";
import DashboardCard from "../../components/DashboardCard";
import AlertCard from "../../components/AlertCard";
import Heading from "../../components/common/Heading";
import { Link } from "react-router";
import { PatientTable } from "../../components/PatientsTable";
import client from "../../api/client";

const StaffDashboard = () => {
  const [stats, setStats] = useState({
    total_patients: 0,
    total_alerts: 0,
    unresolved_alerts: 0,
    active_monitors: 0,
  });
  const [recentAlerts, setRecentAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const [statsRes, alertsRes] = await Promise.all([
          client.get("/dashboard/stats/"),
          client.get("/alerts/?page_size=5&is_resolved=false"),
        ]);
        setStats(statsRes.data);

        // alerts response is paginated: { count, results: [...] }
        const alerts = alertsRes.data?.results ?? alertsRes.data ?? [];
        setRecentAlerts(alerts);
      } catch {
        setError("Failed to load dashboard data.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const dashboardData = [
    {
      title: "Total Patients",
      total: loading ? "…" : stats.total_patients,
      icon: Users,
      iconClass: "text-primary-a20 bg-primary-a20/10",
    },
    {
      title: "Alerts",
      total: loading ? "…" : stats.total_alerts,
      icon: Bell,
      iconClass: "text-danger-a10 bg-danger-a20",
    },
    {
      title: "Unresolved Alerts",
      total: loading ? "…" : stats.unresolved_alerts,
      icon: AlertTriangle,
      iconClass: "text-warning-a10 bg-warning-a20",
    },
    {
      title: "Active Monitors",
      total: loading ? "…" : stats.active_monitors,
      icon: Activity,
      iconClass: "text-success-a10 bg-success-a20",
    },
  ];

  return (
    <div>
      <Heading
        title="Dashboard"
        subtitle="Real-time patient monitoring overview"
      />

      {error && (
        <div className="mt-4 px-3 py-2 rounded-md bg-red-50 border border-red-200 text-sm text-danger-a0">
          {error}
        </div>
      )}

      {/* Stats cards */}
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

      <div className="mt-6 grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Live monitoring preview */}
        <div className="xl:col-span-2">
          <div className="p-4 bg-surface-a10 rounded-t-lg">
            <h3 className="text-lg font-medium">Live Monitoring Preview</h3>
            <p className="text-sm text-dark-a0/50">
              Real-time patient vitals overview
            </p>
          </div>
          <PatientTable />
        </div>

        {/* Recent alerts */}
        <div>
          <div className="p-4 bg-surface-a10 flex items-center justify-between rounded-t-lg">
            <div>
              <h3 className="text-lg font-medium">Recent Alerts</h3>
              <p className="text-sm text-dark-a0/50">
                Latest emergency notifications
              </p>
            </div>
            <Link
              to="/staff/alerts"
              className="text-sm text-primary-a20 hover:underline"
            >
              View All
            </Link>
          </div>
          <div className="border border-dark-a0/10 divide-y divide-dark-a0/10 bg-surface-a0 rounded-b-lg">
            {loading && (
              <p className="px-4 py-6 text-sm text-dark-a0/50 text-center">
                Loading alerts…
              </p>
            )}
            {!loading && recentAlerts.length === 0 && (
              <p className="px-4 py-6 text-sm text-dark-a0/50 text-center">
                No recent alerts.
              </p>
            )}
            {recentAlerts.map((alert) => (
              <AlertCard
                key={alert.id}
                alert={alert.alert_type}
                reading=""
                patientName={alert.patient_name ?? alert.patient}
                dateTime={new Date(alert.created_at).toLocaleTimeString()}
                status={alert.severity}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StaffDashboard;
