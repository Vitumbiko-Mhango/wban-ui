import React from "react";
import Heading from "../../components/common/Heading";
import LiveMonitorCard from "../../components/LiveMonitorCard";

const LiveMonitoring = () => {
  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <Heading
          title={"Live Patient Monitoring"}
          subtitle={"Real-time patient vitals with auto-refresh every 3 seconds"}
        />

        <div className="mt-2 flex items-center gap-1 text-dark-a0/80 text-sm md:mt-0">
          <div className="size-2 bg-success-a0 rounded-full animate-pulse"></div>
          Live
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mt-8">
        <LiveMonitorCard />
        <LiveMonitorCard />
        <LiveMonitorCard />
      </div>
    </div>
  );
};

export default LiveMonitoring;
