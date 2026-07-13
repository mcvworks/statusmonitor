import { ImageResponse } from "next/og";

export const alt = "DTMonitor live cloud and SaaS outage monitoring";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    <div
      style={{
        alignItems: "center",
        backgroundColor: "#0f1114",
        backgroundImage:
          "radial-gradient(circle at 80% 20%, rgba(242, 194, 0, 0.22), transparent 35%)",
        color: "#f4f5f7",
        display: "flex",
        height: "100%",
        justifyContent: "center",
        padding: "72px",
        width: "100%",
      }}
    >
      <div
        style={{
          border: "2px solid #303744",
          borderRadius: "30px",
          display: "flex",
          flexDirection: "column",
          padding: "58px 64px",
          width: "100%",
        }}
      >
        <div
          style={{
            color: "#f2c200",
            display: "flex",
            fontSize: 26,
            fontWeight: 700,
            letterSpacing: 5,
            textTransform: "uppercase",
          }}
        >
          DTMonitor
        </div>
        <div
          style={{
            display: "flex",
            fontSize: 62,
            fontWeight: 700,
            lineHeight: 1.1,
            marginTop: 28,
            maxWidth: 900,
          }}
        >
          Cloud &amp; SaaS status, in one place.
        </div>
        <div
          style={{
            color: "#aeb5c2",
            display: "flex",
            fontSize: 27,
            marginTop: 30,
          }}
        >
          Live outages · official sources · incident history
        </div>
      </div>
    </div>,
    size,
  );
}
