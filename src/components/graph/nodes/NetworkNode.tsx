import { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";

interface NetworkNodeData {
  label: string;
  shortId: string;
  isAnimating?: boolean;
  isHighlighted?: boolean;
  messageCount?: string;
}

const FILL = "#059669";
const HIGHLIGHT_COLOR = "#3B82F6";
const R = 28;
const SVG_SIZE = R * 2 + 8;
const HALF = SVG_SIZE / 2;

function NetworkNode({ data }: NodeProps) {
  const { label, shortId, isAnimating, isHighlighted, messageCount = '0:0' } = data as unknown as NetworkNodeData;

  return (
    <div style={{ position: "relative" }}>
      <svg
        width={SVG_SIZE}
        height={SVG_SIZE + 16}
        viewBox={`${-HALF} ${-HALF} ${SVG_SIZE} ${SVG_SIZE + 16}`}
      >
        {isAnimating && (
          <circle r={R + 4} fill="none" stroke={FILL} strokeWidth={2}>
            <animate
              attributeName="opacity"
              values="0.3;0.8;0.3"
              dur="1.5s"
              repeatCount="indefinite"
            />
          </circle>
        )}

        {isHighlighted && !isAnimating && (
          <circle r={R + 4} fill="none" stroke={HIGHLIGHT_COLOR} strokeWidth={2.5} strokeDasharray="4 2" />
        )}

        {/* Circle */}
        <circle r={R} fill={FILL} />

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
        <rect x={R - 22} y={-(R + 1)} width={32} height={14} rx={7} fill="#1E293B" stroke="white" strokeWidth={1.5} />
        <text
          x={R - 6}
          y={-(R - 6)}
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
          y={R + 6}
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
      <Handle
        type="target"
        position={Position.Left}
        id="left"
        style={{ background: "#555", width: 6, height: 6 }}
      />
      <Handle
        type="source"
        position={Position.Right}
        id="right"
        style={{ background: "#555", width: 6, height: 6 }}
      />
    </div>
  );
}

export default memo(NetworkNode);
