import React from "react";
import { useIsMobile } from "../hooks/use-mobile";

const RotateToLandscape: React.FC = () => {
  const isMobile = useIsMobile();
  const isPortrait = window.innerHeight > window.innerWidth;

  if (!isMobile || !isPortrait) {
    return null;
  }

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        backgroundColor: "rgba(0, 0, 0, 0.8)",
        color: "white",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 1000,
      }}
    >
      <p style={{ fontSize: "1.5rem", textAlign: "center", marginBottom: "1rem" }}>
        Please rotate your device to landscape mode for the best experience.
      </p>
      <p style={{ fontSize: "1rem", textAlign: "center" }}>
        This application is optimized for landscape view.
      </p>
    </div>
  );
};

export default RotateToLandscape;