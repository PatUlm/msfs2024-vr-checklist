import {
  EventBus,
  KeyEventData,
  KeyEventManager,
  KeyEvents,
  Subscription,
} from "@microsoft/msfs-sdk";
import { CONFIRMATION_ACTIONS } from "../settings/EfbSettings";

/*
 * The sim key event that confirms the next open item of the section on screen.
 * The user binds it in the MSFS controls, so any device MSFS knows works,
 * including a HOTAS button; the app never learns which key or button was
 * pressed, only that this event fired.
 *
 * `PLASMA_OFF` is offered as SET PLASMA OFF and confirmed to reach this EFB
 * context in G36, DA42, H125 and MH-60. The choice, rejected alternatives and
 * runtime constraints live in
 * docs/adr/0011-bestaetigungsaktionen-im-companion.md and
 * docs/msfs-sdk-reference.md#sim-key-events-in-einer-custom-efb-app.
 *
 * It is intercepted with pass-through, so the sim still receives it and
 * nothing is masked.
 *
 * The MSFS EFB action VALIDATE stays out of this app. Under SDK 1.7.3 a
 * visible custom EFB AppView received none of: DOM keydown for Enter/Return,
 * the InputStackListener actions KEY_EFB_VALID or KEY_MENU_WM_VALIDATE, or
 * AppView.routeGamepadInteractionEvent(BUTTON_A) with a physical gamepad.
 * The cause is documented: every KEY_EFB_* action carries the actiondb tag
 * norebind_kbmpad and cannot be bound to keyboard, mouse or pad at all. Do
 * not restore any of those listeners and do not poll for input.
 */

/*
 * Shortest gap between two presses that count as two confirmations. It exists
 * because a single press can deliver the event more than once: there is no
 * unregister call for an intercept, so every re-registration in the same
 * simulator session adds another delivery, and a reload or a VR switch that
 * recreates the app context registers again. Duplicates from that arrive
 * within the same frame, a deliberate double press never does.
 */
export const CONFIRM_KEY_DEBOUNCE_MS = 60;

/*
 * Key events this JavaScript context has asked to intercept since the last
 * flight transition. A recreated view in the same context must not register
 * them again, for the same reason the debounce exists.
 *
 * Every `FltLoad` clears the guard because one flight start contains several
 * loads and a registration made after the first one did not survive the later
 * ones. The intercept is renewed only once the ready-to-cockpit sequence ends,
 * or when an observed `GameState.loading` ends. See
 * docs/msfs-sdk-reference.md#sim-key-events-in-einer-custom-efb-app.
 */
const interceptedKeyEvents = new Set<string>();

export interface ConfirmationInputOptions {
  bus: EventBus;
  /** Presses arriving while the view is not active are dropped. */
  isViewActive: () => boolean;
  isActionEnabled: (event: string) => boolean;
  onConfirm: () => void;
  now?: () => number;
}

export class ConfirmationInput {
  private readonly bus: EventBus;
  private readonly isViewActive: () => boolean;
  private readonly isActionEnabled: (event: string) => boolean;
  private readonly onConfirm: () => void;
  private readonly now: () => number;
  private keyEventManager: KeyEventManager | undefined;
  private keyEventSubscription: Subscription | undefined;
  private lastConfirmAt = 0;

  public constructor(options: ConfirmationInputOptions) {
    this.bus = options.bus;
    this.isViewActive = options.isViewActive;
    this.onConfirm = options.onConfirm;
    this.isActionEnabled = options.isActionEnabled;
    this.now = options.now ?? (() => Date.now());
  }

  /*
   * Subscribes to the intercepted key events and asks for the first
   * interception. The bus subscription is made once per app instance; the
   * interception itself is renewed per flight, see `ensureInterception`.
   */
  public start(): void {
    KeyEventManager.getManager(this.bus)
      .then((manager) => {
        this.keyEventManager = manager;
        this.keyEventSubscription = this.bus
          .getSubscriber<KeyEvents>()
          .on("key_intercept")
          .handle((data: KeyEventData) => this.handleKeyIntercept(data));
        this.ensureInterception("app start");
      })
      .catch((error) =>
        console.error(`[VR Checklist] Key event manager unavailable: ${error}`)
      );
  }

  /*
   * Asks the sim to intercept the confirmation key event unless this
   * JavaScript context already did so for the current flight. There is no
   * unregister call, so a repeated registration only adds another delivery of
   * the same press, which the debounce absorbs. Missing a registration the sim
   * has dropped loses the input entirely, which is the worse of the two.
   */
  public ensureInterception(reason: string): void {
    const manager = this.keyEventManager;

    if (!manager) return;
    for (const action of CONFIRMATION_ACTIONS) {
      if (interceptedKeyEvents.has(action.event)) continue;
      manager.interceptKey(action.event, true);
      interceptedKeyEvents.add(action.event);
      console.info(`[VR Checklist] Key event interception active for ${action.event} (${reason}).`);
    }
  }

  public invalidateInterception(reason: string): void {
    for (const action of CONFIRMATION_ACTIONS) {
      if (interceptedKeyEvents.delete(action.event)) {
        console.info(`[VR Checklist] Key event interception marked stale for ${action.event} (${reason}).`);
      }
    }
  }

  /*
   * The intercepts themselves stay set: the sim has no unregister call. Only
   * this instance's bus subscription is released.
   */
  public dispose(): void {
    this.keyEventSubscription?.destroy();
  }

  private handleKeyIntercept(data: KeyEventData): void {
    if (!CONFIRMATION_ACTIONS.some((action) => action.event === data.key)) {
      return;
    }

    if (!this.isViewActive()) {
      console.info(
        `[VR Checklist] Key event ${data.key} ignored: the app view is not ` +
          `active.`
      );
      return;
    }

    if (!this.isActionEnabled(data.key)) return;

    const now = this.now();

    if (now - this.lastConfirmAt < CONFIRM_KEY_DEBOUNCE_MS) {
      console.info(
        `[VR Checklist] Key event ${data.key} ignored as a duplicate ` +
          `delivery ${now - this.lastConfirmAt} ms after the last one.`
      );
      return;
    }

    this.lastConfirmAt = now;
    this.onConfirm();
  }
}
