import { Link } from 'react-router-dom';

/* ─── SVG mini-diagrams for approach cards ──────────────────────────── */

function RoutedDiagram() {
  return (
    <svg viewBox="0 0 340 60" className="w-full h-auto" aria-label="Routed approach diagram">
      {/* Provider */}
      <polygon points="30,10 50,30 30,50 10,30" fill="#DC2626" />
      <text x="30" y="34" textAnchor="middle" fill="white" fontSize="9" fontWeight="600">P</text>

      {/* Arrow P → N1 */}
      <line x1="52" y1="30" x2="98" y2="30" stroke="var(--color-text-tertiary)" strokeWidth="2" markerEnd="url(#arrowSolid)" />

      {/* Network 1 */}
      <circle cx="120" cy="30" r="20" fill="#059669" />
      <text x="120" y="34" textAnchor="middle" fill="white" fontSize="9" fontWeight="600">N</text>

      {/* Arrow N1 → N2 */}
      <line x1="142" y1="30" x2="188" y2="30" stroke="var(--color-text-tertiary)" strokeWidth="2" markerEnd="url(#arrowSolid)" />

      {/* Network 2 */}
      <circle cx="210" cy="30" r="20" fill="#059669" />
      <text x="210" y="34" textAnchor="middle" fill="white" fontSize="9" fontWeight="600">N</text>

      {/* Arrow N2 → C */}
      <line x1="232" y1="30" x2="278" y2="30" stroke="var(--color-text-tertiary)" strokeWidth="2" markerEnd="url(#arrowSolid)" />

      {/* Client */}
      <rect x="280" y="14" width="50" height="32" rx="6" fill="#0EA5E9" />
      <text x="305" y="34" textAnchor="middle" fill="white" fontSize="9" fontWeight="600">C</text>

      <defs>
        <marker id="arrowSolid" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--color-text-tertiary)" />
        </marker>
      </defs>
    </svg>
  );
}

function DirectDiagram() {
  return (
    <svg viewBox="0 0 340 60" className="w-full h-auto" aria-label="Direct approach diagram">
      {/* Provider */}
      <polygon points="30,10 50,30 30,50 10,30" fill="#DC2626" />
      <text x="30" y="34" textAnchor="middle" fill="white" fontSize="9" fontWeight="600">P</text>

      {/* Faded network path */}
      <line x1="52" y1="30" x2="98" y2="30" stroke="var(--color-text-tertiary)" strokeWidth="1.5" opacity="0.25" />
      <circle cx="120" cy="30" r="20" fill="#059669" opacity="0.2" />
      <text x="120" y="34" textAnchor="middle" fill="white" fontSize="9" fontWeight="600" opacity="0.3">N</text>
      <line x1="142" y1="30" x2="188" y2="30" stroke="var(--color-text-tertiary)" strokeWidth="1.5" opacity="0.25" />
      <circle cx="210" cy="30" r="20" fill="#059669" opacity="0.2" />
      <text x="210" y="34" textAnchor="middle" fill="white" fontSize="9" fontWeight="600" opacity="0.3">N</text>
      <line x1="232" y1="30" x2="278" y2="30" stroke="var(--color-text-tertiary)" strokeWidth="1.5" opacity="0.25" />

      {/* Direct dashed arrow P → C */}
      <line x1="52" y1="30" x2="278" y2="30" stroke="#0EA5E9" strokeWidth="2.5" strokeDasharray="6 4" markerEnd="url(#arrowDirect)" />

      {/* Client */}
      <rect x="280" y="14" width="50" height="32" rx="6" fill="#0EA5E9" />
      <text x="305" y="34" textAnchor="middle" fill="white" fontSize="9" fontWeight="600">C</text>

      <defs>
        <marker id="arrowDirect" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M 0 0 L 10 5 L 0 10 z" fill="#0EA5E9" />
        </marker>
      </defs>
    </svg>
  );
}

/* ─── Actor shape SVGs ──────────────────────────────────────────────── */

function DiamondShape({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 48 48" className="w-12 h-12">
      <polygon points="24,4 44,24 24,44 4,24" fill={color} />
    </svg>
  );
}

function CircleShape({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 48 48" className="w-12 h-12">
      <circle cx="24" cy="24" r="20" fill={color} />
    </svg>
  );
}

function RoundedRectShape({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 56 36" className="w-14 h-9">
      <rect x="2" y="2" width="52" height="32" rx="6" fill={color} />
    </svg>
  );
}

function HexagonShape({ color }: { color: string }) {
  const r = 20;
  const cx = 24;
  const cy = 24;
  const points = Array.from({ length: 6 }, (_, i) => {
    const angle = (Math.PI / 3) * i - Math.PI / 6;
    return `${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`;
  }).join(' ');
  return (
    <svg viewBox="0 0 48 48" className="w-12 h-12">
      <polygon points={points} fill={color} />
    </svg>
  );
}

/* ─── Data ──────────────────────────────────────────────────────────── */

const actors: {
  name: string;
  description: string;
  color: string;
  shape: React.FC<{ color: string }>;
}[] = [
  {
    name: 'Provider',
    description:
      'A healthcare provider that generates clinical data and notifications. Registered with exactly one CMS Network.',
    color: '#DC2626',
    shape: DiamondShape,
  },
  {
    name: 'CMS Network',
    description:
      'The backbone of notification routing. Networks relay messages and can peer with other networks to extend reach.',
    color: '#059669',
    shape: CircleShape,
  },
  {
    name: 'Client App — Patient',
    description:
      'A client application operating on behalf of a patient. Registered with one CMS Network and trusts one IDP.',
    color: '#0EA5E9',
    shape: RoundedRectShape,
  },
  {
    name: 'Client App — Delegated',
    description:
      'A client application with delegated authority (e.g., payer system). Same structure as Patient client.',
    color: '#7C3AED',
    shape: RoundedRectShape,
  },
  {
    name: 'IDP',
    description:
      'An identity and authorization service. Establishes trust for client apps but does not participate in notification routing.',
    color: '#D97706',
    shape: HexagonShape,
  },
];

/* ─── Page ──────────────────────────────────────────────────────────── */

export default function OverviewPage() {
  return (
    <div className="flex-1 overflow-y-auto">
      <div className="mx-auto max-w-[960px] px-6 py-10 flex flex-col gap-12">
        {/* ── Hero ────────────────────────────────────────────── */}
        <section
          className="rounded-lg p-8 md:p-10 text-center"
          style={{
            background: 'var(--color-surface)',
            boxShadow: 'var(--shadow-md)',
            border: '1px solid var(--color-border)',
          }}
        >
          <h1 className="text-2xl md:text-3xl font-bold text-[var(--color-text)] mb-4">
            CMS FHIR Subscription Notification Simulator
          </h1>
          <p className="text-[var(--color-text-secondary)] text-base md:text-lg leading-relaxed max-w-[720px] mx-auto">
            Explore and visualize FHIR Subscription notification traffic across a federated
            healthcare network. Build network topologies, simulate events, and compare two distinct
            notification routing strategies — Routed and Direct.
          </p>
        </section>

        {/* ── Approach Cards ─────────────────────────────────── */}
        <section>
          <h2 className="text-xl font-semibold text-[var(--color-text)] mb-5">
            Notification Approaches
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Routed */}
            <div
              className="rounded-lg p-6 flex flex-col gap-4"
              style={{
                background: 'var(--color-surface)',
                boxShadow: 'var(--shadow-sm)',
                border: '1px solid var(--color-border)',
              }}
            >
              <h3 className="text-lg font-semibold text-[var(--color-text)]">Routed Approach</h3>
              <div className="px-2">
                <RoutedDiagram />
              </div>
              <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
                All notifications travel along established trust relationships through CMS Networks.
                Networks relay messages hop-by-hop, providing mediated access control but adding
                latency.
              </p>
              <Link
                to="/simulator?approach=routed"
                className="mt-auto inline-flex items-center justify-center gap-1 rounded px-6 py-2 text-sm font-medium text-white no-underline transition-colors"
                style={{ background: 'var(--color-brand)' }}
              >
                Try Routed →
              </Link>
            </div>

            {/* Direct */}
            <div
              className="rounded-lg p-6 flex flex-col gap-4"
              style={{
                background: 'var(--color-surface)',
                boxShadow: 'var(--shadow-sm)',
                border: '1px solid var(--color-border)',
              }}
            >
              <h3 className="text-lg font-semibold text-[var(--color-text)]">Direct Approach</h3>
              <div className="px-2">
                <DirectDiagram />
              </div>
              <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
                After initial discovery through the trust graph, providers and clients establish
                direct communication channels. Subsequent data flows bypass intermediary networks.
              </p>
              <Link
                to="/simulator?approach=direct"
                className="mt-auto inline-flex items-center justify-center gap-1 rounded px-6 py-2 text-sm font-medium text-white no-underline transition-colors"
                style={{ background: 'var(--color-brand)' }}
              >
                Try Direct →
              </Link>
            </div>
          </div>
        </section>

        {/* ── Actor Types ─────────────────────────────────────── */}
        <section className="pb-8">
          <h2 className="text-xl font-semibold text-[var(--color-text)] mb-5">Actor Types</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {actors.map((actor) => {
              const ShapeComponent = actor.shape;
              return (
                <div
                  key={actor.name}
                  className="rounded-lg p-5 flex flex-col items-center text-center gap-3"
                  style={{
                    background: 'var(--color-surface)',
                    boxShadow: 'var(--shadow-sm)',
                    border: '1px solid var(--color-border)',
                  }}
                >
                  <ShapeComponent color={actor.color} />
                  <h3 className="text-sm font-semibold text-[var(--color-text)]">{actor.name}</h3>
                  <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
                    {actor.description}
                  </p>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}
