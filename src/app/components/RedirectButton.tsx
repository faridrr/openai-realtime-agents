"use client";

import React from "react";

interface RedirectButtonProps {
  url: string;
  message: string;
}

export const RedirectButton: React.FC<RedirectButtonProps> = ({
  url,
  message,
}) => {
  const handleRedirect = () => {
    window.open(url, "_blank");
  };

  return (
    <div className="flex flex-col items-center justify-center p-6 space-y-4">
      <p className="text-gray-700 text-center max-w-md">{message}</p>
      <button
        onClick={handleRedirect}
        className="px-6 py-3 text-white font-medium rounded-lg transition-all duration-200 hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
        style={{
          backgroundColor: "#fda400",
          borderRadius: "8px",
        }}
      >
        Continue Search on Cloe Edu
      </button>
    </div>
  );
};
