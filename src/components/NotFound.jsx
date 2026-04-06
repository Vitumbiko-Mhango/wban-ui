import React from "react";

const NotFound = () => {
  const goBack = () => {
    window.history.back();
  };
  return (
    <div className="flex flex-col items-center justify-center h-screen">
      <h1 className="text-4xl font-bold text-primary-a20">
        404 - Page Not Found
      </h1>
      <p className="text-lg text-dark-a0/70 mt-4">
        The page you are looking for does not exist.
      </p>
      <button
        onClick={goBack}
        className="mt-4 px-4 py-2 bg-primary-a20 text-white rounded-md hover:bg-primary-a20/80 cursor-pointer"
      >
        Go Back
      </button>
    </div>
  );
};

export default NotFound;
