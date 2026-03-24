import { memo } from 'react';
import { getBezierPath, type EdgeProps } from '@xyflow/react';

function IdentityEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
}: EdgeProps) {
  const [edgePath] = getBezierPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
  });

  return (
    <path
      id={id}
      d={edgePath}
      stroke="#D97706"
      strokeOpacity={0.3}
      strokeWidth={1.5}
      strokeDasharray="3 3"
      fill="none"
    />
  );
}

export default memo(IdentityEdge);
