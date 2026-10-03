import {
  FSComponent,
  MappedSubscribable,
  NodeReference,
  Subject,
} from "@microsoft/msfs-sdk";
import { Checklist, ChecklistItem, ChecklistSection } from "./ChecklistModel";

/*
 * A run of consecutive sections with the same phase whose last section is
 * complete: the app stops there, even while an earlier section is still open.
 */
export interface CompletedPhase {
  firstGroupId: string;
  phase: string;
  /*
   * True while the whole block is complete because of `Skip phase` in this
   * app context. It only selects the announcement of the snapshot that the
   * skipping context sends, so it stays out of the shared progress record
   * (ADR 0009).
   */
  skipped: boolean;
}

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
  /*
   * One flag per section, true while the last section of its phase block is
   * complete. The phase then counts as complete, even with an earlier section
   * still open, and `Skip phase` is disabled.
   */
  public readonly phaseCompletion: Subject<boolean>[];
  public readonly totalItemCount: number;
  public readonly progressText: MappedSubscribable<string>;
  public readonly progressWidth: MappedSubscribable<string>;

  /* Index of the first section of each section's phase block. */
  private readonly phaseStartIndices: number[];
  /* First section indices of the blocks that `Skip phase` completed. */
  private readonly skippedPhaseStarts = new Set<number>();

  public constructor(public readonly checklist: Checklist) {
    this.sectionItemsRefs = checklist.sections.map(() =>
      FSComponent.createRef<HTMLDivElement>()
    );
    this.sectionCompletion = checklist.sections.map(() =>
      Subject.create<boolean>(false)
    );
    this.phaseCompletion = checklist.sections.map(() =>
      Subject.create<boolean>(false)
    );
    this.phaseStartIndices = checklist.sections.map((_, index) =>
      this.findPhaseStart(index)
    );

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

  /*
   * The item the pilot is at: the one after the last ticked item, or the
   * earliest open item once nothing behind that is left. A skipped item thus
   * comes back at the end of the section. It follows from the ticks alone, so
   * every app context derives the same item from the shared progress.
   */
  public findNextOpenItem(section: ChecklistSection): ChecklistItem | undefined {
    const isOpen = (item: ChecklistItem): boolean =>
      !this.getItemState(section.id, item.id).get();
    let lastTicked = -1;
    section.items.forEach((item, index) => {
      if (!isOpen(item)) {
        lastTicked = index;
      }
    });

    return section.items[lastTicked + 1] ?? section.items.find(isOpen);
  }

  /*
   * True for the last section of a phase block. The automatic advance stops
   * here: the pilot starts the next phase when the flight is ready for it.
   */
  public isPhaseEnd(sectionIndex: number): boolean {
    const sections = this.checklist.sections;
    return sections[sectionIndex + 1]?.phase !== sections[sectionIndex]?.phase;
  }

  /* Completes the whole phase block, including earlier groups and optional
   * items, and stays on its last group like a completed phase does. The
   * caller publishes only the final state, after navigation. */
  public skipPhase(sectionIndex: number): boolean {
    const sections = this.checklist.sections;
    if (
      !sections[sectionIndex] ||
      this.activeSectionIndex.get() !== sectionIndex ||
      this.phaseCompletion[sectionIndex].get()
    ) {
      return false;
    }

    const first = this.phaseStartIndices[sectionIndex];
    let last = sectionIndex;
    while (!this.isPhaseEnd(last)) {
      last += 1;
    }

    for (let index = first; index <= last; index += 1) {
      for (const item of sections[index].items) {
        this.getItemState(sections[index].id, item.id).set(true);
      }
    }
    this.skippedPhaseStarts.add(first);
    this.updateCompletedCount();
    this.activeSectionIndex.set(last);
    this.scrollSectionItemsToTop(last);
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

  /*
   * Recomputes the progress count and the per-section and per-phase
   * completion flags. A reopened phase ends its skipped state.
   */
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
    this.checklist.sections.forEach((_, index) => {
      let last = index;
      while (!this.isPhaseEnd(last)) {
        last += 1;
      }
      this.phaseCompletion[index].set(this.sectionCompletion[last].get());
    });

    for (const first of this.skippedPhaseStarts) {
      if (!this.phaseCompletion[first].get()) {
        this.skippedPhaseStarts.delete(first);
      }
    }
  }

  public getCompletedSectionIds(): string[] {
    return this.checklist.sections
      .filter((_, index) => this.sectionCompletion[index].get())
      .map((section) => section.id);
  }

  public getCompletedPhases(): CompletedPhase[] {
    const phases: CompletedPhase[] = [];
    this.checklist.sections.forEach((section, index) => {
      if (
        this.phaseStartIndices[index] === index &&
        this.phaseCompletion[index].get()
      ) {
        phases.push({
          firstGroupId: section.id,
          phase: section.phase,
          skipped: this.skippedPhaseStarts.has(index),
        });
      }
    });
    return phases;
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
    this.skippedPhaseStarts.clear();

    for (const completion of [
      ...this.sectionCompletion,
      ...this.phaseCompletion,
    ]) {
      completion.set(false);
    }

    for (let index = 0; index < this.sectionItemsRefs.length; index += 1) {
      this.scrollSectionItemsToTop(index);
    }
  }

  private findPhaseStart(sectionIndex: number): number {
    const sections = this.checklist.sections;
    let first = sectionIndex;
    while (first > 0 && sections[first - 1].phase === sections[sectionIndex].phase) {
      first -= 1;
    }
    return first;
  }
}
