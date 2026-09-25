import { EfbSettings } from "../settings/EfbSettings";

export const EFB_SETTINGS_REQUEST_EVENT = "VRChecklist.Settings.Request.v1";
export const EFB_SETTINGS_RESPONSE_EVENT = "VRChecklist.Settings.Response.v1";

interface EfbSettingsRequest {
  protocolVersion: 1;
  type: "getSettings" | "setConfirmationActions";
  requestId: string;
  instanceId: string;
  actions?: Record<string, boolean>;
}

/** Only the addressed context writes and acknowledges; all contexts share storage. */
export function processEfbSettingsRequest(
  data: string, instanceId: string, settings: EfbSettings
): string | undefined {
  const request = JSON.parse(data) as EfbSettingsRequest | null;
  if (!request || request.protocolVersion !== 1 ||
      typeof request.requestId !== "string" || !request.requestId.trim() ||
      typeof request.instanceId !== "string" || !request.instanceId.trim()) {
    throw new Error("Invalid EFB settings request.");
  }
  if (request.instanceId !== instanceId) return undefined;

  const response = {
    protocolVersion: 1, type: "settingsResponse", requestId: request.requestId, instanceId,
  };
  try {
    if (request.type === "setConfirmationActions") {
      if (!request.actions || typeof request.actions !== "object" || Array.isArray(request.actions)) {
        throw new Error("Invalid confirmation actions.");
      }
      settings.set(request.actions);
    } else if (request.type !== "getSettings") {
      throw new Error("Unknown settings request.");
    }
    return JSON.stringify({ ...response, actions: settings.list(), error: null });
  } catch (error) {
    console.error("[VR Checklist] EFB settings request failed", error);
    return JSON.stringify({
      ...response, actions: null,
      error: "Could not read or save EFB settings. Check that both apps use the same version and reopen Settings to retry.",
    });
  }
}
