import React from "react";

const DashboardCard = ({ title, total, Icon, iconClass = "text-primary-a20" }) => {
  return (
    <div className="border border-surface-a30 p-6 flex items-center justify-between gap-2 shadow-md rounded-lg">
      <div className="flex flex-col gap-2">
        {title}
        <span className="text-4xl font-bold">{total}</span>
      </div>
      <div className={`p-3 rounded-full ${iconClass}`}>
        <Icon className="size-10" />
      </div>
    </div>
  );
};

export default DashboardCard;
