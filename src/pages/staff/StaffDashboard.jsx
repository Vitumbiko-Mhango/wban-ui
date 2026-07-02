import {
  Activity,
  AlertTriangle,
  Bell,
  Users,
  HeartPulse,
  ShieldAlert,
} from "lucide-react";
import React, { useEffect, useState } from "react";
import DashboardCard from "../../components/DashboardCard";
import AlertCard from "../../components/AlertCard";
import Heading from "../../components/common/Heading";
import { Link } from "react-router";
import { PatientTable } from "../../components/PatientsTable";
import client from "../../api/client";

const StaffDashboard = () => {
  const [stats, setStats] = useState(null);
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

  const v = (key) => (loading || !stats ? "…" : (stats[key] ?? 0));

  const cards = [
    {
      title: "Active Patients",
      total: v("active_patients"),
      icon: Users,
      iconClass: "text-primary-a20 bg-primary-a20/10",
      to: "/staff/patients?view=active",
      subtitle: "Open active patient list",
    },
    {
      title: "Active Monitors",
      total: v("active_monitors"),
      icon: Activity,
      iconClass: "text-success-a10 bg-success-a20",
      to: "/staff/live-monitoring",
      subtitle: "View live sensor feed",
    },
    {
      title: "Unresolved Alerts",
      total: v("unresolved_alerts"),
      icon: Bell,
      iconClass: "text-warning-a10 bg-warning-a20",
      to: "/staff/alerts?status=unresolved",
      subtitle: "Show open alerts",
    },
    {
      title: "Critical Alerts",
      total: v("critical_alerts"),
      icon: ShieldAlert,
      iconClass: "text-danger-a10 bg-danger-a20",
      to: "/staff/alerts?severity=critical&status=unresolved",
      subtitle: "Show urgent alerts",
    },
  ];

  return (
    <div>
      <Heading
        title="Dashboard"
        subtitle="Real-time patient monitoring overview"
      />

      {error && (
        <div className="mt-4 px-3 py-2 rounded-md bg-danger-a20 border border-danger-a10/30 text-sm text-danger-a0">
          {error}
        </div>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4 mt-6">
        {cards.map((c) => (
          <DashboardCard
            key={c.title}
            title={c.title}
            total={c.total}
            Icon={c.icon}
            iconClass={c.iconClass}
            to={c.to}
            subtitle={c.subtitle}
            compact
          />
        ))}
      </div>

      <div className="mt-6 grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Live vitals preview */}
        <div className="xl:col-span-2">
          <div className="p-4 bg-surface-a10 rounded-t-lg flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium">Live Monitoring Preview</h3>
              <p className="text-sm text-dark-a0/50">
                Latest sensor readings per patient
              </p>
            </div>
            <Link
              to="/staff/live-monitoring"
              className="text-sm text-primary-a20 hover:underline"
            >
              View All
            </Link>
          </div>
          <PatientTable />
        </div>

        {/* Recent alerts */}
        <div>
          <div className="p-4 bg-surface-a10 flex items-center justify-between rounded-t-lg">
            <div>
              <h3 className="text-lg font-medium">Recent Alerts</h3>
              <p className="text-sm text-dark-a0/50">
                Latest unresolved notifications
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
                dateTime={new Date(alert.created_at).toLocaleTimeString(
                  "en-GB",
                  {
                    hour: "2-digit",
                    minute: "2-digit",
                  },
                )}
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
