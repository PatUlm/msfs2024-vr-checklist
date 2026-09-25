import actions from "../../../../../config/confirmation-actions.json";

/** Shared with the companion so its settings remain editable offline. */
export const CONFIRMATION_ACTIONS = actions;

export interface ConfirmationActionSetting {
  event: string;
  label: string;
  enabled: boolean;
}

export interface SettingsStorage {
  get(key: string): unknown;
  set(key: string, value: string): void;
}

const STORAGE_KEY = "vr-checklist.settings.v1";

/** Settings outlive flights and contexts; read on demand so resident views agree. */
export class EfbSettings {
  public constructor(private readonly storage: SettingsStorage) {}

  private read(): Record<string, boolean> {
    const raw = this.storage.get(STORAGE_KEY);
    if (raw === undefined || raw === null || raw === "") return {};
    if (typeof raw !== "string") throw new Error("Invalid EFB settings.");
    const saved = JSON.parse(raw)?.confirmationActions;
    if (!saved || typeof saved !== "object" || Array.isArray(saved) ||
        Object.values(saved).some((value) => typeof value !== "boolean")) {
      throw new Error("Invalid EFB confirmation settings.");
    }
    return saved;
  }

  public list(): ConfirmationActionSetting[] {
    const saved = this.read();
    return CONFIRMATION_ACTIONS.map((action) => ({
      ...action,
      enabled: saved[action.event] ?? action.enabled,
    }));
  }

  public set(actions: Record<string, boolean>): void {
    if (Object.keys(actions).length !== CONFIRMATION_ACTIONS.length ||
        !CONFIRMATION_ACTIONS.every((action) => typeof actions[action.event] === "boolean")) {
      throw new Error("Unknown or incomplete confirmation actions.");
    }
    const saved = this.read();
    if (Object.entries(actions).every(([event, enabled]) => saved[event] === enabled)) return;
    this.storage.set(STORAGE_KEY, JSON.stringify({
      confirmationActions: { ...saved, ...actions },
    }));
    const stored = this.read();
    if (!Object.entries(actions).every(([event, enabled]) => stored[event] === enabled)) {
      throw new Error("The EFB setting was not saved.");
    }
  }

  public isEnabled(event: string): boolean {
    try {
      return this.list().some((action) => action.event === event && action.enabled);
    } catch (error) {
      // Do not turn a previously disabled action back on after a storage failure.
      console.error("[VR Checklist] Unable to read confirmation settings", error);
      return false;
    }
  }
}
