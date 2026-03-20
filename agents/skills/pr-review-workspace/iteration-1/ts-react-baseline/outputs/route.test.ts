import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET, PUT } from "../route";
import { initDb, type DbClient } from "@/lib/db";

// Create a mock database
function createMockDb(): DbClient & {
  _queryResults: unknown[];
  _executeResult: { rowsAffected: number };
} {
  const mock = {
    _queryResults: [] as unknown[],
    _executeResult: { rowsAffected: 1 },
    query: vi.fn(async () => mock._queryResults),
    execute: vi.fn(async () => mock._executeResult),
  };
  return mock;
}

const mockUserRow = {
  id: "user-1",
  name: "Jane Doe",
  email: "jane@example.com",
  bio: "Hello world",
  avatar_url: "https://example.com/avatar.jpg",
  social_links: { twitter: "https://twitter.com/jane" },
  joined_at: "2024-01-01T00:00:00Z",
};

describe("GET /api/profile", () => {
  let db: ReturnType<typeof createMockDb>;

  beforeEach(() => {
    db = createMockDb();
    initDb(db);
  });

  it("returns 400 when userId is missing", async () => {
    const request = new Request("http://localhost/api/profile");
    const response = await GET(request);

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toBe("userId is required");
  });

  it("returns 404 when user is not found", async () => {
    db._queryResults = [];
    const request = new Request(
      "http://localhost/api/profile?userId=nonexistent"
    );
    const response = await GET(request);

    expect(response.status).toBe(404);
    const body = await response.json();
    expect(body.error).toBe("User not found");
  });

  it("returns user profile on success", async () => {
    db._queryResults = [mockUserRow];
    const request = new Request("http://localhost/api/profile?userId=user-1");
    const response = await GET(request);

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.id).toBe("user-1");
    expect(body.name).toBe("Jane Doe");
    expect(body.email).toBe("jane@example.com");
    expect(body.avatarUrl).toBe("https://example.com/avatar.jpg");
    expect(body.socialLinks).toEqual({
      twitter: "https://twitter.com/jane",
    });
  });

  it("maps snake_case DB columns to camelCase response keys", async () => {
    db._queryResults = [mockUserRow];
    const request = new Request("http://localhost/api/profile?userId=user-1");
    const response = await GET(request);
    const body = await response.json();

    // camelCase keys should exist
    expect(body).toHaveProperty("avatarUrl");
    expect(body).toHaveProperty("socialLinks");
    expect(body).toHaveProperty("joinedAt");
    // snake_case keys should NOT exist
    expect(body).not.toHaveProperty("avatar_url");
    expect(body).not.toHaveProperty("social_links");
    expect(body).not.toHaveProperty("joined_at");
  });

  it("uses parameterized query (no SQL injection)", async () => {
    db._queryResults = [];
    const maliciousId = "'; DROP TABLE users; --";
    const request = new Request(
      `http://localhost/api/profile?userId=${encodeURIComponent(maliciousId)}`
    );
    await GET(request);

    // Verify the query used parameterized syntax, not string interpolation
    const queryCall = db.query.mock.calls[0];
    expect(queryCall[0]).toContain("$1");
    expect(queryCall[0]).not.toContain(maliciousId);
    expect(queryCall[1]).toEqual([maliciousId]);
  });
});

describe("PUT /api/profile", () => {
  let db: ReturnType<typeof createMockDb>;

  beforeEach(() => {
    db = createMockDb();
    initDb(db);
  });

  function makePutRequest(body: unknown): Request {
    return new Request("http://localhost/api/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  }

  it("returns 400 when userId is missing", async () => {
    const request = makePutRequest({
      name: "Jane",
      email: "jane@example.com",
    });
    const response = await PUT(request);

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toBe("userId is required");
  });

  it("returns 400 when name is empty", async () => {
    const request = makePutRequest({
      userId: "user-1",
      name: "",
      email: "jane@example.com",
      bio: "hi",
    });
    const response = await PUT(request);

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toBe("name is required");
  });

  it("returns 400 when name is only whitespace", async () => {
    const request = makePutRequest({
      userId: "user-1",
      name: "   ",
      email: "jane@example.com",
      bio: "hi",
    });
    const response = await PUT(request);

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toBe("name is required");
  });

  it("returns 400 when email is invalid", async () => {
    const request = makePutRequest({
      userId: "user-1",
      name: "Jane",
      email: "not-an-email",
      bio: "hi",
    });
    const response = await PUT(request);

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toBe("A valid email is required");
  });

  it("returns 400 when email is missing", async () => {
    const request = makePutRequest({
      userId: "user-1",
      name: "Jane",
      email: "",
      bio: "hi",
    });
    const response = await PUT(request);

    expect(response.status).toBe(400);
  });

  it("returns 400 for malformed JSON body", async () => {
    const request = new Request("http://localhost/api/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: "not-json",
    });
    const response = await PUT(request);

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toBe("Invalid JSON body");
  });

  it("updates profile and returns updated data", async () => {
    const updatedRow = {
      ...mockUserRow,
      name: "Jane Updated",
      email: "new@example.com",
    };
    db._queryResults = [updatedRow];

    const request = makePutRequest({
      userId: "user-1",
      name: "Jane Updated",
      email: "new@example.com",
      bio: "Updated bio",
    });
    const response = await PUT(request);

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.name).toBe("Jane Updated");

    // Verify parameterized execute call
    const executeCall = db.execute.mock.calls[0];
    expect(executeCall[0]).toContain("$1");
    expect(executeCall[1]).toEqual([
      "Jane Updated",
      "new@example.com",
      "Updated bio",
      "user-1",
    ]);
  });

  it("trims name before saving", async () => {
    db._queryResults = [mockUserRow];

    const request = makePutRequest({
      userId: "user-1",
      name: "  Jane  ",
      email: "jane@example.com",
      bio: "hi",
    });
    await PUT(request);

    const executeCall = db.execute.mock.calls[0];
    // The first param (name) should be trimmed
    expect(executeCall[1]![0]).toBe("Jane");
  });

  it("trims email before saving", async () => {
    db._queryResults = [mockUserRow];

    const request = makePutRequest({
      userId: "user-1",
      name: "Jane",
      email: " jane@example.com ",
      bio: "hi",
    });
    await PUT(request);

    const executeCall = db.execute.mock.calls[0];
    // The second param (email) should be trimmed
    expect(executeCall[1]![1]).toBe("jane@example.com");
  });

  it("defaults bio to empty string when null/undefined", async () => {
    db._queryResults = [mockUserRow];

    const request = makePutRequest({
      userId: "user-1",
      name: "Jane",
      email: "jane@example.com",
      // bio is omitted
    });
    await PUT(request);

    const executeCall = db.execute.mock.calls[0];
    expect(executeCall[1]![2]).toBe("");
  });

  it("returns 404 if user disappears between update and re-fetch", async () => {
    // The query after execute returns no rows
    db._queryResults = [];

    const request = makePutRequest({
      userId: "user-1",
      name: "Jane",
      email: "jane@example.com",
      bio: "hi",
    });
    const response = await PUT(request);

    expect(response.status).toBe(404);
  });

  it("uses parameterized queries (no SQL injection)", async () => {
    db._queryResults = [mockUserRow];
    const maliciousInput = "'; DROP TABLE users; --";

    const request = makePutRequest({
      userId: "user-1",
      name: maliciousInput,
      email: "valid@example.com",
      bio: "test",
    });
    await PUT(request);

    // Verify the execute used parameterized syntax
    const executeCall = db.execute.mock.calls[0];
    expect(executeCall[0]).not.toContain(maliciousInput);
    expect(executeCall[1]![0]).toBe(maliciousInput);
  });
});
