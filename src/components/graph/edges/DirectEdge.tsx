import { memo } from 'react';
import { getBezierPath, type EdgeProps } from '@xyflow/react';

type DirectEdgeData = { isActive?: boolean; isHighlighted?: boolean };

const IDLE_COLOR = '#0D9488';
const ACTIVE_COLOR = '#14B8A6';
const HIGHLIGHT_COLOR = '#3B82F6';

function DirectEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
}: EdgeProps) {
  const [edgePath] = getBezierPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
  });

  const edgeData = data as DirectEdgeData | undefined;
  const isActive = edgeData?.isActive ?? false;
  const isHighlighted = edgeData?.isHighlighted ?? false;

  const strokeColor = isActive ? ACTIVE_COLOR : isHighlighted ? HIGHLIGHT_COLOR : IDLE_COLOR;
  const strokeWidth = isActive || isHighlighted ? 2.5 : 2;

  return (
    <>
      <path
        id={id}
        d={edgePath}
        stroke={strokeColor}
        strokeWidth={strokeWidth}
        strokeDasharray="6 4"
        fill="none"
      />
      {isActive && (
        <circle r={4} fill={ACTIVE_COLOR}>
          <animateMotion dur="1s" repeatCount="indefinite" path={edgePath} />
        </circle>
      )}
    </>
  );
}

export default memo(DirectEdge);
