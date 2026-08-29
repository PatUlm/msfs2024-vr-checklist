interface CommBusListener {
  on(eventName: string, callback: (data: string) => void): void;
  off(eventName: string, callback: (data: string) => void): void;
  callSimConnect(eventName: string, data: string): void;
  unregister(): void;
}

declare function RegisterCommBusListener(
  callback?: () => void
): CommBusListener;
