import { DataStore } from "@microsoft/msfs-sdk";
import { StoredChecklistProgress } from "./ProgressRecord";

const CHECKLIST_PROGRESS_DATASTORE_KEY = "vr-checklist.progress.v5";
const OBSOLETE_DATASTORE_KEYS = [
  "vr-checklist.progress.v1",
  "vr-checklist.progress.v2",
  "vr-checklist.progress.v3",
  "vr-checklist.progress.v4",
  "vr-checklist.lifecycle-diagnostics.v1",
];

/*
 * The DataStore access for the shared progress record. Every method swallows
 * DataStore failures with a log line: progress persistence is never allowed
 * to take the checklist itself down.
 */
export class ChecklistProgressStore {
  public clearObsolete(): void {
    try {
      for (const key of OBSOLETE_DATASTORE_KEYS) {
        DataStore.remove(key);
      }
    } catch (error) {
      console.error("[VR Checklist] Unable to clear obsolete stored data", error);
    }
  }

  public clear(): void {
    try {
      DataStore.remove(CHECKLIST_PROGRESS_DATASTORE_KEY);
    } catch (error) {
      console.error("[VR Checklist] Unable to clear stored progress", error);
    }
  }

  /** Returns true when the record reached the DataStore. */
  public write(progress: StoredChecklistProgress): boolean {
    try {
      DataStore.set(CHECKLIST_PROGRESS_DATASTORE_KEY, JSON.stringify(progress));
      return true;
    } catch (error) {
      console.error("[VR Checklist] Unable to store progress", error);
      return false;
    }
  }

  /**
   * Returns the parsed candidate without any compatibility check, or
   * undefined when nothing readable is stored.
   */
  public read(): Partial<StoredChecklistProgress> | undefined {
    try {
      const storedProgress = DataStore.get<string>(
        CHECKLIST_PROGRESS_DATASTORE_KEY
      );

      if (typeof storedProgress !== "string") {
        return undefined;
      }

      return JSON.parse(storedProgress) as Partial<StoredChecklistProgress>;
    } catch (error) {
      console.error("[VR Checklist] Unable to read stored progress", error);
      return undefined;
    }
  }
}
