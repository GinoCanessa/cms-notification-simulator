# Data Model

## Actor Types

### Client App — Patient

A client application operating on behalf of a patient. It has been authorized through an IDP and is registered with exactly one CMS Network.

| Property | Description |
|----------|-------------|
| `id` | Unique identifier |
| `name` | Display name (e.g., "MyChart - Patient: Jane Doe") |
| `type` | `client-patient` |
| `idpId` | Reference to the IDP this client trusts |
| `networkId` | Reference to the single CMS Network this client is registered with |

**Trust relationships:**
- Trusts exactly **one** IDP (authentication/authorization).
- Registered with exactly **one** CMS Network (data channel).

### Client App — Delegated

A client application operating with delegated authority (e.g., a payer system, care coordinator app). Structurally identical to the Patient client but distinguished by its authorization scope.

| Property | Description |
|----------|-------------|
| `id` | Unique identifier |
| `name` | Display name (e.g., "Payer Portal - Aetna") |
| `type` | `client-delegated` |
| `idpId` | Reference to the IDP this client trusts |
| `networkId` | Reference to the single CMS Network this client is registered with |

**Trust relationships:**
- Trusts exactly **one** IDP.
- Registered with exactly **one** CMS Network.

### Identification Platform (IDP)

An identity and authorization service that establishes trust for client applications. Multiple clients can trust the same IDP.

| Property | Description |
|----------|-------------|
| `id` | Unique identifier |
| `name` | Display name (e.g., "CMS IDP Central") |
| `type` | `idp` |

**Trust relationships:**
- Trusted by zero or more Client Apps.

> **Note:** The IDP establishes *identity trust* but does not participate in the notification data flow. It is shown in the graph for completeness but notifications do not route through the IDP.

### CMS Network

A network node in the federated topology. Networks are the backbone of notification routing—they relay messages between providers and client apps, and can peer with other networks to extend reach.

| Property | Description |
|----------|-------------|
| `id` | Unique identifier |
| `name` | Display name (e.g., "CMS Network East") |
| `type` | `network` |

**Trust relationships:**
- Zero or more **Client Apps** are registered.
- Zero or more **Providers** are registered.
- Zero or more **peer CMS Networks** (bidirectional peering).

### Provider

A healthcare provider (organization or individual) that generates clinical data and notifications. A provider is registered with exactly one CMS Network.

| Property | Description |
|----------|-------------|
| `id` | Unique identifier |
| `name` | Display name (e.g., "Dr. Smith — General Practice") |
| `type` | `provider` |
| `networkId` | Reference to the CMS Network this provider is registered with |

**Trust relationships:**
- Registered with exactly **one** CMS Network.

---

## Trust Relationship Types

All trust relationships are **bidirectional** — if A trusts B, then B trusts A. Data can flow in both directions along a trust link.

| Relationship | From | To | Cardinality | Participates in Notification Routing? |
|-------------|------|----|-------------|---------------------------------------|
| Client ↔ IDP | Client App | IDP | Many-to-One | No (identity only) |
| Client ↔ Network | Client App | CMS Network | Many-to-One | **Yes** |
| Network ↔ Network | CMS Network | CMS Network | Many-to-Many | **Yes** |
| Provider ↔ Network | Provider | CMS Network | Many-to-One | **Yes** |

---

## Graph Structure

The overall topology forms a **graph** with actors as nodes and trust relationships as edges. For notification routing purposes, the relevant subgraph excludes the IDP (since it doesn't participate in data flow) and consists of:

```
[Provider] ── [Network] ── [Network] ── ... ── [Network] ── [Client App]
                  │                                  │
              [Provider]                        [Client App]
                  │
              [Provider]
```

### Path Discovery

Given this graph, the system must be able to:

1. **Find all paths** from a Provider to all reachable Client Apps (following trust edges through networks).
2. **Find all paths** from a Client App to all reachable Providers.
3. **Determine reachability** — whether any path exists between two actors.
4. **Compute shortest path** — for display/animation purposes.

### Constraints

- A Client App or Provider connects to exactly **one** Network.
- Networks can peer with any number of other Networks.
- There are no cycles in the routing path for a single notification (use shortest-path or BFS to avoid loops).
- The IDP is rendered in the graph but is not part of notification routing.

---

## Direct Channels (Direct Approach Only)

In the Direct Approach, after an initial setup notification flows through the trust graph, a **direct channel** is established:

| Property | Description |
|----------|-------------|
| `id` | Unique identifier |
| `providerId` | The provider endpoint |
| `clientId` | The client app endpoint |
| `establishedAt` | Timestamp when the channel was created |

Direct channels are overlaid on the graph as dashed edges connecting a Provider directly to a Client App, bypassing all intermediary networks.

---

## Example Topology

```
                    ┌─────────┐
                    │  IDP-1  │
                    └────┬────┘
                         │ (identity trust)
          ┌──────────────┼──────────────┐
          ▼              ▼              ▼
   ┌─────────────┐ ┌──────────┐ ┌──────────────┐
   │ Client App  │ │Client App│ │  Client App  │
   │  (Patient)  │ │(Delegated│ │  (Patient)   │
   │    CA-1     │ │  CA-2)   │ │    CA-3      │
   └──────┬──────┘ └────┬─────┘ └──────┬───────┘
          │              │              │
          ▼              ▼              ▼
   ┌─────────────┐ ┌──────────┐ ┌──────────────┐
   │ Network-A   │ │Network-A │ │  Network-B   │
   │             │◄┤          ├►│              │
   └──────┬──────┘ └──────────┘ └──────┬───────┘
          │         (same net)         │
          │                            │
          ▼                            ▼
   ┌─────────────┐              ┌──────────────┐
   │ Provider-1  │              │  Provider-2  │
   └─────────────┘              └──────────────┘
```

In this example:
- CA-1 and CA-2 are on Network-A; CA-3 is on Network-B.
- Network-A and Network-B are peered.
- Provider-1 is on Network-A; Provider-2 is on Network-B.
- An encounter from Provider-2 can reach CA-1 via: Provider-2 → Network-B → Network-A → CA-1.
