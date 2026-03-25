import { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";

interface IdpNodeData {
  label: string;
  shortId: string;
  isAnimating?: boolean;
  messageCount?: string;
}

const FILL = "#D97706";
const HEX_R = 30;

// Hexagon points (flat-top orientation)
function hexPoints(r: number): string {
  return Array.from({ length: 6 }, (_, i) => {
    const angle = (Math.PI / 3) * i - Math.PI / 6;
    return `${r * Math.cos(angle)},${r * Math.sin(angle)}`;
  }).join(" ");
}

function IdpNode({ data }: NodeProps) {
  const { label, shortId, isAnimating, messageCount = '0:0' } = data as unknown as IdpNodeData;

  const svgW = HEX_R * 2 + 12;
  const svgH = HEX_R * 2 + 24;
  const half = svgW / 2;

  return (
    <div style={{ position: "relative" }}>
      <svg
        width={svgW}
        height={svgH}
        viewBox={`${-half} ${-(HEX_R + 4)} ${svgW} ${svgH}`}
      >
        {isAnimating && (
          <polygon
            points={hexPoints(HEX_R + 4)}
            fill="none"
            stroke={FILL}
            strokeWidth={2}
          >
            <animate
              attributeName="opacity"
              values="0.3;0.8;0.3"
              dur="1.5s"
              repeatCount="indefinite"
            />
          </polygon>
        )}

        {/* Hexagon */}
        <polygon points={hexPoints(HEX_R)} fill={FILL} />

        {/* Short ID */}
        <text
          fill="white"
          textAnchor="middle"
          dominantBaseline="central"
          fontSize="12"
          fontWeight="700"
        >
          {shortId}
        </text>

        {/* Message count badge */}
        <rect x={HEX_R - 22} y={-(HEX_R + 1)} width={32} height={14} rx={7} fill="#1E293B" stroke="white" strokeWidth={1.5} />
        <text
          x={HEX_R - 6}
          y={-(HEX_R - 8)}
          fill="white"
          textAnchor="middle"
          dominantBaseline="central"
          fontSize="8"
          fontWeight="700"
        >
          {messageCount}
        </text>

        {/* Name label */}
        <text
          y={HEX_R + 6}
          fill="currentColor"
          textAnchor="middle"
          dominantBaseline="hanging"
          fontSize="10"
          fontWeight="600"
        >
          {label}
        </text>
      </svg>

      <Handle
        type="target"
        position={Position.Top}
        style={{ background: "#555", width: 6, height: 6 }}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        style={{ background: "#555", width: 6, height: 6 }}
      />
    </div>
  );
}

export default memo(IdpNode);
