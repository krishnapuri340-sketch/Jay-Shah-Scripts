import React, { useEffect, useRef, useState } from "react";

interface Props {
  onDone: () => void;
}

export default function SplashScreen({ onDone }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [fading, setFading] = useState(false);

  const finish = () => {
    if (fading) return;
    setFading(true);
    setTimeout(onDone, 500);
  };

  useEffect(() => {
    const vid = videoRef.current;
    if (!vid) return;

    vid.play().catch(() => {
      // Autoplay blocked — skip straight through
      finish();
    });

    const onEnd = () => finish();
    vid.addEventListener("ended", onEnd);
    return () => vid.removeEventListener("ended", onEnd);
  }, []);

  const BASE = import.meta.env.BASE_URL;

  return (
    <div
      onClick={finish}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        background: "#000",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        opacity: fading ? 0 : 1,
        transition: "opacity 0.5s ease",
        cursor: "pointer",
      }}
    >
      <video
        ref={videoRef}
        src={`${BASE}splash.mp4`}
        muted
        playsInline
        preload="auto"
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          display: "block",
        }}
      />
    </div>
  );
}
