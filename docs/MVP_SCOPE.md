# MVP v0.1 scope

## Product hypothesis

A useful AI game-writing pipeline requires hard separation between:

- author/director knowledge,
- character knowledge,
- exploratory simulation,
- editable draft,
- approved canon.

If this separation is implemented as project state and code rather than prompt convention alone, Pi can host a dependable narrative production loop.

## MVP success criteria

The MVP is successful when a user can:

1. install/load the repository as a Pi package;
2. maintain a tiny structured narrative project on disk;
3. request an Actor context for a character and verify that inaccessible/future facts are absent;
4. validate a scene before using it downstream;
5. persist a roleplay transcript without changing canon;
6. write a scene draft separately;
7. explicitly approve canonization from the Pi UI;
8. run automated tests proving the knowledge filter and no-overwrite canon rule.

## In scope

- Pi package metadata.
- One extension runtime.
- Four narrative skills: Director, Actor, Writer, Reviewer.
- Minimal domain model: Project, WorldFact, Character, Scene, Simulation, Draft, Canon.
- Knowledge-isolated Actor Context.
- Validation and status tools.
- Simulation persistence.
- Human-gated canonization.
- Demo project.
- Tests and documentation.

## Out of scope

Multi-agent orchestration is intentionally deferred. v0.1 validates the data contract that those agents would share; implementing agents before this contract stabilizes would make orchestration the source of complexity rather than the narrative problem.
