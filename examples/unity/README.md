# Unity integration sketch

`PiNarrativeDtos.cs` mirrors the public v0.5 engine export DTO and intentionally uses arrays instead of runtime dictionaries so the payload is friendly to Unity `JsonUtility` and other conservative serializers.

Recommended consumer flow:

1. Deserialize the export.
2. Load a durable local set of applied `deliveryId` values.
3. For each consequence, skip it if already applied.
4. Apply the side effect and persist the `deliveryId` atomically with the game save/state when possible.
5. ACK successfully handled IDs back to the Pi Narrative bridge.

ACK is not an exactly-once transaction. The local `deliveryId` ledger is what makes redelivery safe.
