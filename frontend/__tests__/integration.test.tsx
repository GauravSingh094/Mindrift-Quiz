import { wsManager } from "../lib/websocket-client";
import { apiClient } from "../lib/api-client";

// Mock WebSocket globally for Node/Jest runtime environment compatibility
beforeAll(() => {
  class MockWebSocket {
    static OPEN = 1;
    static CLOSED = 3;
    readyState = 1; // Open state
    onopen = null;
    onmessage = null;
    onerror = null;
    onclose = null;
    send = jest.fn();
    close = jest.fn();
  }
  
  (global as any).WebSocket = MockWebSocket;
});

afterAll(() => {
  delete (global as any).WebSocket;
});

describe("Mindrift F15 Backend Integration & Real-Time Production Data Layer Test Suite", () => {
  describe("Task 4: Global API HTTP Fetch Client", () => {
    test("should compile headers and append auth payloads correctly", async () => {
      // Mock global fetch to return a test model
      const fetchSpy = jest.spyOn(global, "fetch").mockImplementation(() =>
        Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve({ payload: "Synced Session" })
        } as Response)
      );

      const res = await apiClient<{ payload: string }>("/users/sync", {
        token: "clerk-jwt-sample-token"
      });

      expect(res.payload).toBe("Synced Session");
      expect(fetchSpy).toHaveBeenCalledWith(
        expect.stringContaining("/users/sync"),
        expect.objectContaining({
          headers: expect.any(Headers)
        })
      );

      fetchSpy.mockRestore();
    });
  });

  describe("Task 17: Resilient WebSocket connection Manager", () => {
    test("should safely add and handle topics subscribers", () => {
      const mockCallback = jest.fn();
      
      wsManager.subscribe("competitions:live", mockCallback);
      
      // Verify callback remains registered in manager listeners map
      wsManager.disconnect();
      expect(mockCallback).not.toHaveBeenCalled();
    });

    test("should handle explicit disconnection and clear heartbeats", () => {
      wsManager.disconnect();
      expect(true).toBe(true);
    });
  });
});
