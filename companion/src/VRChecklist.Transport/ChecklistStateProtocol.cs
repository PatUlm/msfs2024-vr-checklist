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

        if (snapshot.ProtocolVersion < 1)
        {
            throw new InvalidDataException("The EFB state snapshot is malformed.");
        }

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
            !IsValid(snapshot.Checklist) ||
            !IsValid(snapshot.ActiveGroup) ||
            !IsValid(snapshot.NextOpenItem) ||
            snapshot.CompletedRequiredItems < 0 ||
            snapshot.TotalRequiredItems < 0 ||
            snapshot.CompletedRequiredItems > snapshot.TotalRequiredItems ||
            !IsValid(snapshot.CompletedGroupIds))
        {
            throw new InvalidDataException("The EFB state snapshot is malformed.");
        }

        return snapshot;
    }

    /*
     * The list is optional so that an EFB app from before the group
     * completion feature still parses; the companion then announces nothing.
     */
    private static bool IsValid(IReadOnlyList<string>? completedGroupIds) =>
        completedGroupIds is null ||
        (completedGroupIds.All(id => !string.IsNullOrWhiteSpace(id)) &&
         completedGroupIds.Distinct(StringComparer.Ordinal).Count() == completedGroupIds.Count);

    private static bool IsValid(ChecklistIdentity? checklist) =>
        checklist is null ||
        (!string.IsNullOrWhiteSpace(checklist.Id) &&
         !string.IsNullOrWhiteSpace(checklist.Revision) &&
         !string.IsNullOrWhiteSpace(checklist.Title));

    private static bool IsValid(ChecklistGroup? group) =>
        group is null ||
        (!string.IsNullOrWhiteSpace(group.Id) &&
         !string.IsNullOrWhiteSpace(group.Title) &&
         group.Index >= 0);

    private static bool IsValid(ChecklistItemState? item) =>
        item is null ||
        (!string.IsNullOrWhiteSpace(item.Id) &&
         !string.IsNullOrWhiteSpace(item.Challenge) &&
         !string.IsNullOrWhiteSpace(item.Response));
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
    bool IsComplete,
    IReadOnlyList<string>? CompletedGroupIds = null);

public sealed record AircraftState(
    string AtcModel,
    string AtcType,
    string Title,
    string? DisplayName);

public sealed record ChecklistIdentity(
    [property: JsonRequired] string Id,
    [property: JsonRequired] string Revision,
    [property: JsonRequired] string Title);

public sealed record ChecklistGroup(
    [property: JsonRequired] string Id,
    [property: JsonRequired] string Title,
    [property: JsonRequired] int Index);

public sealed record ChecklistItemState(
    [property: JsonRequired] string Id,
    [property: JsonRequired] string Challenge,
    [property: JsonRequired] string Response);

public sealed class ChecklistProtocolException(string message) : Exception(message);
