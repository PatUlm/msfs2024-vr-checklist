import { Button, TVNode } from "@efb/efb-api";
import { FSComponent, Subject, Subscribable, VNode } from "@microsoft/msfs-sdk";
import {
  ChecklistItem,
  ChecklistSection,
  ITEM_KIND_LABELS,
} from "../checklist/ChecklistModel";
import { ChecklistRuntimeState } from "../checklist/ChecklistRuntimeState";

/*
 * The markup of one checklist. Rendering is stateless here: every interaction
 * goes back to the view through these actions, which own persistence and the
 * automatic section advance. Styling lives in VRChecklist.scss; the accepted
 * design is documented in docs/design-decisions.md.
 */
export interface ChecklistPanelActions {
  toggleItem(
    runtime: ChecklistRuntimeState,
    section: ChecklistSection,
    sectionIndex: number,
    itemState: Subject<boolean>
  ): void;
  changeSection(runtime: ChecklistRuntimeState, sectionIndex: number): void;
}

/*
 * The green mark in front of a group name, in the header as well as in the
 * navigation targets. It follows the same rule as the automatic advance: every
 * item of the group, optional ones included, is ticked. Drawn with CSS
 * borders, not a font glyph (see msfs-sdk-reference.md).
 */
function renderCompletionMark(
  runtime: ChecklistRuntimeState,
  sectionIndex: number
): VNode | null {
  const completion = runtime.sectionCompletion[sectionIndex];

  if (!completion) {
    return null;
  }

  return (
    <span
      class={{
        "completion-check": true,
        "completion-check--visible": completion,
      }}
      aria-hidden="true"
    />
  );
}

function renderNavigation(
  runtime: ChecklistRuntimeState,
  sectionIndex: number,
  actions: ChecklistPanelActions
): VNode {
  const previousSection = runtime.checklist.sections[sectionIndex - 1];
  const nextSection = runtime.checklist.sections[sectionIndex + 1];

  return (
    <nav class="section-navigation" aria-label="Checklist sections">
      <Button
        class={{
          "section-navigation__button": true,
          "section-navigation__button--previous": true,
          "section-navigation__button--disabled": previousSection === undefined,
        }}
        disabled={previousSection === undefined}
        callback={(): void => actions.changeSection(runtime, sectionIndex - 1)}
        aria-label={
          previousSection
            ? `Previous: ${previousSection.title}`
            : "No previous section"
        }
      >
        <span class="section-navigation__text">
          {renderCompletionMark(runtime, sectionIndex - 1)}
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
        callback={(): void => actions.changeSection(runtime, sectionIndex + 1)}
        aria-label={
          nextSection ? `Next: ${nextSection.title}` : "No next section"
        }
      >
        <span class="section-navigation__text">
          {renderCompletionMark(runtime, sectionIndex + 1)}
          <span class="section-navigation__name">
            {nextSection?.title ?? "Complete"}
          </span>
        </span>
      </Button>
    </nav>
  );
}

function renderItem(
  runtime: ChecklistRuntimeState,
  section: ChecklistSection,
  sectionIndex: number,
  item: ChecklistItem,
  actions: ChecklistPanelActions
): TVNode<HTMLButtonElement> {
  const itemState = runtime.getItemState(section.id, item.id);
  const hasDetails =
    item.kind !== "action" ||
    item.condition !== undefined ||
    item.alternatives !== undefined ||
    item.notes !== undefined;

  return (
    <Button
      class={{
        "checklist-item": true,
        [`checklist-item--${item.kind}`]: true,
        "checklist-item--complete": itemState,
        "checklist-item--review": item.needsReview === true,
      }}
      selected={itemState}
      callback={(): void =>
        actions.toggleItem(runtime, section, sectionIndex, itemState)
      }
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
                {ITEM_KIND_LABELS[item.kind]}
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

export function renderChecklistPanel(
  runtime: ChecklistRuntimeState,
  selectedChecklistId: Subscribable<string | null>,
  actions: ChecklistPanelActions
): VNode {
  const { checklist } = runtime;

  return (
    <div
      class={{
        "checklist-instance": true,
        "checklist-instance--active": selectedChecklistId.map(
          (checklistId) => checklistId === checklist.id
        ),
      }}
    >
      <header class="checklist-header">
        <div class="checklist-header__identity">
          <h1>{checklist.aircraft.model}</h1>
          <span class="checklist-header__manufacturer">
            {checklist.aircraft.manufacturer}
          </span>
        </div>

        <div class="checklist-header__progress" aria-label="Checklist progress">
          <span class="checklist-header__progress-label">
            {runtime.progressText}
          </span>
          <span class="checklist-header__progress-track">
            <span
              class="checklist-header__progress-value"
              style={{ width: runtime.progressWidth }}
            />
          </span>
        </div>
      </header>

      <main class="checklist-content">
        {checklist.sections.map((section, sectionIndex) => (
          <section
            class={{
              "checklist-section": true,
              "checklist-section--active": runtime.activeSectionIndex.map(
                (activeIndex) => activeIndex === sectionIndex
              ),
            }}
            id={`${checklist.id}-${section.id}`}
          >
            <div class="checklist-section__sticky">
              {renderNavigation(runtime, sectionIndex, actions)}
              <header class="checklist-section__header">
                <h2>
                  {renderCompletionMark(runtime, sectionIndex)}
                  <span>{section.title}</span>
                </h2>
              </header>
            </div>

            <div
              ref={runtime.sectionItemsRefs[sectionIndex]}
              class="checklist-section__items"
            >
              {section.items.map((item) =>
                renderItem(runtime, section, sectionIndex, item, actions)
              )}
            </div>
          </section>
        ))}
      </main>
    </div>
  );
}

/*
 * Shown while no single checklist matches the aircraft. The diagnostics line
 * carries the raw identity so a missing match can be turned into a rule.
 */
export function renderChecklistUnavailable(
  selectedChecklistId: Subscribable<string | null>,
  aircraftIdentityText: Subscribable<string>
): VNode {
  return (
    <div
      class={{
        "checklist-unavailable": true,
        "checklist-unavailable--active": selectedChecklistId.map(
          (checklistId) => checklistId === null
        ),
      }}
      role="status"
    >
      <div class="checklist-unavailable__message">
        Keine Checkliste vorhanden
      </div>

      <div class="checklist-unavailable__diagnostics">
        <span class="checklist-unavailable__diagnostic-label">Model:</span>
        <span>{aircraftIdentityText}</span>
      </div>
    </div>
  );
}
