// WebSocket / Real-time collaboration client
export const socket = {
  connected: false,
  connect() {
    console.log("[SOCKET] Initializing real-time channel...");
    this.connected = true;
  },
  disconnect() {
    console.log("[SOCKET] Disconnected");
    this.connected = false;
  },
  emit(event, payload) {
    console.log(`[SOCKET EMIT] ${event}:`, payload);
  },
  on(event, callback) {
    console.log(`[SOCKET LISTENER] Registered for ${event}`);
  },
};

export default socket;
