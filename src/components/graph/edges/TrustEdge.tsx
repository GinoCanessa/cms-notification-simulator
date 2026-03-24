import { memo } from 'react';
import { getBezierPath, type EdgeProps } from '@xyflow/react';

type TrustEdgeData = { isActive?: boolean };

const IDLE_COLOR = '#CBD5E1';
const ACTIVE_COLOR = '#D97706';

function TrustEdge({
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

  const edgeData = data as TrustEdgeData | undefined;
  const isActive = edgeData?.isActive ?? false;

  return (
    <>
      <path
        id={id}
        d={edgePath}
        stroke={isActive ? ACTIVE_COLOR : IDLE_COLOR}
        strokeWidth={isActive ? 2.5 : 2}
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

export default memo(TrustEdge);
