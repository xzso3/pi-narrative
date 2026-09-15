# ADR-014：Unity Boundary 使用 Array DTO

**状态：v0.5 Accepted**

公共 Engine DTO 把 Keyed Collection 表示为 Record Array，并使用 Typed Key/Value Entry。这样更适合 Unity Serializer，也避免固化 JavaScript Object Map 形状。
