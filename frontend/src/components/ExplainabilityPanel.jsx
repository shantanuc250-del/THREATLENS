import React, { useState } from "react";
import { HelpCircle, ChevronDown, ChevronUp, Cpu, AlertCircle } from "lucide-react";

/**
 * ExplainabilityPanel
 *
 * Renders the "Why Was This Traffic Flagged?" section for a single-packet
 * prediction result. Consumes the `explanation` object from /api/predict.
 *
 * IMPORTANT: All importance values shown here are GLOBAL Random Forest
 * feature importances (model-wide), not per-packet causal scores.
 * The component copy makes this explicitly clear to the SOC analyst.
 */
export default function ExplainabilityPanel({ explanation, prediction, confidence, isAttack }) {
  const [open, setOpen] = useState(false);

  const accentColor = isAttack ? "#ef4444" : "#10b981";
  const accentBg    = isAttack ? "rgba(239,68,68,0.1)" : "rgba(16,185,129,0.1)";

  const labelColor = (label) => {
    switch (label) {
      case "High":    return "#ef4444";
      case "Medium":  return "#f59e0b";
      case "Low":     return "#38bdf8";
      default:        return "#64748b";
    }
  };

  const importanceBarWidth = (importance) =>
    `${Math.min(100, (importance / 0.18) * 100).toFixed(1)}%`;

  return (
    <div style={{
      backgroundColor: "#070b14",
      border: `1px solid ${open ? accentColor : "#1a263e"}`,
      borderRadius: "10px",
      overflow: "hidden",
      transition: "border-color 0.2s ease",
    }}>
      {/* Toggle Button */}
      <button
        id="xai-toggle-btn"
        onClick={() => setOpen(!open)}
        style={{
          width: "100%",
          backgroundColor: "transparent",
          border: "none",
          padding: "0.75rem 1rem",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          cursor: "pointer",
          transition: "background-color 0.15s ease",
        }}
        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "rgba(56,189,248,0.05)"}
        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <HelpCircle size={15} color="#38bdf8" />
          <span style={{ fontSize: "0.8rem", fontWeight: 700, color: "#f8fafc" }}>
            Why Was This Traffic Flagged?
          </span>
          {!explanation && (
            <span style={{
              fontSize: "0.66rem", color: "#64748b",
              backgroundColor: "#0d1628", padding: "1px 6px",
              borderRadius: "3px", border: "1px solid #1e293b"
            }}>
              Unavailable
            </span>
          )}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.35rem", color: "#38bdf8" }}>
          <span style={{ fontSize: "0.72rem", fontWeight: 600 }}>
            {open ? "Hide" : "View ML Feature Analysis"}
          </span>
          {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </div>
      </button>

      {/* Panel Body */}
      {open && (
        <div style={{
          borderTop: "1px solid #1a263e",
          padding: "1rem",
          display: "flex",
          flexDirection: "column",
          gap: "0.85rem",
        }}>
          {/* ML-only disclaimer banner */}
          <div style={{
            backgroundColor: "rgba(56,189,248,0.06)",
            border: "1px solid rgba(56,189,248,0.2)",
            borderRadius: "8px",
            padding: "0.65rem 0.85rem",
            display: "flex",
            gap: "0.5rem",
            alignItems: "flex-start",
          }}>
            <Cpu size={14} color="#38bdf8" style={{ marginTop: "2px", flexShrink: 0 }} />
            <div style={{ fontSize: "0.73rem", color: "#cbd5e1", lineHeight: 1.5 }}>
              <strong style={{ color: "#38bdf8" }}>ML Model Analysis Only — </strong>
              This panel explains the Random Forest classifier decision.
              It is <strong style={{ color: "#f8fafc" }}>independent</strong> of IP Intelligence
              (VPN/Proxy/Tor detection shown separately below).
            </div>
          </div>

          {!explanation && (
            <div style={{
              display: "flex", alignItems: "center", gap: "0.5rem",
              color: "#64748b", fontSize: "0.78rem", padding: "0.5rem 0",
            }}>
              <AlertCircle size={14} />
              <span>Explanation data is unavailable for this prediction.</span>
            </div>
          )}

          {explanation && (
            <>
              {/* Summary row */}
              <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))",
                gap: "0.6rem",
              }}>
                <div style={{
                  backgroundColor: accentBg,
                  border: `1px solid ${accentColor}40`,
                  borderRadius: "7px",
                  padding: "0.55rem 0.75rem",
                }}>
                  <span style={{ fontSize: "0.64rem", color: "#64748b", fontWeight: 700, textTransform: "uppercase", display: "block" }}>
                    ML Prediction
                  </span>
                  <span style={{ fontSize: "1rem", fontWeight: 900, color: accentColor }}>
                    {(prediction || "Unknown").toUpperCase()}
                  </span>
                </div>
                <div style={{
                  backgroundColor: "#0d1628",
                  border: "1px solid #1e293b",
                  borderRadius: "7px",
                  padding: "0.55rem 0.75rem",
                }}>
                  <span style={{ fontSize: "0.64rem", color: "#64748b", fontWeight: 700, textTransform: "uppercase", display: "block" }}>
                    ML Confidence
                  </span>
                  <span style={{ fontSize: "1rem", fontWeight: 900, color: "#f8fafc" }}>
                    {confidence || "N/A"}
                  </span>
                </div>
              </div>

              {/* Feature list */}
              <div>
                <div style={{
                  fontSize: "0.72rem", fontWeight: 700, color: "#94a3b8",
                  textTransform: "uppercase", letterSpacing: "0.04em",
                  marginBottom: "0.5rem",
                }}>
                  Top Model Features — Global RF Importance × This Record&apos;s Values
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "0.45rem" }}>
                  {explanation.top_features.map((feat, idx) => (
                    <div
                      key={feat.name}
                      style={{
                        backgroundColor: "#0d1628",
                        border: "1px solid #141f33",
                        borderRadius: "7px",
                        padding: "0.55rem 0.75rem",
                      }}
                    >
                      <div style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: "0.3rem",
                        flexWrap: "wrap",
                        gap: "0.25rem",
                      }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                          <span style={{
                            fontSize: "0.64rem", fontWeight: 800,
                            color: "#475569", width: "14px", textAlign: "right",
                          }}>
                            {idx + 1}.
                          </span>
                          <span style={{
                            fontFamily: "monospace", fontWeight: 800,
                            fontSize: "0.82rem", color: "#f8fafc",
                          }}>
                            {feat.name}
                          </span>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                          <span style={{
                            fontFamily: "monospace", fontSize: "0.76rem",
                            color: "#38bdf8", backgroundColor: "rgba(56,189,248,0.1)",
                            padding: "1px 6px", borderRadius: "4px",
                          }}>
                            {String(feat.value)}
                          </span>
                          <span style={{
                            fontSize: "0.68rem", fontWeight: 700,
                            color: labelColor(feat.importance_label),
                            backgroundColor: `${labelColor(feat.importance_label)}18`,
                            padding: "1px 6px", borderRadius: "3px",
                          }}>
                            {feat.importance_label}
                          </span>
                        </div>
                      </div>

                      {/* Importance bar */}
                      <div style={{
                        height: "4px", backgroundColor: "#1e293b", borderRadius: "2px", overflow: "hidden",
                      }}>
                        <div style={{
                          height: "100%",
                          width: importanceBarWidth(feat.importance),
                          backgroundColor: labelColor(feat.importance_label),
                          borderRadius: "2px",
                        }} />
                      </div>

                      <div style={{ fontSize: "0.64rem", color: "#475569", marginTop: "0.2rem" }}>
                        Global model importance: {(feat.importance * 100).toFixed(2)}%
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Method & honest disclaimer */}
              <div style={{
                backgroundColor: "#0a0f1d",
                border: "1px solid #1e293b",
                borderRadius: "7px",
                padding: "0.6rem 0.85rem",
                fontSize: "0.7rem",
                color: "#64748b",
                lineHeight: 1.6,
              }}>
                <div style={{ fontWeight: 700, color: "#475569", marginBottom: "0.2rem" }}>
                  Explanation Method: {explanation.method}
                </div>
                <div>{explanation.method_note}</div>
                <div style={{ marginTop: "0.35rem", color: "#475569" }}>
                  ⚠ These features are among the most influential factors used by the trained model
                  across all NSL-KDD training data. This is not a causal claim about this specific
                  packet — it indicates what the model pays attention to globally.
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
