import React from "react";

const Heading = ({ title, subtitle }) => {
  return (
    <div className="mb-8">
      <h3 className="text-2xl text-dark-a0 font-semibold">{title}</h3>
      <p className="text-sm text-dark-a0/70">{subtitle}</p>
    </div>
  );
};

export default Heading;
