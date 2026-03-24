# Routed Approach

## Overview

In the **Routed Approach**, all FHIR Subscription notifications travel exclusively along established trust relationships. There are no direct channels between providers and client apps. Every notification passes through one or more CMS Networks acting as intermediary relay nodes.

This approach mirrors a **store-and-forward** or **message relay** pattern where each network in the chain receives, processes, and forwards the notification to the next hop.

## Principles

1. **Trust-only routing** — Data never flows between actors that don't have a direct trust link.
2. **Network relay** — CMS Networks are active participants: they receive notifications, determine the next hop(s), and forward them.
3. **Fan-out at networks** — When a network has multiple downstream paths (e.g., multiple peered networks or multiple registered clients), it fans the notification out to all of them.
4. **No shortcutting** — Even if a provider and client are "close" in the graph, the notification still traverses every network in the path.

## Notification Flow: Encounter Update

When a Provider generates a new Encounter (or updates an existing one):

```
Provider-1
    │
    ▼  [1] Provider sends Encounter notification to its Network
Network-A
    │
    ├──▶ [2a] Network-A delivers to all registered Client Apps on Network-A
    │         that have a matching subscription
    │
    └──▶ [2b] Network-A forwards to all peered Networks
              │
              ▼
          Network-B
              │
              ├──▶ [3a] Network-B delivers to all registered Client Apps on Network-B
              │         that have a matching subscription
              │
              └──▶ [3b] Network-B forwards to its peered Networks
                        (excluding Network-A to prevent loops)
                        ...continues until all reachable networks are visited
```

### Step-by-Step

| Step | Actor | Action | FHIR Interaction |
|------|-------|--------|-----------------|
| 1 | Provider | Publishes event to its home network | `Subscription Notification (event-notification)` |
| 2 | Home Network | Checks local client subscriptions and delivers | `Subscription Notification (forward)` |
| 3 | Home Network | Forwards to all peered networks | `Subscription Notification (forward)` |
| 4 | Peer Network | Repeats steps 2-3 for its own clients and peers | Recursive relay |
| 5 | Client App | Receives notification | `Subscription Notification (delivery)` |

### Loop Prevention

Networks use a **visited set** (included in the notification envelope) to track which networks have already processed the notification. A network that receives a notification it has already seen discards it.

```json
{
  "notificationId": "uuid-1234",
  "visitedNetworks": ["network-a", "network-b"],
  "payload": { ... }
}
```

## Notification Flow: New Care Relationship

When a new care relationship is established (e.g., a patient is assigned to a new provider):

```
Provider
    │
    ▼  [1] Provider notifies its Network of the new relationship
Network (Provider's)
    │
    ├──▶ [2a] Notify local clients with matching subscriptions
    │
    └──▶ [2b] Forward to peered networks (same relay pattern)
              │
              ▼
          ... relay through network graph ...
              │
              ▼
          Client App receives "new care relationship" notification
```

The flow is structurally identical to an encounter update—only the **payload type** differs. The routing mechanism is the same.

## Notification Flow: New Client App Registration

When a new Client App registers with a network:

```
Client App (new)
    │
    ▼  [1] Client registers with its Network and creates subscriptions
Network (Client's)
    │
    ├──▶ [2a] Network queries all local providers for relevant data
    │         and delivers initial state to the new client
    │
    └──▶ [2b] Network forwards "new subscriber" notification to peered networks
              │
              ▼
          Peer Network
              │
              ├──▶ [3a] Queries its local providers for relevant data
              │         and relays responses back through the network chain
              │
              └──▶ [3b] Forwards to its peers (continuing the fan-out)
```

Responses (historical data / initial sync) flow **back** along the same path, in reverse.

## Notification Flow: New Network Peer

When two networks establish a new peering relationship:

```
Network-A ←──new peer──→ Network-B
    │                        │
    ▼                        ▼
[1] Network-A sends         [1] Network-B sends
    provider catalog             provider catalog
    to Network-B                 to Network-A
    │                        │
    ▼                        ▼
[2] Network-B notifies      [2] Network-A notifies
    its clients about            its clients about
    Network-A's providers        Network-B's providers
    │                        │
    ▼                        ▼
[3] Network-B forwards       [3] Network-A forwards
    to its other peers           to its other peers
    (excluding Network-A)       (excluding Network-B)
```

This is the most complex event, as it triggers a **bilateral fan-out**: both networks must inform their respective downstream actors about the newly reachable providers/clients.

## Characteristics

| Property | Value |
|----------|-------|
| **Latency** | Higher — each network hop adds processing time |
| **Complexity** | Lower for endpoints — providers and clients only talk to their home network |
| **Network Load** | Higher on networks — they handle all relay traffic |
| **Failure Impact** | A network failure can sever connectivity for all actors behind it |
| **Privacy** | Strong — data is always mediated by trusted networks |
| **Scalability** | May bottleneck at heavily-peered networks |

## Visual Representation

In the simulator UI, routed notifications are shown as:
- **Solid lines** along trust edges, with an animated dot/pulse traveling along each hop.
- Each hop is shown sequentially (with a small delay) to illustrate the multi-hop nature.
- The event log records each individual hop as a separate entry.
