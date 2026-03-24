# CMS Notification Simulator — Proposal

## Overview

The **CMS Notification Simulator** is an interactive web application for exploring and visualizing FHIR Subscription notification traffic across a federated healthcare network topology. It enables users to build network graphs of healthcare actors, establish trust relationships, and simulate two distinct notification routing strategies—**Routed** and **Direct**—to understand their trade-offs in real time.

## Problem Statement

In a federated CMS ecosystem, healthcare data notifications (e.g., new encounters, care relationship changes) must flow between Providers and Client Applications. These actors don't communicate directly—they are connected through a web of trust relationships involving Identity Platforms (IDPs) and CMS Networks that may themselves be peered.

Two architectural approaches exist for delivering these notifications:

1. **Routed Approach** — Notifications always travel along the chain of established trust relationships (Provider → Network → … → Network → Client App).
2. **Direct Approach** — After an initial trust-channel notification, providers and client apps establish direct communication channels, bypassing intermediary networks for subsequent data.

Understanding the data flows, latency implications, fan-out behavior, and failure modes of each approach requires an interactive simulation tool—not just static diagrams.

## Goals

- **Educate** stakeholders on the two notification models through an interactive overview.
- **Visualize** complex multi-hop notification paths in real time.
- **Simulate** events (new provider, new client, encounter update, new network peer) and watch notifications propagate.
- **Compare** the Routed and Direct approaches side-by-side.
- **Provide** an event log showing every discrete data flow with actor, channel, and payload details.

## Proposal Documents

| Document | Description |
|----------|-------------|
| [Data Model](./data-model.md) | Actor types, trust relationships, and graph structure |
| [Routed Approach](./routed-approach.md) | Detailed description of the routed notification model |
| [Direct Approach](./direct-approach.md) | Detailed description of the direct notification model |
| [Event Flows](./event-flows.md) | Catalog of triggerable events and their notification paths |
| [UI Design](./ui-design.md) | User interface layout, interactions, and visual design |
| [Architecture](./architecture.md) | Technical architecture and technology choices |
| [Implementation Plan](./implementation-plan.md) | Phased build plan with deliverables |

## Key Terminology

| Term | Definition |
|------|-----------|
| **Actor** | A node in the network graph (Client App, IDP, CMS Network, Provider) |
| **Trust Link** | A bidirectional relationship between two actors that permits data flow |
| **Notification** | A FHIR Subscription notification message triggered by an event |
| **Hop** | A single traversal across one trust link |
| **Fan-out** | When a single notification must be delivered to multiple downstream actors |
| **Direct Channel** | A point-to-point connection established between a Provider and Client App (Direct Approach only) |
