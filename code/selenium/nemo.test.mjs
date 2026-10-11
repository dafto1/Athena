import assert from "node:assert/strict";
import { test } from "node:test";
import { Builder, By, Browser, until } from "selenium-webdriver";
import chrome from "selenium-webdriver/chrome.js";

const baseUrl = (process.env.SELENIUM_BASE_URL ?? "http://localhost:3000").replace(/\/$/, "");
const email = process.env.SELENIUM_EMAIL;
const password = process.env.SELENIUM_PASSWORD;

async function createDriver() {
  const browserName = process.env.SELENIUM_BROWSER ?? Browser.CHROME;
  const builder = new Builder().forBrowser(browserName);
  if (browserName === Browser.CHROME) {
    const options = new chrome.Options();
    options.addArguments("--disable-notifications", "--disable-background-networking");
    if (process.env.SELENIUM_HEADLESS === "1") {
      options.addArguments("--headless=new", "--disable-gpu", "--window-size=1440,1000");
    }
    builder.setChromeOptions(options);
  }
  const driver = await builder.build();
  await driver.manage().setTimeouts({ implicit: 0, pageLoad: 20_000, script: 10_000 });
  return driver;
}

async function login(driver) {
  await driver.get(`${baseUrl}/login`);
  if (new URL(await driver.getCurrentUrl()).pathname !== "/login") return;

  await driver.findElement(By.css('input[name="email"]')).sendKeys(email);
  await driver.findElement(By.css('input[name="password"]')).sendKeys(password);
  await driver.findElement(By.xpath("//button[normalize-space()='Log in']")).click();
  try {
    await driver.wait(until.urlContains("/dashboard"), 15_000);
  } catch (error) {
    const currentUrl = await driver.getCurrentUrl();
    const visibleErrors = await driver.findElements(By.css('[role="alert"]'));
    const errorText = (await Promise.all(visibleErrors.map((element) => element.getText())))
      .filter(Boolean)
      .join(" | ");
    const formText = await driver.findElement(By.css("form")).getText().catch(() => "");
    throw new Error(
      `Login did not reach the dashboard (current URL: ${currentUrl}). ` +
      (errorText || formText ? `Visible login feedback: ${errorText || formText}` : "No login error was rendered; check the app server, database, and test credentials."),
      { cause: error },
    );
  }
}

async function openDashboardPage(driver, path, heading) {
  await driver.get(`${baseUrl}${path}`);
  if (heading === "Good to see you") {
    await driver.wait(until.elementLocated(By.xpath("//h1[contains(normalize-space(), 'Good to see you')]")), 30_000, `${heading} page did not load.`);
  } else {
    await driver.wait(until.elementLocated(By.xpath(`//h1[normalize-space()='${heading}']`)), 30_000, `${heading} page did not load.`);
  }
}

test("Athena dashboard and all feature pages load", {
  skip: !email || !password ? "Set SELENIUM_EMAIL and SELENIUM_PASSWORD to run authenticated browser tests." : false,
}, async (t) => {
  const driver = await createDriver();
  try {
    await login(driver);
    for (const [path, heading] of [
      ["/dashboard", "Good to see you"],
      ["/dashboard/tasks", "Tasks"],
      ["/dashboard/calendar", "Calendar"],
      ["/dashboard/timer", "Focus Timer"],
      ["/dashboard/resources", "Resources"],
      ["/dashboard/groups", "Study Groups"],
      ["/dashboard/nemo", "Nemo"],
    ]) {
      await t.test(`${heading} page renders`, async () => {
        await openDashboardPage(driver, path, heading);
      });
    }
  } finally {
    await driver.quit();
  }
});

test("global search supports quick navigation and empty results", {
  skip: !email || !password ? "Set SELENIUM_EMAIL and SELENIUM_PASSWORD to run authenticated browser tests." : false,
}, async () => {
  const driver = await createDriver();
  try {
    await login(driver);
    await openDashboardPage(driver, "/dashboard", "Good to see you");
    const search = await driver.findElement(By.id("athena-global-search"));
    await search.sendKeys("resources");
    const quickNavigation = await driver.wait(until.elementLocated(By.xpath("//button[.//*[normalize-space()='Open resources']]")), 5_000);
    await quickNavigation.click();
    await driver.wait(until.urlContains("/dashboard/resources"), 10_000);

    await openDashboardPage(driver, "/dashboard", "Good to see you");
    const taskSearch = await driver.findElement(By.id("athena-global-search"));
    await taskSearch.sendKeys("selenium-no-match-9f81");
    await driver.wait(until.elementLocated(By.xpath("//*[@role='listbox']//*[contains(., 'No matches found') or contains(., 'No matches') ]")), 10_000);
  } finally {
    await driver.quit();
  }
});

test("task search and filters are interactive", {
  skip: !email || !password ? "Set SELENIUM_EMAIL and SELENIUM_PASSWORD to run authenticated browser tests." : false,
}, async () => {
  const driver = await createDriver();
  try {
    await login(driver);
    await openDashboardPage(driver, "/dashboard/tasks", "Tasks");
    const search = await driver.findElement(By.css('input[placeholder="Search tasks…"]'));
    await search.sendKeys("selenium-no-match-9f81");
    await driver.wait(until.elementLocated(By.xpath("//*[normalize-space()='No tasks found']")), 5_000);
    await search.clear();
    await driver.findElement(By.xpath("//button[starts-with(normalize-space(), 'Pending (')]")).click();
    await driver.findElement(By.xpath("//button[starts-with(normalize-space(), 'Done (')]")).click();
    await driver.findElement(By.xpath("//button[starts-with(normalize-space(), 'All (')]")).click();
    const selects = await driver.findElements(By.css("select"));
    assert.ok(selects.length >= 2, "Priority and sort filters should be available.");
  } finally {
    await driver.quit();
  }
});

test("calendar month navigation and connection settings work", {
  skip: !email || !password ? "Set SELENIUM_EMAIL and SELENIUM_PASSWORD to run authenticated browser tests." : false,
}, async () => {
  const driver = await createDriver();
  try {
    await login(driver);
    await openDashboardPage(driver, "/dashboard/calendar", "Calendar");
    const monthHeading = driver.findElement(By.css("h2"));
    const before = await monthHeading.getText();
    await driver.findElement(By.css('button[aria-label="Next month"]')).click();
    await driver.wait(async () => (await monthHeading.getText()) !== before, 5_000);
    await driver.findElement(By.css('button[aria-label="Previous month"]')).click();
    await driver.wait(until.elementTextIs(monthHeading, before), 5_000);
    await driver.findElement(By.css('button[aria-label="Show calendar connection settings"]')).click();
    await driver.wait(until.elementLocated(By.xpath("//*[normalize-space()='Google Calendar']")), 5_000);
    await driver.wait(until.elementLocated(By.xpath("//*[normalize-space()='Outlook']")), 5_000);
  } finally {
    await driver.quit();
  }
});

test("resource search and study group search are interactive", {
  skip: !email || !password ? "Set SELENIUM_EMAIL and SELENIUM_PASSWORD to run authenticated browser tests." : false,
}, async () => {
  const driver = await createDriver();
  try {
    await login(driver);
    await openDashboardPage(driver, "/dashboard/resources", "Resources");
    await driver.wait(async () => !(await driver.findElement(By.css('button[aria-label="Search resources"]')).isDisplayed()).catch(() => false), 10_000).catch(() => {});
    await driver.findElement(By.css('button[aria-label="Search resources"]')).click();
    const resourceSearch = await driver.wait(until.elementLocated(By.css('input[aria-label="Search resources"]')), 5_000);
    await resourceSearch.sendKeys("selenium-no-match-9f81");
    await driver.wait(async () => {
      const noMatch = await driver.findElements(By.xpath("//*[normalize-space()='No matching resources']"));
      const cards = await driver.findElements(By.css("article"));
      const skeletons = await driver.findElements(By.css(".animate-pulse"));
      return noMatch.length > 0 || (cards.length === 0 && skeletons.length === 0);
    }, 20_000, "Resource results did not settle after search.");

    await openDashboardPage(driver, "/dashboard/groups", "Study Groups");
    const groupSearch = await driver.findElement(By.css('input[placeholder="Search study groups…"]'));
    await groupSearch.sendKeys("selenium-no-match-9f81");
    await driver.wait(until.elementLocated(By.xpath("//*[normalize-space()='No matching study groups']")), 5_000);
    await driver.findElement(By.xpath("//button[normalize-space()='Join with code']")).click();
    await driver.wait(until.elementLocated(By.xpath("//*[normalize-space()='Join Study Group']")), 5_000);
    await driver.findElement(By.xpath("//button[normalize-space()='Cancel']")).click();
  } finally {
    await driver.quit();
  }
});

test("Focus Timer can choose, start, pause, resume, and reset without saving a session", {
  skip: !email || !password ? "Set SELENIUM_EMAIL and SELENIUM_PASSWORD to run authenticated browser tests." : false,
}, async () => {
  const driver = await createDriver();
  try {
    await login(driver);
    await openDashboardPage(driver, "/dashboard/timer", "Focus Timer");
    const timer = await driver.findElement(By.css('[data-testid="focus-timer"]'));
    const countdown = timer.findElement(By.css('[data-testid="focus-timer-countdown"]'));
    const status = timer.findElement(By.css('[data-testid="focus-timer-status"]'));
    await timer.findElement(By.xpath(".//button[normalize-space()='15 min']")).click();
    await driver.wait(until.elementTextIs(countdown, "15:00"), 2_000);
    const startButton = timer.findElement(By.xpath(".//button[normalize-space()='Start']"));
    assert.equal(await startButton.isEnabled(), true, "Start should be enabled while the timer is ready.");
    await startButton.click();
    try {
      await driver.wait(async () => (await status.getText()).trim().toLowerCase().startsWith("focusing"), 5_000);
    } catch (error) {
      const visibleStatus = await status.getText().catch(() => "unavailable");
      throw new Error(`Timer did not enter the focusing state after Start (visible status: ${visibleStatus}).`, { cause: error });
    }
    await driver.wait(async () => (await countdown.getText()) !== "15:00", 5_000, "Timer entered focusing state but countdown did not advance.");
    await timer.findElement(By.xpath(".//button[normalize-space()='Pause']")).click();
    await driver.wait(async () => (await status.getText()).trim().toLowerCase() === "paused", 5_000);
    await timer.findElement(By.xpath(".//button[normalize-space()='Resume']")).click();
    await driver.wait(async () => timer.findElement(By.xpath(".//button[normalize-space()='Pause']")).isEnabled(), 3_000);
    await timer.findElement(By.xpath(".//button[normalize-space()='Reset']")).click();
    await driver.wait(until.elementTextIs(countdown, "15:00"), 2_000);
    await driver.wait(async () => (await status.getText()).trim().toLowerCase() === "ready", 2_000);
  } finally {
    await driver.quit();
  }
});

test("Nemo suggestions work and its in-chat Pomodoro timer can start, pause, and reset", {
  skip: !email || !password ? "Set SELENIUM_EMAIL and SELENIUM_PASSWORD to run authenticated browser tests." : false,
}, async () => {
  const driver = await createDriver();
  try {
    await login(driver);
    await openDashboardPage(driver, "/dashboard/nemo", "Nemo");
    await driver.findElement(By.xpath("//button[normalize-space()='New chat']")).click();
    const prompt = await driver.wait(until.elementLocated(By.xpath("//button[normalize-space()='Start a 25-minute Pomodoro']")), 5_000);
    await prompt.click();
    const composer = await driver.findElement(By.css('textarea[placeholder="Message Nemo…"]'));
    assert.equal(await composer.getAttribute("value"), "Start a 25-minute Pomodoro");
    await composer.clear();

    const timerToggle = await driver.wait(until.elementLocated(By.css('button[aria-label="Toggle Pomodoro timer"]')), 10_000);
    await timerToggle.click();
    const timerPanel = await driver.wait(until.elementLocated(By.css('[aria-label="Pomodoro timer"]')), 5_000);
    await timerPanel.findElement(By.xpath(".//button[normalize-space()='15 min']")).click();
    const countdown = timerPanel.findElement(By.css('[data-testid="pomodoro-countdown"]'));
    await driver.wait(until.elementTextIs(countdown, "15:00"), 2_000);
    await timerPanel.findElement(By.xpath(".//button[normalize-space()='Start']")).click();
    await driver.wait(async () => (await countdown.getText()) !== "15:00", 3_000, "The countdown did not start.");
    await driver.wait(until.elementTextIs(timerPanel.findElement(By.css("p")), "Focusing"), 2_000);
    await timerPanel.findElement(By.xpath(".//button[normalize-space()='Pause']")).click();
    await driver.wait(until.elementTextIs(timerPanel.findElement(By.css("p")), "Paused"), 2_000);
    const pausedTime = await countdown.getText();
    await driver.sleep(1_200);
    assert.equal(await countdown.getText(), pausedTime, "The countdown should stop while paused.");
    await timerPanel.findElement(By.xpath(".//button[normalize-space()='Reset']")).click();
    await driver.wait(until.elementTextIs(countdown, "15:00"), 2_000);
    await driver.wait(until.elementTextIs(timerPanel.findElement(By.css("p")), "Choose a focus interval"), 2_000);
  } finally {
    await driver.quit();
  }
});
