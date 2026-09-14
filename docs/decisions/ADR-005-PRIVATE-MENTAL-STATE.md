# ADR-005: Actor mental state is not public transcript

Status: Accepted

An ActorResponse may contain private `intent`, `rationale`, and `emotionalShift`, but later Actors receive only externally observable `action` and spoken `dialogue`.

Reason: exposing internal reasoning through simulation history would bypass the v0.1 knowledge boundary even if world facts were filtered correctly.
