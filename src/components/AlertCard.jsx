import React from 'react'

const AlertCard = ({alert, reading, patientName, dateTime, status}) => {
  return (
    <div className="bg-surface-a10 p-4 rounded-lg flex flex-col items-start space-y-2 md:flex-row md:items-center md:justify-between md:space-y-0">
      <div className="flex items-center gap-2">
        <div className="size-3 bg-warning-a10 rounded-full"></div>
        <div>
          <h3 className="flex flex-col font-medium">
            {alert} {reading} for {patientName}
            <span className="text-xs text-dark-a0/60 font-normal">
              {dateTime}
            </span>
          </h3>
        </div>
      </div>
      <div className="bg-danger-a10/20 text-sm text-danger-a10 font-medium py-0.5 px-4 rounded-full capitalize">
        {status}
      </div>
    </div>
  );
}

export default AlertCard
