# ADR-012 — Gameplay consequences use at-least-once delivery

## Decision

Every engine-facing consequence receives a deterministic `deliveryId`. Consumers persist applied IDs and ACK handled IDs back to Pi Narrative.

## Why

An ACK cannot atomically cover an arbitrary Unity side effect across process boundaries. Claiming exactly-once semantics would be incorrect. Stable IDs + consumer deduplication make redelivery safe and achieve effectively-once behavior when the consumer persists its applied-ID ledger correctly.
