import { memo } from 'react';
import { getBezierPath, type EdgeProps } from '@xyflow/react';

type DirectEdgeData = { isActive?: boolean };

const IDLE_COLOR = '#0D9488';
const ACTIVE_COLOR = '#14B8A6';

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

  return (
    <>
      <path
        id={id}
        d={edgePath}
        stroke={isActive ? ACTIVE_COLOR : IDLE_COLOR}
        strokeWidth={isActive ? 2.5 : 2}
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
