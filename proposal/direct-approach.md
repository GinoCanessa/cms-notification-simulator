# Direct Approach

## Overview

In the **Direct Approach**, providers and client apps establish **direct communication channels** that bypass intermediary CMS Networks for routine data exchange. However, the trust-relationship graph still plays a critical role: initial discovery notifications (e.g., "a new provider is available" or "a new client has subscribed") always flow through the network chain. Only after the direct channel is established do subsequent notifications flow point-to-point.

This approach is a **hybrid model**: trust-channel routing for control-plane messages, direct channels for data-plane messages.

## Principles

1. **Trust channels for discovery** — New actor announcements and subscription setup always flow through the network trust graph.
2. **Direct channels for data** — Once a provider-client pair is aware of each other, they establish a direct FHIR Subscription channel.
3. **Channel establishment** — After receiving a discovery notification, the client app (or provider) initiates a direct connection using information contained in the notification.
4. **Dual-mode** — The system simultaneously maintains trust-graph routing (for control messages) and direct channels (for data messages).

## Channel Lifecycle

```
┌─────────────────────────────────────────────────────────────┐
│                    CHANNEL LIFECYCLE                         │
│                                                             │
│  ┌──────────┐    ┌───────────┐    ┌──────────┐             │
│  │ Discovery │───▶│  Setup    │───▶│  Active  │             │
│  │ (routed)  │    │ (direct)  │    │ (direct) │             │
│  └──────────┘    └───────────┘    └──────────┘             │
│                                        │                    │
│  Trust-channel      Handshake &        │  Encounter updates │
│  notification       subscription       │  flow directly     │
│  about new actor    creation           │  provider ↔ client │
│                                        ▼                    │
│                                   ┌──────────┐             │
│                                   │ Teardown │             │
│                                   └──────────┘             │
└─────────────────────────────────────────────────────────────┘
```

## Notification Flow: New Care Relationship (Provider-side event)

When a new care relationship is established, the **discovery notification** flows through the trust graph, but then a direct channel is established:

```
Provider-1 (on Network-A)
    │
    ▼  [1] Provider notifies its Network of new care relationship
Network-A
    │
    ├──▶ [2a] Notify local clients (with subscription endpoint info)
    │         Client receives: { provider: "P1", directEndpoint: "https://..." }
    │
    └──▶ [2b] Forward discovery to peered networks
              │
              ▼
          Network-B
              │
              └──▶ [3] Notify its local clients (with subscription endpoint info)
                       Client receives: { provider: "P1", directEndpoint: "https://..." }

--- After discovery ---

Client App (any that received the notification)
    │
    ▼  [4] Client establishes direct FHIR Subscription with Provider-1
Provider-1
    │
    ▼  [5] Direct channel is now active
    
    (Future encounter notifications flow: Provider-1 ──direct──▶ Client App)
```

### Step-by-Step

| Step | Actor | Action | Channel |
|------|-------|--------|---------|
| 1 | Provider | Publishes new-care-relationship event | Trust (Provider → Network) |
| 2 | Networks | Relay discovery notification through trust graph | Trust (Network → Network → … → Client) |
| 3 | Client App | Receives discovery notification with direct endpoint info | Trust (delivery) |
| 4 | Client App | Initiates direct FHIR Subscription handshake with Provider | **Direct** (Client → Provider) |
| 5 | Provider | Confirms subscription | **Direct** (Provider → Client) |
| 6+ | Provider | Sends encounter notifications directly | **Direct** (Provider → Client) |

## Notification Flow: Encounter Update

For an **existing** care relationship where a direct channel is already established:

```
Provider-1 ──────direct──────▶ Client App
           (encounter notification)
```

**Single hop. No network involvement.** The notification goes directly from provider to client over the previously established direct channel.

If the direct channel has **not yet been established** (e.g., the care relationship is brand new), the encounter notification falls back to the routed approach until the direct channel is set up.

## Notification Flow: New Client App Registration

When a new Client App registers:

```
Client App (new, on Network-B)
    │
    ▼  [1] Client registers with Network-B
Network-B
    │
    ├──▶ [2a] Network-B notifies its local providers:
    │         "New client available" (with client's direct endpoint)
    │
    └──▶ [2b] Network-B forwards to peered networks
              │
              ▼
          Network-A
              │
              └──▶ [3] Network-A notifies its local providers:
                       "New client available" (with client's direct endpoint)

--- After discovery ---

Each Provider that has a care relationship with this client:
    │
    ▼  [4] Provider establishes direct FHIR Subscription with Client
Client App
    │
    ▼  [5] Direct channel active; future notifications flow directly
```

## Notification Flow: New Network Peer

When two networks establish a new peering relationship:

```
Network-A ←──new peer──→ Network-B

[Phase 1: Discovery — via trust channels]

Network-A                           Network-B
    │                                   │
    ▼                                   ▼
Sends provider catalog ──▶      ◀── Sends provider catalog
    │                                   │
    ▼                                   ▼
Network-B notifies its          Network-A notifies its
clients about Network-A's      clients about Network-B's
providers (with endpoints)      providers (with endpoints)
    │                                   │
    ▼                                   ▼
Forwards to its other           Forwards to its other
peers (excl. Network-A)        peers (excl. Network-B)

[Phase 2: Direct channel establishment]

Each Client that received new provider info:
    │
    ▼
Establishes direct channel with each newly-discovered Provider
```

## Characteristics

| Property | Value |
|----------|-------|
| **Latency (steady-state)** | Low — direct provider-to-client communication |
| **Latency (discovery)** | Same as routed — discovery still traverses trust graph |
| **Complexity** | Higher for endpoints — providers and clients must manage many direct connections |
| **Network Load** | Lower on networks (only discovery traffic) |
| **Connection Count** | O(P × C) direct channels (providers × clients) in the worst case |
| **Failure Impact** | Network failure only blocks new discovery; existing direct channels continue |
| **Privacy** | Lower — data flows outside the mediated trust network |
| **Scalability** | Better for high-throughput data; worse for connection management |

## Comparison with Routed Approach

| Aspect | Routed | Direct |
|--------|--------|--------|
| Encounter notifications | Multi-hop through networks | Single hop (direct) |
| Discovery notifications | Multi-hop through networks | Multi-hop through networks (same) |
| Network role | Relay all traffic | Relay discovery only |
| Endpoint complexity | Simple (talk to home network) | Complex (manage many connections) |
| New actor setup cost | Low | Higher (must establish direct channels) |
| Steady-state efficiency | Lower | Higher |

## Visual Representation

In the simulator UI, the Direct Approach uses two visual styles:

1. **Trust-channel messages** (discovery): Solid lines with animated dots (same as Routed).
2. **Direct-channel messages** (data): **Dashed lines** connecting provider directly to client, with a distinct color (e.g., teal/cyan). The line appears only after the discovery phase completes.
3. **Channel establishment**: A brief "handshake" animation between provider and client when the direct channel is being set up.
