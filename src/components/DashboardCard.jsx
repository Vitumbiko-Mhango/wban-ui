import React from "react";
import { Link } from "react-router";

const DashboardCard = ({
  title,
  total,
  Icon,
  iconClass = "text-primary-a20",
  to,
  onClick,
  active = false,
  subtitle,
}) => {
  const content = (
    <>
      <div className="flex flex-col gap-2">
        <span>{title}</span>
        <span className="text-2xl font-bold">{total}</span>
        {subtitle && (
          <span className="text-xs font-normal text-dark-a0/45">{subtitle}</span>
        )}
      </div>
      <div className={`p-3 rounded-full ${iconClass}`}>
        <Icon className="size-8" />
      </div>
    </>
  );

  const className = `border p-6 flex items-center justify-between gap-2 shadow-md rounded-lg transition-all duration-150 ${
    active
      ? "border-primary-a20 bg-primary-a20/5 ring-1 ring-primary-a20/20"
      : "border-surface-a30 bg-white"
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
