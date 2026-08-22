import {
  App,
  AppBootMode,
  AppInstallProps,
  AppSuspendMode,
  AppView,
  AppViewProps,
  Button,
  Efb,
  RequiredProps,
  TVNode,
} from "@efb/efb-api";
import { FSComponent, Subject, VNode } from "@microsoft/msfs-sdk";
import diamondDa42Data from "../../../../checklists/data/diamond-da42.json";

import "./VRChecklist.scss";

declare const BASE_URL: string;

interface ChecklistAlternative {
  when: string;
  response: string;
}

interface ChecklistItem {
  id: string;
  challenge: string;
  response: string;
  kind: "action" | "verify" | "communication";
  condition?: string;
  alternatives?: ChecklistAlternative[];
  notes?: string[];
  needsReview?: boolean;
  reviewNote?: string;
}

interface ChecklistSection {
  id: string;
  title: string;
  items: ChecklistItem[];
}

interface Checklist {
  id: string;
  title: string;
  aircraft: {
    manufacturer: string;
    model: string;
  };
  revision: string;
  sections: ChecklistSection[];
}

const checklist = diamondDa42Data as Checklist;

class VRChecklistView extends AppView<RequiredProps<AppViewProps, "bus">> {
  private readonly itemStates = new Map<string, Subject<boolean>>();
  private readonly completedCount = Subject.create(0);
  private readonly totalItemCount = checklist.sections.reduce(
    (total, section) => total + section.items.length,
    0
  );
  private readonly progressText = this.completedCount.map(
    (completed) => `${completed} / ${this.totalItemCount} complete`
  );
  private readonly progressWidth = this.completedCount.map(
    (completed) => `${Math.round((completed / this.totalItemCount) * 100)}%`
  );

  public constructor(props: RequiredProps<AppViewProps, "bus">) {
    super(props);

    for (const section of checklist.sections) {
      for (const item of section.items) {
        this.itemStates.set(
          this.getItemKey(section.id, item.id),
          Subject.create(false)
        );
      }
    }
  }

  private getItemKey(sectionId: string, itemId: string): string {
    return `${checklist.id}/${sectionId}/${itemId}`;
  }

  private toggleItem(itemState: Subject<boolean>): void {
    itemState.set(!itemState.get());
    this.completedCount.set(
      Array.from(this.itemStates.values()).filter((state) => state.get()).length
    );
  }

  private renderItem(
    section: ChecklistSection,
    item: ChecklistItem
  ): TVNode<HTMLButtonElement> {
    const itemKey = this.getItemKey(section.id, item.id);
    const itemState = this.itemStates.get(itemKey);

    if (!itemState) {
      throw new Error(`Missing state for checklist item ${itemKey}`);
    }

    return (
      <Button
        class={{
          "checklist-item": true,
          "checklist-item--complete": itemState,
          "checklist-item--review": item.needsReview === true,
        }}
        selected={itemState}
        callback={(): void => this.toggleItem(itemState)}
        aria-label={`${item.challenge}: ${item.response}`}
        aria-pressed={itemState}
      >
        <span class="checklist-item__checkbox" aria-hidden="true">
          <span class="checklist-item__checkmark">✓</span>
        </span>

        <span class="checklist-item__body">
          <span class="checklist-item__main">
            <span class="checklist-item__challenge">{item.challenge}</span>
            <span class="checklist-item__leader" aria-hidden="true" />
            <span class="checklist-item__response">{item.response}</span>
          </span>

          {item.condition && (
            <span class="checklist-item__detail">
              <span class="checklist-item__detail-label">Condition</span>
              {item.condition}
            </span>
          )}

          {item.alternatives?.map((alternative) => (
            <span class="checklist-item__detail checklist-item__detail--alternative">
              <span class="checklist-item__detail-label">
                Alternative · {alternative.when}
              </span>
              {alternative.response}
            </span>
          ))}

          {item.notes?.map((note) => (
            <span class="checklist-item__detail">
              <span class="checklist-item__detail-label">Note</span>
              {note}
            </span>
          ))}

          {item.needsReview && item.reviewNote && (
            <span class="checklist-item__review-note">
              <span class="checklist-item__review-label">Review required</span>
              {item.reviewNote}
            </span>
          )}
        </span>

        <span class={`checklist-item__kind checklist-item__kind--${item.kind}`}>
          {item.kind}
        </span>
      </Button>
    );
  }

  public render(): VNode {
    return (
      <div class="vr-checklist-app">
        <header class="checklist-header">
          <div class="checklist-header__identity">
            <span class="checklist-header__eyebrow">VR Checklist</span>
            <h1>{checklist.aircraft.model}</h1>
            <span class="checklist-header__manufacturer">
              {checklist.aircraft.manufacturer}
            </span>
          </div>

          <div
            class="checklist-header__progress"
            aria-label="Checklist progress"
          >
            <span class="checklist-header__progress-label">
              {this.progressText}
            </span>
            <span class="checklist-header__progress-track">
              <span
                class="checklist-header__progress-value"
                style={{ width: this.progressWidth }}
              />
            </span>
          </div>
        </header>

        <main class="checklist-content">
          {checklist.sections.map((section, sectionIndex) => (
            <section class="checklist-section" id={section.id}>
              <header class="checklist-section__header">
                <span class="checklist-section__number">
                  {String(sectionIndex + 1).padStart(2, "0")}
                </span>
                <h2>{section.title}</h2>
                <span class="checklist-section__count">
                  {section.items.length} items
                </span>
              </header>

              <div class="checklist-section__items">
                {section.items.map((item) => this.renderItem(section, item))}
              </div>
            </section>
          ))}

          <footer class="checklist-footer">
            Revision {checklist.revision} · Checklist data: {checklist.id}
          </footer>
        </main>
      </div>
    );
  }
}

class VRChecklist extends App {
  public get name(): string {
    return "VR Checklist";
  }

  public get icon(): string {
    return `${BASE_URL}/Assets/app-icon.svg`;
  }

  public BootMode = AppBootMode.COLD;
  public SuspendMode = AppSuspendMode.SLEEP;

  public async install(_props: AppInstallProps): Promise<void> {
    Efb.loadCss(`${BASE_URL}/VRChecklist.css`);
    return Promise.resolve();
  }

  public get compatibleAircraftModels(): string[] | undefined {
    return undefined;
  }

  public render(): TVNode<VRChecklistView> {
    return <VRChecklistView bus={this.bus} />;
  }
}

Efb.use(VRChecklist);
