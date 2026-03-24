import { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";

interface NetworkNodeData {
  label: string;
  shortId: string;
  isAnimating?: boolean;
}

const FILL = "#059669";
const R = 28;
const SVG_SIZE = R * 2 + 8;
const HALF = SVG_SIZE / 2;

function NetworkNode({ data }: NodeProps) {
  const { label, shortId, isAnimating } = data as unknown as NetworkNodeData;

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
