# Event Flows

This document catalogs every event the simulator supports, the notification paths for each approach, and the data payloads involved.

---

## Event Catalog

| # | Event | Trigger Source | Routed Path | Direct Path |
|---|-------|---------------|-------------|-------------|
| E1 | Encounter Update | Provider | Provider → Network(s) → Client(s) | Provider → Client (direct channel) |
| E2 | New Care Relationship | Provider | Provider → Network(s) → Client(s) | Provider → Network(s) → Client(s) → establish direct channel |
| E3 | New Client App Registration | Client App | Client → Network(s) → Provider(s) | Client → Network(s) → Provider(s) → establish direct channels |
| E4 | New Network Peer | Network Admin | Bilateral fan-out through both networks | Bilateral fan-out + direct channel establishment |
| E5 | New Provider Registration | Provider | Provider → Network → Client(s) | Provider → Network(s) → Client(s) → establish direct channels |
| E6 | Actor Removal | Any | Teardown notifications along trust paths | Teardown notifications + close direct channels |

---

## E1: Encounter Update

### Trigger
A provider creates or updates an Encounter resource.

### Precondition
- The provider is registered with a network.
- At least one client app has a subscription that matches this encounter (e.g., by patient, encounter type).

### Routed Approach

```
STEP  FROM           TO              MESSAGE TYPE                  
───── ────────────── ─────────────── ──────────────────────────────
1     Provider       Home Network    encounter-notification        
2     Home Network   Local Clients   encounter-notification        
3     Home Network   Peer Network(s) encounter-notification-relay  
4     Peer Network   Its Clients     encounter-notification        
5     Peer Network   Its Peers       encounter-notification-relay  
      (repeat 4-5 until all reachable networks visited)            
```

**Payload:**
```json
{
  "type": "encounter-notification",
  "notificationId": "uuid",
  "encounterId": "Encounter/12345",
  "providerId": "provider-1",
  "patientRef": "Patient/67890",
  "visitedNetworks": ["network-a"],
  "timestamp": "2026-03-24T12:00:00Z"
}
```

### Direct Approach

```
STEP  FROM           TO              MESSAGE TYPE                  
───── ────────────── ─────────────── ──────────────────────────────
1     Provider       Client App(s)   encounter-notification        
      (via established direct channels)                            
```

If no direct channel exists yet (first encounter after a new care relationship), falls back to the routed flow and includes direct endpoint information.

---

## E2: New Care Relationship

### Trigger
A provider establishes a new care relationship with a patient (e.g., a patient is assigned to a provider).

### Precondition
- The provider is registered with a network.
- At least one client app serves the patient.

### Routed Approach

```
STEP  FROM           TO              MESSAGE TYPE                  
───── ────────────── ─────────────── ──────────────────────────────
1     Provider       Home Network    new-care-relationship         
2     Home Network   Local Clients   new-care-relationship         
3     Home Network   Peer Network(s) new-care-relationship-relay   
4     Peer Network   Its Clients     new-care-relationship         
5     Peer Network   Its Peers       new-care-relationship-relay   
      (repeat until all reachable networks visited)                
```

### Direct Approach

```
STEP  FROM           TO              MESSAGE TYPE                  
───── ────────────── ─────────────── ──────────────────────────────
1     Provider       Home Network    new-care-relationship         
2     Home Network   Local Clients   new-care-relationship         
      (includes provider's direct endpoint)                        
3     Home Network   Peer Network(s) new-care-relationship-relay   
4     Peer Network   Its Clients     new-care-relationship         
      (includes provider's direct endpoint)                        
5     Client App     Provider        direct-channel-handshake      
6     Provider       Client App      direct-channel-confirm        
```

**Payload (step 2/4, Direct):**
```json
{
  "type": "new-care-relationship",
  "notificationId": "uuid",
  "providerId": "provider-1",
  "patientRef": "Patient/67890",
  "directEndpoint": "https://provider-1.example.com/fhir/r4",
  "visitedNetworks": ["network-a"],
  "timestamp": "2026-03-24T12:00:00Z"
}
```

---

## E3: New Client App Registration

### Trigger
A new client app registers with a CMS Network and creates FHIR Subscriptions.

### Precondition
- The client app has established trust with an IDP.
- The client app connects to exactly one network.

### Routed Approach

```
STEP  FROM           TO              MESSAGE TYPE                  
───── ────────────── ─────────────── ──────────────────────────────
1     Client App     Home Network    client-registration           
2     Home Network   Local Providers new-subscriber-notification   
3     Home Network   Peer Network(s) new-subscriber-relay          
4     Peer Network   Its Providers   new-subscriber-notification   
5     Peer Network   Its Peers       new-subscriber-relay          
      (repeat until all reachable networks visited)                

--- Response flow (initial data sync) ---
6     Providers      Home Network    initial-data-bundle           
7     Networks       Client App      initial-data-bundle (relayed) 
```

### Direct Approach

```
STEP  FROM           TO              MESSAGE TYPE                  
───── ────────────── ─────────────── ──────────────────────────────
1     Client App     Home Network    client-registration           
      (includes client's direct endpoint)                          
2     Home Network   Local Providers new-subscriber-notification   
      (includes client's direct endpoint)                          
3     Home Network   Peer Network(s) new-subscriber-relay          
4     Peer Network   Its Providers   new-subscriber-notification   
      (includes client's direct endpoint)                          
5     Each Provider  Client App      direct-channel-handshake      
6     Client App     Each Provider   direct-channel-confirm        
```

---

## E4: New Network Peer

### Trigger
Two CMS Networks establish a new peering relationship.

### Precondition
- Both networks already exist and may have providers, clients, and other peers.

### Routed Approach

```
STEP  FROM           TO              MESSAGE TYPE                  
───── ────────────── ─────────────── ──────────────────────────────
      --- Phase A: Network-A informs Network-B's ecosystem ---    
1a    Network-A      Network-B       provider-catalog-share        
2a    Network-B      Its Clients     new-providers-available       
3a    Network-B      Its Peers       new-providers-available-relay 
      (excl. Network-A; repeat until fully fanned out)             

      --- Phase B: Network-B informs Network-A's ecosystem ---    
1b    Network-B      Network-A       provider-catalog-share        
2b    Network-A      Its Clients     new-providers-available       
3b    Network-A      Its Peers       new-providers-available-relay 
      (excl. Network-B; repeat until fully fanned out)             
```

### Direct Approach

Same as Routed Phase A + B, followed by:

```
      --- Phase C: Direct channel establishment ---               
4     Each Client    Each new Provider  direct-channel-handshake   
5     Each Provider  Each new Client    direct-channel-confirm     
```

---

## E5: New Provider Registration

### Trigger
A new provider registers with a CMS Network.

### Precondition
- The provider connects to exactly one network.

### Routed Approach

```
STEP  FROM           TO              MESSAGE TYPE                  
───── ────────────── ─────────────── ──────────────────────────────
1     Provider       Home Network    provider-registration         
2     Home Network   Local Clients   new-provider-available        
3     Home Network   Peer Network(s) new-provider-relay            
4     Peer Network   Its Clients     new-provider-available        
5     Peer Network   Its Peers       new-provider-relay            
```

### Direct Approach

Same as Routed steps 1-5 (with direct endpoint info), followed by:

```
6     Each Client    Provider        direct-channel-handshake      
7     Provider       Each Client     direct-channel-confirm        
```

---

## E6: Actor Removal

### Trigger
Any actor is removed from the graph.

### Provider Removed

```
STEP  FROM           TO              MESSAGE TYPE                  
───── ────────────── ─────────────── ──────────────────────────────
1     Home Network   Local Clients   provider-removed              
2     Home Network   Peer Network(s) provider-removed-relay        
      (fan out to all reachable networks/clients)                  
      
      Direct Approach additionally:                                
3     All Clients    (internal)      close-direct-channel          
```

### Client App Removed

```
STEP  FROM           TO              MESSAGE TYPE                  
───── ────────────── ─────────────── ──────────────────────────────
1     Home Network   Local Providers client-removed                
2     Home Network   Peer Network(s) client-removed-relay          
      
      Direct Approach additionally:                                
3     All Providers  (internal)      close-direct-channel          
```

### Network Removed
All actors registered with the network must be re-assigned or removed. All peering links are severed. Teardown notifications fan out from each peer.

---

## Event Log Entry Format

Each hop in any flow generates a log entry:

```json
{
  "timestamp": "2026-03-24T12:00:00.123Z",
  "eventId": "evt-uuid",
  "eventType": "encounter-notification",
  "approach": "routed",
  "step": 2,
  "from": { "id": "network-a", "type": "network", "name": "CMS Network East" },
  "to": { "id": "client-1", "type": "client-patient", "name": "MyChart - Jane" },
  "channel": "trust",
  "payload": { ... },
  "hopCount": 2,
  "totalHops": 3
}
```

The UI event log component displays these entries in a scrollable, filterable list.
