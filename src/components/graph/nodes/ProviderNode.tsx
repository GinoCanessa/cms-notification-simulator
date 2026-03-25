import { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";

interface ProviderNodeData {
  label: string;
  shortId: string;
  isAnimating?: boolean;
  messageCount?: string;
}

const FILL = "#DC2626";
const SIZE = 40;

function ProviderNode({ data }: NodeProps) {
  const { label, shortId, isAnimating, messageCount = '0:0' } = data as unknown as ProviderNodeData;

  return (
    <div style={{ position: "relative" }}>
      <svg
        width={SIZE * 2}
        height={SIZE * 2 + 24}
        viewBox={`${-SIZE} ${-SIZE} ${SIZE * 2} ${SIZE * 2 + 24}`}
      >
        {isAnimating && (
          <polygon
            points={`0,${-SIZE + 2} ${SIZE - 2},0 0,${SIZE - 2} ${-SIZE + 2},0`}
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

        {/* Diamond */}
        <polygon
          points={`0,${-SIZE + 8} ${SIZE - 8},0 0,${SIZE - 8} ${-SIZE + 8},0`}
          fill={FILL}
        />

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
        <rect x={SIZE - 28} y={-SIZE + 5} width={32} height={14} rx={7} fill="#1E293B" stroke="white" strokeWidth={1.5} />
        <text
          x={SIZE - 12}
          y={-SIZE + 12}
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
          y={SIZE - 2}
          fill="currentColor"
          textAnchor="middle"
          dominantBaseline="hanging"
          fontSize="10"
          fontWeight="600"
        >
          {label}
        </text>

        {/* Sub-label */}
        <text
          y={SIZE + 12}
          fill="#9CA3AF"
          textAnchor="middle"
          dominantBaseline="hanging"
          fontSize="8"
          fontWeight="400"
        >
          Provider
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

export default memo(ProviderNode);
