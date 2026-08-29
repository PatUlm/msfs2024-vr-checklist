using System.Text.Json;
using System.Text.Json.Serialization;

namespace VRChecklist.Transport;

public static class ChecklistStateProtocol
{
    public const int Version = 1;
    public const string RequestEvent = "VRChecklist.State.Request.v1";
    public const string SnapshotEvent = "VRChecklist.State.Snapshot.v1";
    public const uint SnapshotEventId = 2;

    private static readonly JsonSerializerOptions JsonOptions =
        new(JsonSerializerDefaults.Web);

    public static string CreateRequest(string requestId) =>
        JsonSerializer.Serialize(
            new ChecklistStateRequest(Version, "stateRequest", requestId),
            JsonOptions);

    public static ChecklistStateSnapshot ParseSnapshot(string payload)
    {
        var snapshot = JsonSerializer.Deserialize<ChecklistStateSnapshot>(
            payload,
            JsonOptions) ?? throw new InvalidDataException("The EFB state snapshot is empty.");

        if (snapshot.ProtocolVersion != Version)
        {
            throw new ChecklistProtocolException(
                $"Unsupported EFB protocol version {snapshot.ProtocolVersion}; expected {Version}.");
        }

        if (snapshot.Type != "stateSnapshot" ||
            string.IsNullOrWhiteSpace(snapshot.SessionId) ||
            snapshot.Sequence < 1 ||
            snapshot.SentAt == default ||
            string.IsNullOrWhiteSpace(snapshot.EfbVersion) ||
            string.IsNullOrWhiteSpace(snapshot.InstanceId) ||
            snapshot.Aircraft is null ||
            snapshot.CompletedRequiredItems < 0 ||
            snapshot.TotalRequiredItems < 0 ||
            snapshot.CompletedRequiredItems > snapshot.TotalRequiredItems)
        {
            throw new InvalidDataException("The EFB state snapshot is malformed.");
        }

        return snapshot;
    }
}

public sealed record ChecklistStateRequest(
    int ProtocolVersion,
    string Type,
    string RequestId);

public sealed record ChecklistStateSnapshot(
    int ProtocolVersion,
    string Type,
    string? RequestId,
    string SessionId,
    long Sequence,
    DateTimeOffset SentAt,
    string EfbVersion,
    string InstanceId,
    AircraftState Aircraft,
    ChecklistIdentity? Checklist,
    ChecklistGroup? ActiveGroup,
    ChecklistItemState? NextOpenItem,
    int CompletedRequiredItems,
    int TotalRequiredItems,
    bool IsComplete);

public sealed record AircraftState(
    string AtcModel,
    string AtcType,
    string Title,
    string? DisplayName);

public sealed record ChecklistIdentity(string Id, string Revision, string Title);

public sealed record ChecklistGroup(string Id, string Title, int Index);

public sealed record ChecklistItemState(string Id, string Challenge, string Response);

public sealed class ChecklistProtocolException(string message) : Exception(message);
