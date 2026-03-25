import { memo } from 'react';
import { getBezierPath, type EdgeProps } from '@xyflow/react';

type TrustEdgeData = { isActive?: boolean; isReversed?: boolean; isHighlighted?: boolean };

const IDLE_COLOR = '#CBD5E1';
const ACTIVE_COLOR = '#D97706';
const HIGHLIGHT_COLOR = '#3B82F6';

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
  const isReversed = edgeData?.isReversed ?? false;
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
        strokeDasharray={isHighlighted && !isActive ? '6 3' : undefined}
        fill="none"
      />
      {isActive && (
        <circle r={4} fill={ACTIVE_COLOR}>
          <animateMotion
            dur="1s"
            repeatCount="indefinite"
            path={edgePath}
            {...(isReversed ? { keyPoints: '1;0', keyTimes: '0;1' } : {})}
          />
        </circle>
      )}
    </>
  );
}

export default memo(TrustEdge);
