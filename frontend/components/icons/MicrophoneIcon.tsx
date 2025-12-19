import React from "react";

interface MicrophoneIconProps {
  className?: string;
  isActive?: boolean;
}

const MicrophoneIcon: React.FC<MicrophoneIconProps> = ({
  className = "w-6 h-6",
  isActive = false,
}) => {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      {isActive ? (
        // Microphone off icon
        <>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M6 18L18 6M6 6l12 12"
          />
        </>
      ) : (
        // Microphone on icon
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
        />
      )}
    </svg>
  );
};

export default MicrophoneIcon;
