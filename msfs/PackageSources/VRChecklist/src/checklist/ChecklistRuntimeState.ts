import {
  FSComponent,
  MappedSubscribable,
  NodeReference,
  Subject,
} from "@microsoft/msfs-sdk";
import { Checklist, ChecklistItem, ChecklistSection } from "./ChecklistModel";

/*
 * The in-memory progress of one checklist: which items are ticked and which
 * section is on screen. The view renders every checklist once and switches
 * between them, so one instance exists per checklist for the life of the app.
 */
export class ChecklistRuntimeState {
  public readonly sectionItemsRefs: NodeReference<HTMLDivElement>[];
  public readonly itemStates = new Map<string, Subject<boolean>>();

  /*
   * Only these items drive the progress count. An `optional` item may be
   * ticked and is stored like any other; it stays out of the count but still
   * holds back automatic section advance until the pilot handles it.
   */
  public readonly requiredItemKeys = new Set<string>();
  public readonly activeSectionIndex = Subject.create(0);
  public readonly completedCount = Subject.create(0);
  /* One flag per section, true while every item of it is ticked. */
  public readonly sectionCompletion: Subject<boolean>[];
  public readonly finalPhaseStartIndex: number;
  public readonly finalPhaseComplete = Subject.create(false);
  public readonly totalItemCount: number;
  public readonly progressText: MappedSubscribable<string>;
  public readonly progressWidth: MappedSubscribable<string>;

  public constructor(public readonly checklist: Checklist) {
    this.sectionItemsRefs = checklist.sections.map(() =>
      FSComponent.createRef<HTMLDivElement>()
    );
    this.sectionCompletion = checklist.sections.map(() =>
      Subject.create<boolean>(false)
    );
    let finalPhaseStartIndex = checklist.sections.length - 1;
    while (
      finalPhaseStartIndex > 0 &&
      checklist.sections[finalPhaseStartIndex - 1].phase ===
        checklist.sections[finalPhaseStartIndex].phase
    ) {
      finalPhaseStartIndex -= 1;
    }
    this.finalPhaseStartIndex = finalPhaseStartIndex;

    for (const section of checklist.sections) {
      for (const item of section.items) {
        const itemKey = this.getItemKey(section.id, item.id);
        this.itemStates.set(itemKey, Subject.create(false));

        if (item.kind !== "optional") {
          this.requiredItemKeys.add(itemKey);
        }
      }
    }

    this.totalItemCount = this.requiredItemKeys.size;
    this.progressText = this.completedCount.map(
      (completed) => `${completed} / ${this.totalItemCount}`
    );
    this.progressWidth = this.completedCount.map(
      (completed) =>
        `${Math.round((completed / Math.max(1, this.totalItemCount)) * 100)}%`
    );
  }

  public getItemKey(sectionId: string, itemId: string): string {
    return `${this.checklist.id}/${sectionId}/${itemId}`;
  }

  public getItemState(sectionId: string, itemId: string): Subject<boolean> {
    const itemKey = this.getItemKey(sectionId, itemId);
    const itemState = this.itemStates.get(itemKey);

    if (!itemState) {
      throw new Error(`Missing state for checklist item ${itemKey}`);
    }

    return itemState;
  }

  public getActiveSection(): ChecklistSection | undefined {
    return this.checklist.sections[this.activeSectionIndex.get()];
  }

  public findNextOpenItem(section: ChecklistSection): ChecklistItem | undefined {
    return section.items.find(
      (item) => !this.getItemState(section.id, item.id).get()
    );
  }

  /* Completes the whole phase block, including earlier groups and optional
   * items. The caller publishes only the final state, after navigation. */
  public skipPhase(sectionIndex: number): boolean {
    const sections = this.checklist.sections;
    const section = sections[sectionIndex];
    if (
      !section ||
      this.activeSectionIndex.get() !== sectionIndex ||
      (sectionIndex >= this.finalPhaseStartIndex && this.finalPhaseComplete.get())
    ) {
      return false;
    }

    let first = sectionIndex;
    let last = sectionIndex;
    while (first > 0 && sections[first - 1].phase === section.phase) {
      first -= 1;
    }
    while (last + 1 < sections.length && sections[last + 1].phase === section.phase) {
      last += 1;
    }

    for (let index = first; index <= last; index += 1) {
      for (const item of sections[index].items) {
        this.getItemState(sections[index].id, item.id).set(true);
      }
    }
    this.updateCompletedCount();
    const targetIndex = Math.min(last + 1, sections.length - 1);
    this.activeSectionIndex.set(targetIndex);
    this.scrollSectionItemsToTop(targetIndex);
    return true;
  }

  /*
   * The automatic advance waits for every item of the section, `optional` ones
   * included. Skipping an optional item is a deliberate call, and the app must
   * not take the section off screen before the pilot has made it. Only the
   * progress count ignores optional items; this handover does not.
   */
  public isSectionComplete(section: ChecklistSection): boolean {
    return section.items.every((item) =>
      this.getItemState(section.id, item.id).get()
    );
  }

  public getCompletedItemKeys(): string[] {
    return Array.from(this.itemStates.entries())
      .filter(([, state]) => state.get())
      .map(([itemKey]) => itemKey);
  }

  /* Recomputes the progress count and the per-section completion flags. */
  public updateCompletedCount(): void {
    let completed = 0;

    for (const itemKey of this.requiredItemKeys) {
      if (this.itemStates.get(itemKey)?.get() === true) {
        completed += 1;
      }
    }

    this.completedCount.set(completed);
    this.checklist.sections.forEach((section, index) => {
      this.sectionCompletion[index].set(this.isSectionComplete(section));
    });
    this.finalPhaseComplete.set(
      this.sectionCompletion
        .slice(this.finalPhaseStartIndex)
        .every((state) => state.get())
    );
  }

  public getCompletedSectionIds(): string[] {
    return this.checklist.sections
      .filter((_, index) => this.sectionCompletion[index].get())
      .map((section) => section.id);
  }

  public scrollSectionItemsToTop(sectionIndex: number): void {
    const sectionItems = this.sectionItemsRefs[sectionIndex]?.getOrDefault();

    if (sectionItems) {
      sectionItems.scrollTop = 0;
    }
  }

  public reset(): void {
    for (const itemState of this.itemStates.values()) {
      itemState.set(false);
    }

    this.completedCount.set(0);
    this.activeSectionIndex.set(0);
    this.finalPhaseComplete.set(false);

    for (const completion of this.sectionCompletion) {
      completion.set(false);
    }

    for (let index = 0; index < this.sectionItemsRefs.length; index += 1) {
      this.scrollSectionItemsToTop(index);
    }
  }
}
