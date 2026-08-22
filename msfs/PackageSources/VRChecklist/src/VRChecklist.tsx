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
import {
  FSComponent,
  GameStateProvider,
  Subject,
  Subscription,
  VNode,
} from "@microsoft/msfs-sdk";
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
  private readonly sectionItemsRefs = checklist.sections.map(() =>
    FSComponent.createRef<HTMLDivElement>()
  );
  private readonly itemStates = new Map<string, Subject<boolean>>();
  private readonly activeSectionIndex = Subject.create(0);
  private readonly completedCount = Subject.create(0);
  private readonly totalItemCount = checklist.sections.reduce(
    (total, section) => total + section.items.length,
    0
  );
  private readonly progressText = this.completedCount.map(
    (completed) => `${completed} / ${this.totalItemCount}`
  );
  private readonly progressWidth = this.completedCount.map(
    (completed) => `${Math.round((completed / this.totalItemCount) * 100)}%`
  );
  private readonly gameStateSubscription: Subscription;
  private previousGameState: GameState | undefined;

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

    this.gameStateSubscription = GameStateProvider.get().sub(
      (gameState) => this.handleGameStateChanged(gameState),
      true
    );
  }

  private getItemKey(sectionId: string, itemId: string): string {
    return `${checklist.id}/${sectionId}/${itemId}`;
  }

  private handleGameStateChanged(gameState: GameState | undefined): void {
    const previousGameState = this.previousGameState;
    this.previousGameState = gameState;

    if (
      gameState === GameState.loading &&
      previousGameState !== undefined &&
      previousGameState !== GameState.loading
    ) {
      this.resetChecklist();
    }
  }

  private resetChecklist(): void {
    for (const itemState of this.itemStates.values()) {
      itemState.set(false);
    }

    this.completedCount.set(0);
    this.activeSectionIndex.set(0);
    this.sectionItemsRefs[0].instance.scrollTop = 0;
  }

  private isSectionComplete(section: ChecklistSection): boolean {
    return section.items.every((item) =>
      this.itemStates.get(this.getItemKey(section.id, item.id))?.get()
    );
  }

  private showSection(sectionIndex: number): void {
    if (sectionIndex < 0 || sectionIndex >= checklist.sections.length) {
      return;
    }

    this.activeSectionIndex.set(sectionIndex);
    this.sectionItemsRefs[sectionIndex].instance.scrollTop = 0;
  }

  private toggleItem(
    section: ChecklistSection,
    sectionIndex: number,
    itemState: Subject<boolean>
  ): void {
    const checked = !itemState.get();
    itemState.set(checked);
    this.completedCount.set(
      Array.from(this.itemStates.values()).filter((state) => state.get()).length
    );

    if (
      checked &&
      sectionIndex < checklist.sections.length - 1 &&
      this.isSectionComplete(section)
    ) {
      window.setTimeout(() => {
        if (
          this.activeSectionIndex.get() === sectionIndex &&
          this.isSectionComplete(section)
        ) {
          this.showSection(sectionIndex + 1);
        }
      }, 350);
    }
  }

  private renderNavigation(sectionIndex: number): VNode {
    const previousSection = checklist.sections[sectionIndex - 1];
    const nextSection = checklist.sections[sectionIndex + 1];

    return (
      <nav class="section-navigation" aria-label="Checklist sections">
        <Button
          class={{
            "section-navigation__button": true,
            "section-navigation__button--previous": true,
            "section-navigation__button--disabled":
              previousSection === undefined,
          }}
          disabled={previousSection === undefined}
          callback={(): void => this.showSection(sectionIndex - 1)}
          aria-label={
            previousSection
              ? `Previous: ${previousSection.title}`
              : "No previous section"
          }
        >
          <span class="section-navigation__arrow" aria-hidden="true">
            ←
          </span>
          <span class="section-navigation__text">
            <span class="section-navigation__direction">Previous</span>
            <span class="section-navigation__name">
              {previousSection?.title ?? "Start"}
            </span>
          </span>
        </Button>

        <Button
          class={{
            "section-navigation__button": true,
            "section-navigation__button--next": true,
            "section-navigation__button--disabled": nextSection === undefined,
          }}
          disabled={nextSection === undefined}
          callback={(): void => this.showSection(sectionIndex + 1)}
          aria-label={
            nextSection ? `Next: ${nextSection.title}` : "No next section"
          }
        >
          <span class="section-navigation__text">
            <span class="section-navigation__direction">Next</span>
            <span class="section-navigation__name">
              {nextSection?.title ?? "Complete"}
            </span>
          </span>
          <span class="section-navigation__arrow" aria-hidden="true">
            →
          </span>
        </Button>
      </nav>
    );
  }

  private renderItem(
    section: ChecklistSection,
    sectionIndex: number,
    item: ChecklistItem
  ): TVNode<HTMLButtonElement> {
    const itemKey = this.getItemKey(section.id, item.id);
    const itemState = this.itemStates.get(itemKey);
    const hasDetails =
      item.kind !== "action" ||
      item.condition !== undefined ||
      item.alternatives !== undefined ||
      item.notes !== undefined;

    if (!itemState) {
      throw new Error(`Missing state for checklist item ${itemKey}`);
    }

    return (
      <Button
        class={{
          "checklist-item": true,
          [`checklist-item--${item.kind}`]: true,
          "checklist-item--complete": itemState,
          "checklist-item--review": item.needsReview === true,
        }}
        selected={itemState}
        callback={(): void => this.toggleItem(section, sectionIndex, itemState)}
        aria-label={`${item.challenge}: ${item.response}`}
        aria-pressed={itemState}
      >
        <span class="checklist-item__body">
          <span class="checklist-item__main">
            <span class="checklist-item__challenge">{item.challenge}</span>
            <span class="checklist-item__leader" aria-hidden="true" />
            <span class="checklist-item__response">{item.response}</span>
          </span>

          {hasDetails && (
            <span class="checklist-item__details">
              {item.kind !== "action" && (
                <span
                  class={`checklist-item__kind checklist-item__kind--${item.kind}`}
                >
                  {item.kind}
                </span>
              )}

              {item.condition && (
                <span class="checklist-item__detail">
                  <span class="checklist-item__detail-label">Condition:</span>
                  {item.condition}
                </span>
              )}

              {item.alternatives?.map((alternative) => (
                <span class="checklist-item__detail checklist-item__detail--alternative">
                  <span class="checklist-item__detail-label">
                    Alternative · {alternative.when}:
                  </span>
                  {alternative.response}
                </span>
              ))}

              {item.notes?.map((note) => (
                <span class="checklist-item__detail">
                  <span class="checklist-item__detail-label">Note:</span>
                  {note}
                </span>
              ))}
            </span>
          )}

          {item.needsReview && item.reviewNote && (
            <span class="checklist-item__review-note">
              <span class="checklist-item__review-label">Review required</span>
              {item.reviewNote}
            </span>
          )}
        </span>

        <span class="checklist-item__checkbox" aria-hidden="true">
          <span class="checklist-item__checkmark" />
        </span>
      </Button>
    );
  }

  public render(): VNode {
    return (
      <div class="vr-checklist-app">
        <header class="checklist-header">
          <div class="checklist-header__identity">
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
            <section
              class={{
                "checklist-section": true,
                "checklist-section--active": this.activeSectionIndex.map(
                  (activeIndex) => activeIndex === sectionIndex
                ),
              }}
              id={section.id}
            >
              <div class="checklist-section__sticky">
                <header class="checklist-section__header">
                  <h2>
                    <span class="checklist-section__number">
                      {String(sectionIndex + 1).padStart(2, "0")}
                    </span>
                    <span>{section.title}</span>
                  </h2>
                </header>

                {this.renderNavigation(sectionIndex)}
              </div>

              <div
                ref={this.sectionItemsRefs[sectionIndex]}
                class="checklist-section__items"
              >
                {section.items.map((item) =>
                  this.renderItem(section, sectionIndex, item)
                )}
              </div>
            </section>
          ))}
        </main>
      </div>
    );
  }

  public onClose(): void {
    this.gameStateSubscription.destroy();
    super.onClose();
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
