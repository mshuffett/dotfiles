import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { UserProfile } from "../UserProfile";

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

const mockProfile = {
  id: "user-1",
  name: "Jane Doe",
  email: "jane@example.com",
  bio: "Hello world",
  avatarUrl: "https://example.com/avatar.jpg",
  socialLinks: {
    twitter: "https://twitter.com/jane",
    github: "https://github.com/jane",
    website: "https://jane.dev",
  },
  joinedAt: "2024-01-01T00:00:00Z",
};

function mockFetchSuccess(data: unknown = mockProfile) {
  mockFetch.mockResolvedValueOnce({
    ok: true,
    json: () => Promise.resolve(data),
  });
}

function mockFetchError(status = 500) {
  mockFetch.mockResolvedValueOnce({
    ok: false,
    status,
    json: () => Promise.resolve({ error: "Server error" }),
  });
}

describe("UserProfile", () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ── Loading ────────────────────────────────────────────────────────

  describe("Loading state", () => {
    it("shows loading indicator while fetching profile", () => {
      mockFetch.mockReturnValueOnce(new Promise(() => {})); // never resolves
      render(<UserProfile userId="user-1" />);
      expect(screen.getByText("Loading profile...")).toBeDefined();
    });
  });

  // ── Profile display ───────────────────────────────────────────────

  describe("Profile display", () => {
    it("renders profile data after successful fetch", async () => {
      mockFetchSuccess();
      render(<UserProfile userId="user-1" />);

      await waitFor(() => {
        expect(screen.getByText("Jane Doe")).toBeDefined();
      });
      expect(screen.getByText("jane@example.com")).toBeDefined();
    });

    it("renders avatar with correct src", async () => {
      mockFetchSuccess();
      render(<UserProfile userId="user-1" />);

      await waitFor(() => {
        const img = screen.getByAltText(
          "Jane Doe's avatar"
        ) as HTMLImageElement;
        expect(img.src).toBe("https://example.com/avatar.jpg");
      });
    });

    it("uses default avatar when avatarUrl is missing", async () => {
      mockFetchSuccess({ ...mockProfile, avatarUrl: undefined });
      render(<UserProfile userId="user-1" />);

      await waitFor(() => {
        const img = screen.getByAltText(
          "Jane Doe's avatar"
        ) as HTMLImageElement;
        expect(img.src).toContain("default-avatar.png");
      });
    });

    it("uses default avatar when avatarUrl is empty string", async () => {
      mockFetchSuccess({ ...mockProfile, avatarUrl: "" });
      render(<UserProfile userId="user-1" />);

      await waitFor(() => {
        const img = screen.getByAltText(
          "Jane Doe's avatar"
        ) as HTMLImageElement;
        expect(img.src).toContain("default-avatar.png");
      });
    });

    it("renders social links when present", async () => {
      mockFetchSuccess();
      render(<UserProfile userId="user-1" />);

      await waitFor(() => {
        expect(screen.getByText("Twitter")).toBeDefined();
        expect(screen.getByText("GitHub")).toBeDefined();
        expect(screen.getByText("Website")).toBeDefined();
      });
    });

    it("does not crash when socialLinks is undefined", async () => {
      mockFetchSuccess({ ...mockProfile, socialLinks: undefined });
      render(<UserProfile userId="user-1" />);

      await waitFor(() => {
        expect(screen.getByText("Jane Doe")).toBeDefined();
      });
      expect(screen.queryByText("Twitter")).toBeNull();
    });

    it("only renders social links that have values", async () => {
      mockFetchSuccess({
        ...mockProfile,
        socialLinks: { twitter: "https://twitter.com/jane" },
      });
      render(<UserProfile userId="user-1" />);

      await waitFor(() => {
        expect(screen.getByText("Twitter")).toBeDefined();
      });
      expect(screen.queryByText("GitHub")).toBeNull();
      expect(screen.queryByText("Website")).toBeNull();
    });

    it("adds rel=noopener noreferrer to social links", async () => {
      mockFetchSuccess();
      render(<UserProfile userId="user-1" />);

      await waitFor(() => {
        const twitterLink = screen.getByText("Twitter").closest("a");
        expect(twitterLink?.getAttribute("rel")).toBe("noopener noreferrer");
      });
    });

    it("renders bio as plain text, preventing XSS", async () => {
      const xssBio = '<script>alert("xss")</script><b>bold</b>';
      mockFetchSuccess({ ...mockProfile, bio: xssBio });
      render(<UserProfile userId="user-1" />);

      await waitFor(() => {
        // The raw HTML string should be visible as text (React auto-escapes)
        expect(screen.getByText(xssBio)).toBeDefined();
      });
      // No script tag should actually exist in the DOM
      expect(document.querySelector("script")).toBeNull();
      // The <b> should not be rendered as an HTML element either
      const bioEl = screen.getByText(xssBio);
      expect(bioEl.querySelector("b")).toBeNull();
    });

    it("preserves whitespace in bio", async () => {
      mockFetchSuccess({ ...mockProfile, bio: "Line 1\nLine 2" });
      render(<UserProfile userId="user-1" />);

      await waitFor(() => {
        const bioEl = screen.getByText("Line 1\nLine 2");
        expect(bioEl.className).toContain("whitespace-pre-wrap");
      });
    });
  });

  // ── Error handling ────────────────────────────────────────────────

  describe("Error handling", () => {
    it("shows error message when fetch returns non-ok response", async () => {
      mockFetchError();
      render(<UserProfile userId="user-1" />);

      await waitFor(() => {
        expect(screen.getByText("Failed to load profile")).toBeDefined();
      });
    });

    it("shows error when fetch throws (network error)", async () => {
      mockFetch.mockRejectedValueOnce(new Error("Network error"));
      render(<UserProfile userId="user-1" />);

      await waitFor(() => {
        expect(screen.getByText("Failed to load profile")).toBeDefined();
      });
    });

    it("error container has role=alert for accessibility", async () => {
      mockFetchError();
      render(<UserProfile userId="user-1" />);

      await waitFor(() => {
        const alertEl = screen.getByRole("alert");
        expect(alertEl.textContent).toContain("Failed to load profile");
      });
    });
  });

  // ── Edit mode ─────────────────────────────────────────────────────

  describe("Edit mode", () => {
    it("enters edit mode when Edit Profile is clicked", async () => {
      mockFetchSuccess();
      const user = userEvent.setup();
      render(<UserProfile userId="user-1" />);

      await waitFor(() => {
        expect(screen.getByText("Edit Profile")).toBeDefined();
      });

      await user.click(screen.getByText("Edit Profile"));
      expect(screen.getByPlaceholderText("Name")).toBeDefined();
      expect(screen.getByPlaceholderText("Email")).toBeDefined();
      expect(screen.getByPlaceholderText("Bio")).toBeDefined();
    });

    it("pre-fills form with current profile data", async () => {
      mockFetchSuccess();
      const user = userEvent.setup();
      render(<UserProfile userId="user-1" />);

      await waitFor(() => {
        expect(screen.getByText("Edit Profile")).toBeDefined();
      });

      await user.click(screen.getByText("Edit Profile"));
      expect(screen.getByDisplayValue("Jane Doe")).toBeDefined();
      expect(screen.getByDisplayValue("jane@example.com")).toBeDefined();
      expect(screen.getByDisplayValue("Hello world")).toBeDefined();
    });

    it("Cancel exits edit mode", async () => {
      mockFetchSuccess();
      const user = userEvent.setup();
      render(<UserProfile userId="user-1" />);

      await waitFor(() => {
        expect(screen.getByText("Edit Profile")).toBeDefined();
      });

      await user.click(screen.getByText("Edit Profile"));
      await user.click(screen.getByText("Cancel"));
      expect(screen.queryByPlaceholderText("Name")).toBeNull();
      expect(screen.getByText("Edit Profile")).toBeDefined();
    });

    it("Cancel resets form data to original profile values", async () => {
      mockFetchSuccess();
      const user = userEvent.setup();
      render(<UserProfile userId="user-1" />);

      await waitFor(() => {
        expect(screen.getByText("Edit Profile")).toBeDefined();
      });

      // Edit, change name, cancel
      await user.click(screen.getByText("Edit Profile"));
      const nameInput = screen.getByPlaceholderText("Name");
      await user.clear(nameInput);
      await user.type(nameInput, "Changed Name");
      await user.click(screen.getByText("Cancel"));

      // Re-enter edit mode: form should have original values, not "Changed Name"
      await user.click(screen.getByText("Edit Profile"));
      expect(screen.getByDisplayValue("Jane Doe")).toBeDefined();
    });

    it("Cancel clears any validation error", async () => {
      mockFetchSuccess();
      const user = userEvent.setup();
      render(<UserProfile userId="user-1" />);

      await waitFor(() => {
        expect(screen.getByText("Edit Profile")).toBeDefined();
      });

      await user.click(screen.getByText("Edit Profile"));
      // Trigger validation error
      const nameInput = screen.getByPlaceholderText("Name");
      await user.clear(nameInput);
      await user.click(screen.getByText("Save"));
      await waitFor(() => {
        expect(screen.getByText("Name is required")).toBeDefined();
      });

      // Cancel should clear the error
      await user.click(screen.getByText("Cancel"));
      expect(screen.queryByText("Name is required")).toBeNull();
    });

    it("form inputs have accessible labels", async () => {
      mockFetchSuccess();
      const user = userEvent.setup();
      render(<UserProfile userId="user-1" />);

      await waitFor(() => {
        expect(screen.getByText("Edit Profile")).toBeDefined();
      });
      await user.click(screen.getByText("Edit Profile"));

      expect(screen.getByLabelText("Name")).toBeDefined();
      expect(screen.getByLabelText("Email")).toBeDefined();
      expect(screen.getByLabelText("Bio")).toBeDefined();
    });

    it("email input has type=email", async () => {
      mockFetchSuccess();
      const user = userEvent.setup();
      render(<UserProfile userId="user-1" />);

      await waitFor(() => {
        expect(screen.getByText("Edit Profile")).toBeDefined();
      });
      await user.click(screen.getByText("Edit Profile"));

      const emailInput = screen.getByPlaceholderText(
        "Email"
      ) as HTMLInputElement;
      expect(emailInput.type).toBe("email");
    });
  });

  // ── Form validation ───────────────────────────────────────────────

  describe("Form validation", () => {
    async function enterEditMode() {
      mockFetchSuccess();
      const user = userEvent.setup();
      render(<UserProfile userId="user-1" />);

      await waitFor(() => {
        expect(screen.getByText("Edit Profile")).toBeDefined();
      });
      await user.click(screen.getByText("Edit Profile"));
      return user;
    }

    it("shows error when name is empty", async () => {
      const user = await enterEditMode();

      const nameInput = screen.getByPlaceholderText("Name");
      await user.clear(nameInput);
      await user.click(screen.getByText("Save"));

      await waitFor(() => {
        expect(screen.getByText("Name is required")).toBeDefined();
      });
    });

    it("shows error when email is empty", async () => {
      const user = await enterEditMode();

      const emailInput = screen.getByPlaceholderText("Email");
      await user.clear(emailInput);
      await user.click(screen.getByText("Save"));

      await waitFor(() => {
        expect(screen.getByText("Email is required")).toBeDefined();
      });
    });

    it("shows error when email is invalid", async () => {
      const user = await enterEditMode();

      const emailInput = screen.getByPlaceholderText("Email");
      await user.clear(emailInput);
      await user.type(emailInput, "not-an-email");
      await user.click(screen.getByText("Save"));

      await waitFor(() => {
        expect(
          screen.getByText("Please enter a valid email address")
        ).toBeDefined();
      });
    });

    it("does not call API when validation fails", async () => {
      const user = await enterEditMode();

      const callCountBefore = mockFetch.mock.calls.length;
      const nameInput = screen.getByPlaceholderText("Name");
      await user.clear(nameInput);
      await user.click(screen.getByText("Save"));

      expect(mockFetch.mock.calls.length).toBe(callCountBefore);
    });
  });

  // ── Save profile ──────────────────────────────────────────────────

  describe("Save profile", () => {
    it("submits form data and updates profile on success", async () => {
      mockFetchSuccess(); // initial load
      const user = userEvent.setup();
      render(<UserProfile userId="user-1" />);

      await waitFor(() => {
        expect(screen.getByText("Edit Profile")).toBeDefined();
      });
      await user.click(screen.getByText("Edit Profile"));

      const nameInput = screen.getByPlaceholderText("Name");
      await user.clear(nameInput);
      await user.type(nameInput, "Jane Updated");

      mockFetchSuccess({ ...mockProfile, name: "Jane Updated" });

      await user.click(screen.getByText("Save"));

      await waitFor(() => {
        expect(screen.getByText("Jane Updated")).toBeDefined();
      });

      // Verify the PUT was called with correct data
      const putCall = mockFetch.mock.calls.find(
        (call: unknown[]) =>
          (call[1] as Record<string, unknown>)?.method === "PUT"
      );
      expect(putCall).toBeDefined();
      const putBody = JSON.parse(
        (putCall![1] as Record<string, string>).body
      );
      expect(putBody.userId).toBe("user-1");
      expect(putBody.name).toBe("Jane Updated");
    });

    it("shows error when save fails", async () => {
      mockFetchSuccess(); // initial load
      const user = userEvent.setup();
      render(<UserProfile userId="user-1" />);

      await waitFor(() => {
        expect(screen.getByText("Edit Profile")).toBeDefined();
      });
      await user.click(screen.getByText("Edit Profile"));

      mockFetchError(500);

      await user.click(screen.getByText("Save"));

      await waitFor(() => {
        expect(screen.getByText("Server error")).toBeDefined();
      });
    });

    it("shows 'Saving...' text and disables buttons while saving", async () => {
      mockFetchSuccess(); // initial load
      const user = userEvent.setup();
      render(<UserProfile userId="user-1" />);

      await waitFor(() => {
        expect(screen.getByText("Edit Profile")).toBeDefined();
      });
      await user.click(screen.getByText("Edit Profile"));

      // PUT never resolves so we can inspect loading state
      mockFetch.mockReturnValueOnce(new Promise(() => {}));

      await user.click(screen.getByText("Save"));

      await waitFor(() => {
        expect(screen.getByText("Saving...")).toBeDefined();
      });
      const saveBtn = screen.getByText("Saving...") as HTMLButtonElement;
      expect(saveBtn.disabled).toBe(true);
      const cancelBtn = screen.getByText("Cancel") as HTMLButtonElement;
      expect(cancelBtn.disabled).toBe(true);
    });
  });

  // ── userId encoding ───────────────────────────────────────────────

  describe("userId encoding", () => {
    it("encodes userId in the fetch URL", async () => {
      mockFetchSuccess();
      render(<UserProfile userId="user with spaces" />);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          "/api/profile?userId=user%20with%20spaces"
        );
      });
    });
  });
});
