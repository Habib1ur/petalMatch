export function renderPetalMatchOgCard({
  heading,
  subtitle,
}: {
  heading: string;
  subtitle: string;
}) {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        position: "relative",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background:
          "linear-gradient(135deg, #FBCFE8 0%, #E9D5FF 50%, #FFF1E6 100%)",
        fontFamily: "Georgia, serif",
        padding: 56,
        overflow: "hidden",
      }}
    >
      {/* Soft ambient background blobs */}
      <div
        style={{
          position: "absolute",
          top: -80,
          left: -80,
          width: 340,
          height: 340,
          borderRadius: 9999,
          background: "rgba(245, 166, 200, 0.45)",
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: -90,
          right: -60,
          width: 360,
          height: 360,
          borderRadius: 9999,
          background: "rgba(197, 181, 245, 0.45)",
        }}
      />

      {/* Frosted glass invitation card */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          width: "100%",
          height: "100%",
          background: "rgba(255, 255, 255, 0.86)",
          borderRadius: 40,
          padding: "44px 68px",
          border: "2px solid rgba(245, 166, 200, 0.65)",
          boxShadow: "0 24px 64px rgba(53, 40, 58, 0.12)",
        }}
      >
        {/* Floral emblem */}
        <svg
          width="68"
          height="68"
          viewBox="0 0 68 68"
          fill="none"
          style={{ marginBottom: 16 }}
        >
          <ellipse cx="34" cy="15" rx="9" ry="14" fill="#D979A7" fillOpacity="0.88" />
          <ellipse
            cx="34"
            cy="15"
            rx="9"
            ry="14"
            fill="#F5A6C8"
            fillOpacity="0.9"
            transform="rotate(72 34 34)"
          />
          <ellipse
            cx="34"
            cy="15"
            rx="9"
            ry="14"
            fill="#C5B5F5"
            fillOpacity="0.9"
            transform="rotate(144 34 34)"
          />
          <ellipse
            cx="34"
            cy="15"
            rx="9"
            ry="14"
            fill="#F5A6C8"
            fillOpacity="0.9"
            transform="rotate(216 34 34)"
          />
          <ellipse
            cx="34"
            cy="15"
            rx="9"
            ry="14"
            fill="#D979A7"
            fillOpacity="0.88"
            transform="rotate(288 34 34)"
          />
          <circle cx="34" cy="34" r="9" fill="#FFF7FA" />
          <circle cx="34" cy="34" r="5" fill="#FFD7C2" />
        </svg>

        <div
          style={{
            fontSize: 20,
            letterSpacing: "0.28em",
            color: "#D979A7",
            fontWeight: 700,
            marginBottom: 16,
          }}
        >
          PETALMATCH
        </div>

        <div
          style={{
            fontSize: 48,
            color: "#35283A",
            fontWeight: 600,
            textAlign: "center",
            lineHeight: 1.15,
            marginBottom: 18,
            maxWidth: 920,
          }}
        >
          {heading}
        </div>

        <div
          style={{
            fontSize: 24,
            color: "#8D7D8D",
            textAlign: "center",
            maxWidth: 780,
            marginBottom: 30,
          }}
        >
          {subtitle}
        </div>

        {/* Pill CTA */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: 18,
            background: "linear-gradient(90deg, #D979A7 0%, #B794F4 100%)",
            color: "#FFFFFF",
            fontSize: 22,
            fontWeight: 600,
            padding: "14px 34px",
          }}
        >
          Discover Your Match ✿
        </div>
      </div>
    </div>
  );
}
