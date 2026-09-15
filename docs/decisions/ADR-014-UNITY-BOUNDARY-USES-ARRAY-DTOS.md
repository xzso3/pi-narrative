# ADR-014 — Unity boundary uses array DTOs

## Decision

Public v0.5 engine DTOs represent keyed collections as arrays of records and use typed key/value entries for open-ended values.

## Why

This is easier to consume with Unity serializers, keeps the wire schema explicit, and avoids exposing internal JavaScript object-map shapes as a long-term game-runtime contract.
