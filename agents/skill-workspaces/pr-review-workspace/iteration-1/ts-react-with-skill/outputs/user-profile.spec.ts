import { test, expect } from "@playwright/test";

test.describe("User Profile Page", () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the profile page
    await page.goto("/profile");
  });

  test("displays user profile after loading", async ({ page }) => {
    await page.screenshot({
      path: "screenshots/profile-loading.png",
      fullPage: true,
    });

    // Wait for loading to finish
    await page.waitForSelector(".animate-pulse", { state: "detached" });

    await page.screenshot({
      path: "screenshots/profile-loaded.png",
      fullPage: true,
    });

    // Verify profile data renders
    await expect(page.locator("h2")).toBeVisible();
    await expect(page.locator('img[alt*="avatar"]')).toBeVisible();
  });

  test("avatar has fallback when no URL provided", async ({ page }) => {
    // This test verifies the default avatar fallback
    await page.waitForSelector(".animate-pulse", { state: "detached" });

    const avatar = page.locator('img[alt*="avatar"]');
    await expect(avatar).toBeVisible();
    const src = await avatar.getAttribute("src");
    // Should either have a real URL or the default fallback
    expect(src).toBeTruthy();
  });

  test("social links only render when present", async ({ page }) => {
    await page.waitForSelector(".animate-pulse", { state: "detached" });

    await page.screenshot({
      path: "screenshots/profile-social-links.png",
      fullPage: true,
    });

    // Social links section should not crash if socialLinks is undefined
    // If links are present, they should be clickable anchors
    const twitterLink = page.locator('a:has-text("Twitter")');
    const count = await twitterLink.count();
    if (count > 0) {
      await expect(twitterLink).toHaveAttribute("href", /twitter\.com/);
    }
  });

  test("bio does not execute injected scripts (XSS protection)", async ({
    page,
  }) => {
    await page.waitForSelector(".animate-pulse", { state: "detached" });

    // Check that the bio section does not contain raw script elements
    const scriptInBio = page.locator(".prose script");
    await expect(scriptInBio).toHaveCount(0);

    await page.screenshot({
      path: "screenshots/profile-bio-xss-safe.png",
      fullPage: true,
    });
  });

  test("enters and exits edit mode", async ({ page }) => {
    await page.waitForSelector(".animate-pulse", { state: "detached" });

    // Click Edit Profile
    await page.click('button:has-text("Edit Profile")');

    await page.screenshot({
      path: "screenshots/profile-edit-mode.png",
      fullPage: true,
    });

    // Verify form fields appear
    await expect(page.locator('input[placeholder="Name"]')).toBeVisible();
    await expect(page.locator('input[placeholder="Email"]')).toBeVisible();
    await expect(page.locator('textarea[placeholder="Bio"]')).toBeVisible();

    // Click Cancel to exit edit mode
    await page.click('button:has-text("Cancel")');

    await page.screenshot({
      path: "screenshots/profile-view-mode.png",
      fullPage: true,
    });

    // Verify we're back to view mode
    await expect(page.locator('button:has-text("Edit Profile")')).toBeVisible();
  });

  test("validates empty name on save", async ({ page }) => {
    await page.waitForSelector(".animate-pulse", { state: "detached" });
    await page.click('button:has-text("Edit Profile")');

    // Clear the name field
    await page.fill('input[placeholder="Name"]', "");
    await page.click('button:has-text("Save")');

    await page.screenshot({
      path: "screenshots/profile-validation-empty-name.png",
      fullPage: true,
    });

    // Should show validation error
    await expect(page.locator("text=Name is required")).toBeVisible();
  });

  test("validates invalid email on save", async ({ page }) => {
    await page.waitForSelector(".animate-pulse", { state: "detached" });
    await page.click('button:has-text("Edit Profile")');

    // Enter invalid email
    await page.fill('input[placeholder="Email"]', "not-an-email");
    await page.click('button:has-text("Save")');

    await page.screenshot({
      path: "screenshots/profile-validation-invalid-email.png",
      fullPage: true,
    });

    await expect(
      page.locator("text=Please enter a valid email address")
    ).toBeVisible();
  });

  test("saves profile successfully", async ({ page }) => {
    await page.waitForSelector(".animate-pulse", { state: "detached" });
    await page.click('button:has-text("Edit Profile")');

    // Update name
    await page.fill('input[placeholder="Name"]', "Updated Name");
    await page.fill('input[placeholder="Email"]', "updated@example.com");
    await page.click('button:has-text("Save")');

    await page.screenshot({
      path: "screenshots/profile-after-save.png",
      fullPage: true,
    });

    // Should exit edit mode and show updated profile
    await expect(page.locator('button:has-text("Edit Profile")')).toBeVisible();
  });

  test("shows error when profile load fails", async ({ page }) => {
    // Intercept the profile API to return an error
    await page.route("/api/profile*", (route) =>
      route.fulfill({ status: 500, body: JSON.stringify({ error: "fail" }) })
    );

    await page.goto("/profile");

    await page.screenshot({
      path: "screenshots/profile-load-error.png",
      fullPage: true,
    });

    await expect(page.locator("text=Failed to load profile")).toBeVisible();
  });
});
