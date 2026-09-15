# ADR-003：Character Knowledge Isolation 由代码强制执行

**状态：Accepted**

Actor Prompt 必须由过滤后的 Context Object 构造。系统不采用“先把作者秘密放进 Context，再要求模型假装不知道”的方式。
