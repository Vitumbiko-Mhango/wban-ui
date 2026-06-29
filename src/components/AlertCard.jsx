import React from "react";

const DOT = {
  critical: "bg-danger-a10",
  warning: "bg-warning-a10",
  info: "bg-primary-a20",
};

const LABEL = {
  heart_rate: "Heart Rate",
  temperature: "Temperature",
  spo2: "SpO₂",
  stress: "Stress",
  fall: "Fall Detected",
};

const AlertCard = ({ alert, reading, patientName, dateTime, status }) => {
  const dotColor = DOT[status] ?? DOT.warning;
  const typeLabel = LABEL[alert] ?? alert;

  return (
    <div className="p-4">
      <div className="flex items-center gap-2">
        <div className={`size-2.5 rounded-full shrink-0 ${dotColor}`} />
        <div className="min-w-0">
          <h3 className="text-sm font-medium text-dark-a0/80 truncate">
            {typeLabel}
            {reading ? ` — ${reading}` : ""}
          </h3>
          <p className="text-xs text-dark-a0/50">
            {patientName} · {dateTime}
          </p>
        </div>
      </div>
    </div>
  );
};

export default AlertCard;
