import {
  AlertTriangle,
  Annoyed,
  Bed,
  CheckCircle,
  Cpu,
  Heart,
  Thermometer,
} from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const HR_HIGH = 100;
const HR_LOW = 50;
const TEMP_HIGH = 38;
const TEMP_LOW = 35;

const TOOLTIP_STYLE = {
  background: "var(--color-surface-a20)",
  border: "1px solid var(--color-surface-a30)",
  borderRadius: "8px",
  fontSize: "12px",
};

function deriveStatus({ hr, temp }) {
  return hr > HR_HIGH || hr < HR_LOW || temp > TEMP_HIGH || temp < TEMP_LOW
    ? "warning"
    : "normal";
}

const LiveMonitorCard = ({
  name,
  ward,
  bed,
  hr,
  temp,
  fallsDetected = false,
  hrData,
  tempData,
  assignedDevice,
}) => {
  const isWarning = deriveStatus({ hr, temp }) === "warning";

  return (
    <div className="border border-surface-a20 p-4 rounded-lg">
      {/* heading */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h3 className="font-bold flex flex-col">
            {name}
            <span className="text-xs font-normal text-dark-a0/80">
              {ward} · {bed}
            </span>
          </h3>
          {/* <p className="text-xs text-dark-a0/60"></p> */}
          <div className="flex items-center gap-1 text-sm text-primary-a20 font-bold">
            <Cpu className="size-4" />
            <span>{assignedDevice}</span>
          </div>
        </div>
        {isWarning ? (
          <div className="text-sm text-warning-a10 px-2 py-0.5 rounded-lg inline-flex items-center gap-1 bg-warning-a20">
            <AlertTriangle className="size-4" /> Warning
          </div>
        ) : (
          <div className="text-sm text-success-a10 px-2 py-0.5 rounded-lg inline-flex items-center gap-1 bg-success-a20">
            <CheckCircle className="size-4" /> Normal
          </div>
        )}
      </div>

      {/* readings */}
      <div className="grid grid-cols-2 gap-4 mt-6">
        <div className="bg-surface-a10 p-2 rounded-lg flex items-center justify-center gap-2">
          <Heart className="size-4 text-danger-a10" />
          <div className="text-dark-a0/60 text-sm flex flex-col">
            HR
            <div className="space-x-1">
              <span className="text-dark-a0 font-bold">{hr}</span>
              <span className="text-xs">bpm</span>
            </div>
          </div>
        </div>

        <div className="bg-surface-a10 p-2 rounded-lg flex items-center justify-center gap-2">
          <Thermometer className="size-4 text-warning-a10" />
          <div className="text-dark-a0/60 text-sm flex flex-col">
            TEMP
            <div className="space-x-1">
              <span className="text-dark-a0 font-bold">{temp}</span>
              <span className="text-xs">°C</span>
            </div>
          </div>
        </div>

        <div className="bg-surface-a10 p-2 rounded-lg flex items-center justify-center gap-2">
          <Bed className="size-4 text-primary-a20" />
          <div className="text-dark-a0/60 text-sm flex flex-col">
            Falls
            <div className="space-x-1">
              <span className="text-dark-a0 font-bold">
                {fallsDetected ? "Detected" : "Not detected"}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-surface-a10 p-2 rounded-lg flex items-center justify-center gap-2">
          <Annoyed className="size-4 text-danger-a0" />
          <div className="text-dark-a0/60 text-sm flex flex-col">
            Stress
            <div className="space-x-1">
              <span className="text-dark-a0 font-bold">
                {fallsDetected ? "Stressed" : "Not stressed"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* heart rate trend */}
      <div className="mt-4">
        <h3 className="text-dark-a0/60 text-sm mb-2">Heart Rate Trend</h3>
        <div className="h-24">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={hrData}>
              <defs>
                <linearGradient id="bpmGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor="var(--color-danger-a10)"
                    stopOpacity={0.2}
                  />
                  <stop
                    offset="95%"
                    stopColor="var(--color-danger-a10)"
                    stopOpacity={0}
                  />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="time" hide />
              <YAxis hide domain={["auto", "auto"]} />
              <Tooltip contentStyle={TOOLTIP_STYLE} />
              <Area
                type="monotone"
                dataKey="bpm"
                stroke="var(--color-danger-a0)"
                strokeWidth={2}
                fill="url(#bpmGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* temperature trend */}
      <div className="mt-4">
        <h3 className="text-dark-a0/60 text-sm mb-2">Temperature Trend</h3>
        <div className="h-24">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={tempData}>
              <defs>
                <linearGradient id="tempGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor="var(--color-primary-a20)"
                    stopOpacity={0.2}
                  />
                  <stop
                    offset="95%"
                    stopColor="var(--color-primary-a20)"
                    stopOpacity={0}
                  />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="time" hide />
              <YAxis hide domain={["auto", "auto"]} />
              <Tooltip contentStyle={TOOLTIP_STYLE} />
              <Area
                type="monotone"
                dataKey="temp"
                stroke="var(--color-primary-a20)"
                strokeWidth={2}
                fill="url(#tempGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default LiveMonitorCard;
