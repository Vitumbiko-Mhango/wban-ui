import React from "react";
import { Link } from "react-router";

const DashboardCard = ({
  title,
  total,
  Icon: CardIcon,
  iconClass = "text-primary-a20",
  to,
  onClick,
  active = false,
  subtitle,
  compact = false,
}) => {
  const content = (
    <>
      <div className={`flex min-w-0 flex-col ${compact ? "gap-1" : "gap-2"}`}>
        <span>{title}</span>
        <span className={`${compact ? "text-xl" : "text-2xl"} font-bold`}>
          {total}
        </span>
        {subtitle && (
          <span className="truncate text-xs font-normal text-dark-a0/45">
            {subtitle}
          </span>
        )}
      </div>
      <div
        className={`${compact ? "p-2" : "p-3"} shrink-0 rounded-full ${iconClass}`}
      >
        {React.createElement(CardIcon, {
          className: compact ? "size-5" : "size-8",
        })}
      </div>
    </>
  );

  const className = `border ${compact ? "p-4" : "p-6"} flex items-center justify-between gap-3 shadow-sm rounded-lg transition-all duration-150 ${
    active
      ? "border-primary-a20 bg-primary-a20/5 ring-1 ring-primary-a20/20"
      : "border-surface-a30 bg-surface-a0"
  } ${
    to || onClick
      ? "cursor-pointer hover:-translate-y-0.5 hover:border-primary-a20/50 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-primary-a20/30"
      : ""
  }`;

  if (to) {
    return (
      <Link to={to} className={className} aria-label={`Filter by ${title}`}>
        {content}
      </Link>
    );
  }

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={className}>
        {content}
      </button>
    );
  }

  return (
    <div className={className}>
      {content}
    </div>
  );
};

export default DashboardCard;
