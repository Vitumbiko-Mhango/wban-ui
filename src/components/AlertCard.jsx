import React from "react";

const AlertCard = ({ alert, reading, patientName, dateTime }) => {
  return (
    <div className="p-4">
      <div className="flex items-center gap-2">
        <div className="size-3 bg-warning-a10 rounded-full"></div>
        <div>
          <h3 className="flex flex-col text-sm font-medium text-dark-a0/80">
            {alert} - {reading}
          </h3>

          <p className="text-xs text-dark-a0/50">
            {patientName} • {dateTime}
          </p>
        </div>
      </div>
    </div>
  );
};

export default AlertCard;
