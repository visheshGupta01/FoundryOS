import { describe, it, expect } from "vitest";
import { handleAuthRoute } from "../../src/backend/auth/auth.router.js";
import type { IncomingMessage, ServerResponse } from "node:http";

describe("Authentication Router Endpoints", () => {
  function createMockResponse() {
    let statusCode = 200;
    let responseData: any = null;
    const headers: Record<string, string> = {};

    const res = {
      writeHead: (status: number, hdrs: Record<string, string>) => {
        statusCode = status;
        Object.assign(headers, hdrs);
      },
      end: (data: string) => {
        responseData = JSON.parse(data);
      }
    } as unknown as ServerResponse;

    return {
      res,
      getStatus: () => statusCode,
      getData: () => responseData
    };
  }

  const routerEmail = `router_${Date.now()}@test.com`;

  it("should handle /api/auth/signup POST", async () => {
    const mock = createMockResponse();
    const req = { method: "POST", headers: {} } as IncomingMessage;
    const url = new URL("http://localhost:3000/api/auth/signup");

    const handled = await handleAuthRoute(
      req,
      mock.res,
      url,
      async () => ({ name: "Router User", email: routerEmail, password: "password123" }),
      (res, status, data) => {
        res.writeHead(status, {});
        res.end(JSON.stringify(data));
      }
    );

    expect(handled).toBe(true);
    expect(mock.getStatus()).toBe(201);
    expect(mock.getData().success).toBe(true);
    expect(mock.getData().token).toBeDefined();
  });

  it("should handle /api/auth/login POST", async () => {
    const mock = createMockResponse();
    const req = { method: "POST", headers: {} } as IncomingMessage;
    const url = new URL("http://localhost:3000/api/auth/login");

    const handled = await handleAuthRoute(
      req,
      mock.res,
      url,
      async () => ({ email: routerEmail, password: "password123" }),
      (res, status, data) => {
        res.writeHead(status, {});
        res.end(JSON.stringify(data));
      }
    );

    expect(handled).toBe(true);
    expect(mock.getStatus()).toBe(200);
    expect(mock.getData().success).toBe(true);
  });

  it("should handle /api/auth/me GET with Bearer token", async () => {
    // First login to get token
    const loginMock = createMockResponse();
    await handleAuthRoute(
      { method: "POST", headers: {} } as IncomingMessage,
      loginMock.res,
      new URL("http://localhost:3000/api/auth/login"),
      async () => ({ email: routerEmail, password: "password123" }),
      (res, status, data) => {
        res.writeHead(status, {});
        res.end(JSON.stringify(data));
      }
    );
    const token = loginMock.getData().token;

    const meMock = createMockResponse();
    const meReq = {
      method: "GET",
      headers: { authorization: `Bearer ${token}` }
    } as IncomingMessage;

    const handled = await handleAuthRoute(
      meReq,
      meMock.res,
      new URL("http://localhost:3000/api/auth/me"),
      async () => ({}),
      (res, status, data) => {
        res.writeHead(status, {});
        res.end(JSON.stringify(data));
      }
    );

    expect(handled).toBe(true);
    expect(meMock.getStatus()).toBe(200);
    expect(meMock.getData().user?.email).toBe(routerEmail);
  });

  it("should handle /api/auth/logout POST", async () => {
    const mock = createMockResponse();
    const req = {
      method: "POST",
      headers: { authorization: "Bearer some-token" }
    } as IncomingMessage;

    const handled = await handleAuthRoute(
      req,
      mock.res,
      new URL("http://localhost:3000/api/auth/logout"),
      async () => ({}),
      (res, status, data) => {
        res.writeHead(status, {});
        res.end(JSON.stringify(data));
      }
    );

    expect(handled).toBe(true);
    expect(mock.getStatus()).toBe(200);
    expect(mock.getData().success).toBe(true);
  });
});
