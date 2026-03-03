import { expect, test } from "@playwright/test";

test("landing page renders", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Paddock to Penthouse" })).toBeVisible();
});

test("local login redirects to dashboard", async ({ page }) => {
  const deprecationWarnings: string[] = [];
  page.on("console", (message) => {
    const text = message.text();
    if (/findDOMNode|defaultProps/.test(text)) {
      deprecationWarnings.push(text);
    }
  });

  await page.route("**/auth/local/login", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        token: "test-token",
        user: {
          userId: "player-1",
          email: "owner@example.com",
          role: "ADMIN"
        }
      })
    });
  });

  await page.route("**/auth/me", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        userId: "player-1",
        email: "owner@example.com",
        role: "ADMIN"
      })
    });
  });

  await page.route("**/player/state", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        profile: {
          id: "player-1",
          email: "owner@example.com",
          displayName: "Local Player",
          role: "ADMIN"
        },
        memberships: [],
        teams: []
      })
    });
  });

  await page.goto("/login");
  await page.getByLabel("Email").fill("owner@example.com");
  await page.getByLabel("Display Name").fill("Local Player");
  await page.getByRole("button", { name: "Sign in (Local)" }).click();

  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(page.getByRole("heading", { name: "Player Dashboard" })).toBeVisible();
  expect(deprecationWarnings).toEqual([]);
});
