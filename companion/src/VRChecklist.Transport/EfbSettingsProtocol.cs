using System.Text.Json;
using System.Text.Json.Serialization;

namespace VRChecklist.Transport;

public static class EfbSettingsProtocol
{
    public const string RequestEvent = "VRChecklist.Settings.Request.v1";
    public const string ResponseEvent = "VRChecklist.Settings.Response.v1";
    public const uint ResponseEventId = 3;
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);

    public static string CreateRequest(string requestId, string instanceId, IReadOnlyDictionary<string, bool> actions) =>
        JsonSerializer.Serialize(new
        {
            protocolVersion = 1, type = "setConfirmationActions", requestId, instanceId, actions,
        }, JsonOptions);

    public static EfbSettingsResponse ParseResponse(string payload)
    {
        var response = JsonSerializer.Deserialize<EfbSettingsResponse>(payload, JsonOptions);
        if (response is null || response.ProtocolVersion != 1 || response.Type != "settingsResponse" ||
            string.IsNullOrWhiteSpace(response.RequestId) || string.IsNullOrWhiteSpace(response.InstanceId) ||
            (response.Error is null && (response.Actions is null || response.Actions.Count == 0)) ||
            (response.Error is not null && string.IsNullOrWhiteSpace(response.Error)) ||
            (response.Actions is { } actions &&
             (actions.Any(action => action is null || string.IsNullOrWhiteSpace(action.Event) || string.IsNullOrWhiteSpace(action.Label)) ||
              actions.Select(action => action.Event).Distinct(StringComparer.Ordinal).Count() != actions.Count)))
        {
            throw new InvalidDataException("Invalid EFB settings response.");
        }
        return response;
    }
}

public sealed record ConfirmationActionSetting(
    [property: JsonRequired] string Event,
    [property: JsonRequired] string Label,
    [property: JsonRequired] bool Enabled);

public sealed record EfbSettingsResponse(
    int ProtocolVersion, string Type, string RequestId, string InstanceId,
    IReadOnlyList<ConfirmationActionSetting>? Actions, string? Error);
