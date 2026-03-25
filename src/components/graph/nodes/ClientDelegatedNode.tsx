import { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";

interface ClientDelegatedNodeData {
  label: string;
  shortId: string;
  isAnimating?: boolean;
  isHighlighted?: boolean;
  messageCount?: string;
}

const FILL = "#7C3AED";
const HIGHLIGHT_COLOR = "#3B82F6";
const W = 64;
const H = 36;
const RX = 6;

function ClientDelegatedNode({ data }: NodeProps) {
  const { label, shortId, isAnimating, isHighlighted, messageCount = '0:0' } =
    data as unknown as ClientDelegatedNodeData;

  return (
    <div style={{ position: "relative" }}>
      <svg
        width={W + 16}
        height={H + 32}
        viewBox={`${-(W / 2 + 8)} ${-(H / 2 + 4)} ${W + 16} ${H + 32}`}
      >
        {isAnimating && (
          <rect
            x={-(W / 2 + 4)}
            y={-(H / 2 + 4)}
            width={W + 8}
            height={H + 8}
            rx={RX + 2}
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
          </rect>
        )}

        {isHighlighted && !isAnimating && (
          <rect
            x={-(W / 2 + 4)}
            y={-(H / 2 + 4)}
            width={W + 8}
            height={H + 8}
            rx={RX + 2}
            fill="none"
            stroke={HIGHLIGHT_COLOR}
            strokeWidth={2.5}
            strokeDasharray="4 2"
          />
        )}

        {/* Rounded rectangle */}
        <rect
          x={-W / 2}
          y={-H / 2}
          width={W}
          height={H}
          rx={RX}
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
        <rect x={W / 2 - 18} y={-(H / 2 + 5)} width={32} height={14} rx={7} fill="#1E293B" stroke="white" strokeWidth={1.5} />
        <text
          x={W / 2 - 2}
          y={-(H / 2 - 2)}
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
          y={H / 2 + 6}
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
          y={H / 2 + 18}
          fill="#9CA3AF"
          textAnchor="middle"
          dominantBaseline="hanging"
          fontSize="8"
          fontWeight="400"
        >
          Delegated
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

export default memo(ClientDelegatedNode);
