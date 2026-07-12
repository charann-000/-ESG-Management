import React, { useState } from "react";

export const CarbonChart = () => {
  const [scope, setScope] = useState("all");
  const [hoveredPoint, setHoveredPoint] = useState(null);

  const chartData = {
    all: [120, 140, 110, 95, 88, 74, 68],
    scope1: [70, 80, 65, 55, 52, 45, 40],
    scope2: [50, 60, 45, 40, 36, 29, 28],
  };

  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul"];
  const monthsCoords = [50, 140, 230, 320, 410, 500, 560];

  const values = chartData[scope];

  // Build the path SVG data string
  const points = values.map((val, idx) => {
    const x = monthsCoords[idx];
    const y = 160 - (val / 300) * 140;
    return { x, y, val, month: months[idx] };
  });

  const pathD = points.reduce(
    (acc, pt, idx) => (idx === 0 ? `M ${pt.x},${pt.y}` : `${acc} L ${pt.x},${pt.y}`),
    ""
  );

  return (
    <article className="bento-card span-8">
      <div className="card-header">
        <div>
          <span className="card-eyebrow">Environmental (E)</span>
          <h2>Carbon Emissions Target</h2>
        </div>
        <div className="chart-filters">
          <button
            type="button"
            className={`btn-filter ${scope === "all" ? "active" : ""}`}
            onClick={() => setScope("all")}
          >
            All Scopes
          </button>
          <button
            type="button"
            className={`btn-filter ${scope === "scope1" ? "active" : ""}`}
            onClick={() => setScope("scope1")}
          >
            Scope 1
          </button>
          <button
            type="button"
            className={`btn-filter ${scope === "scope2" ? "active" : ""}`}
            onClick={() => setScope("scope2")}
          >
            Scope 2
          </button>
        </div>
      </div>

      <div className="chart-container">
        <svg className="chart-svg" id="carbon-chart" viewBox="0 0 600 180">
          {/* Y-Axis Grid Lines & Labels */}
          <line className="chart-grid-line" x1="40" y1="20" x2="580" y2="20" />
          <text className="chart-axis-text" x="12" y="23">300t</text>

          <line className="chart-grid-line" x1="40" y1="70" x2="580" y2="70" />
          <text className="chart-axis-text" x="12" y="73">200t</text>

          <line className="chart-grid-line" x1="40" y1="120" x2="580" y2="120" />
          <text className="chart-axis-text" x="12" y="123">100t</text>

          <line className="chart-grid-line" x1="40" y1="160" x2="580" y2="160" />
          <text className="chart-axis-text" x="12" y="163">0t</text>

          {/* X-Axis Labels */}
          {months.map((m, idx) => (
            <text
              key={m}
              className="chart-axis-text"
              x={monthsCoords[idx]}
              y="176"
              textAnchor="middle"
            >
              {m}
            </text>
          ))}

          {/* Target Path (Dashed) */}
          <path
            className="chart-line-target"
            d="M 50,110 L 140,105 L 230,95 L 320,85 L 410,75 L 500,68 L 560,60"
          />

          {/* Actual Path */}
          <path
            className="chart-line-actual"
            id="actual-path"
            d={pathD}
            style={{
              strokeDasharray: "1000",
              strokeDashoffset: "0",
            }}
          />

          {/* Interactive Data Points */}
          <g id="chart-points">
            {points.map((pt, idx) => (
              <circle
                key={idx}
                className="chart-point"
                cx={pt.x}
                cy={pt.y}
                r="4"
                onMouseMove={(e) => {
                  setHoveredPoint({
                    x: pt.x,
                    y: pt.y,
                    val: pt.val,
                    month: pt.month,
                  });
                }}
                onMouseLeave={() => setHoveredPoint(null)}
              />
            ))}
          </g>
        </svg>

        {hoveredPoint && (
          <div
            className="chart-tooltip"
            style={{
              opacity: 1,
              left: `${(hoveredPoint.x / 600) * 100}%`,
              top: `${(hoveredPoint.y / 180) * 100}%`,
            }}
          >
            <strong>{hoveredPoint.month}</strong>: {hoveredPoint.val}t
          </div>
        )}
      </div>

      <p style={{ fontSize: "12px", color: "var(--muted)", marginTop: "-6px" }}>
        Target path (dashed line) is calibrated to meet standard Net-Zero offsets. Active Carbon score:{" "}
        <strong style={{ color: "var(--accent)" }}>68/100</strong>.
      </p>
    </article>
  );
};
