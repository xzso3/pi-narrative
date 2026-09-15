using System;

namespace PiNarrative
{
    [Serializable]
    public class EngineExportDto
    {
        public string protocol;
        public int schemaVersion;
        public string projectId;
        public string consumerId;
        public string snapshotId;
        public string generatedAt;
        public string deliverySemantics;
        public EventCursorDto cursor;
        public NarrativeStateDto state;
        public GameplayConsequenceDto[] consequences;
        public LocalizationEntryDto[] localization;
    }

    [Serializable] public class EventCursorDto { public int revision; public string lastEventId; }
    [Serializable] public class NarrativeStateDto { public int revision; public CharacterStateDto[] characters; public TypedValueDto[] worldFlags; }
    [Serializable] public class CharacterStateDto { public string id; public TypedValueDto[] attributes; public ResourceDto[] resources; public RelationshipDto[] relationships; public string[] knowledgeFactIds; }
    [Serializable] public class ResourceDto { public string id; public double value; }
    [Serializable] public class RelationshipDto { public string targetId; public MetricDto[] metrics; }
    [Serializable] public class MetricDto { public string id; public double value; }

    [Serializable]
    public class TypedValueDto
    {
        public string key;
        public string type;
        public string stringValue;
        public double numberValue;
        public bool booleanValue;
        public string jsonValue;
    }

    [Serializable]
    public class GameplayConsequenceDto
    {
        public string deliveryId;
        public string eventId;
        public int eventRevision;
        public int index;
        public string type;
        public string id;
        public TypedValueDto[] payload;
    }

    [Serializable] public class LocalizationEntryDto { public string key; public string fallback; public LocalizationSourceDto source; }
    [Serializable] public class LocalizationSourceDto { public string type; public string id; public string field; }
}
