import assert from "node:assert/strict";
import { after, before, describe, test } from "node:test";
import { Browser, Builder, By, until } from "selenium-webdriver";
import chrome from "selenium-webdriver/chrome.js";

const baseUrl = (process.env.SELENIUM_BASE_URL ?? "http://localhost:3000").replace(/\/$/, "");
const email = process.env.SELENIUM_EMAIL;
const password = process.env.SELENIUM_PASSWORD;
const missingCredentials = !email || !password;
const noMatch = "selenium-no-match-9f81";

let driver;

async function startBrowser() {
  const browser = process.env.SELENIUM_BROWSER ?? Browser.CHROME;
  const builder = new Builder().forBrowser(browser);

  if (browser === Browser.CHROME) {
    const options = new chrome.Options().addArguments("--disable-notifications", "--disable-background-networking");
    if (process.env.SELENIUM_HEADLESS === "1") {
      options.addArguments("--headless=new", "--disable-gpu", "--window-size=1440,1000");
    }
    builder.setChromeOptions(options);
  }

  const instance = await builder.build();
  await instance.manage().setTimeouts({ implicit: 0, pageLoad: 20_000, script: 10_000 });
  return instance;
}

async function signIn() {
  await driver.get(`${baseUrl}/login`);
  if (new URL(await driver.getCurrentUrl()).pathname !== "/login") return;

  await driver.findElement(By.name("email")).sendKeys(email);
  await driver.findElement(By.name("password")).sendKeys(password);
  await driver.findElement(By.xpath("//button[normalize-space()='Log in']")).click();

  try {
    await driver.wait(until.urlContains("/dashboard"), 15_000);
  } catch (cause) {
    const alerts = await driver.findElements(By.css('[role="alert"]'));
    const message = (await Promise.all(alerts.map((alert) => alert.getText()))).filter(Boolean).join(" | ");
    throw new Error(`Sign-in failed at ${await driver.getCurrentUrl()}${message ? `: ${message}` : ". Check the app server and test credentials."}`, { cause });
  }
}

async function openPage(path, heading) {
  await driver.get(`${baseUrl}${path}`);
  const title = await driver.wait(until.elementLocated(By.css("h1")), 20_000, `${path} did not render a page heading.`);
  await driver.wait(async () => (await title.getText()).includes(heading), 10_000, `${path} did not show “${heading}”.`);
}

async function waitForText(element, expected, timeout = 5_000) {
  await driver.wait(async () => (await element.getText()).trim().toLowerCase() === expected.toLowerCase(), timeout);
}

describe("Athena browser tests", { skip: missingCredentials ? "Set SELENIUM_EMAIL and SELENIUM_PASSWORD to run authenticated browser tests." : false }, () => {
  before(async () => {
    driver = await startBrowser();
    await signIn();
  });

  after(async () => {
    await driver?.quit();
  });

  test("dashboard and all feature pages render", async () => {
    for (const [path, heading] of [
      ["/dashboard", "Good to see you"],
      ["/dashboard/tasks", "Tasks"],
      ["/dashboard/calendar", "Calendar"],
      ["/dashboard/timer", "Focus Timer"],
      ["/dashboard/resources", "Resources"],
      ["/dashboard/groups", "Study Groups"],
      ["/dashboard/nemo", "Nemo"],
    ]) await openPage(path, heading);
  });

  test("global search navigates and shows empty results", async () => {
    await openPage("/dashboard", "Good to see you");
    const search = await driver.findElement(By.id("athena-global-search"));
    await search.sendKeys("resources");
    await driver.findElement(By.xpath("//button[.//*[normalize-space()='Open resources']]")).click();
    await driver.wait(until.urlContains("/dashboard/resources"), 10_000);

    await openPage("/dashboard", "Good to see you");
    await driver.findElement(By.id("athena-global-search")).sendKeys(noMatch);
    await driver.wait(until.elementLocated(By.xpath("//*[@role='listbox']//*[contains(., 'No matches found')]")), 10_000);
  });

  test("task search, status filters, priority, and sort controls work", async () => {
    await openPage("/dashboard/tasks", "Tasks");
    const search = await driver.findElement(By.css('input[placeholder="Search tasks…"]'));
    await search.sendKeys(noMatch);
    await driver.wait(until.elementLocated(By.xpath("//*[normalize-space()='No tasks found']")), 5_000);
    await search.clear();

    for (const label of ["Pending (", "Done (", "All ("]) {
      await driver.findElement(By.xpath(`//button[starts-with(normalize-space(), '${label}')]`)).click();
    }
    assert.ok((await driver.findElements(By.css("select"))).length >= 2, "Expected priority and sort controls.");
  });

  test("calendar month navigation and connection settings work", async () => {
    await openPage("/dashboard/calendar", "Calendar");
    const month = await driver.findElement(By.css("h2"));
    const currentMonth = await month.getText();

    await driver.findElement(By.css('button[aria-label="Next month"]')).click();
    await driver.wait(async () => (await month.getText()) !== currentMonth, 5_000);
    await driver.findElement(By.css('button[aria-label="Previous month"]')).click();
    await driver.wait(async () => (await month.getText()) === currentMonth, 5_000);

    await driver.findElement(By.css('button[aria-label="Show calendar connection settings"]')).click();
    for (const provider of ["Google Calendar", "Outlook"]) {
      await driver.wait(until.elementLocated(By.xpath(`//*[normalize-space()='${provider}']`)), 5_000);
    }
  });

  test("resource and study group searches and join dialog work", async () => {
    await openPage("/dashboard/resources", "Resources");
    await driver.wait(async () => (await driver.findElements(By.css(".animate-pulse"))).length === 0, 10_000, "Resources did not finish loading.");
    await driver.findElement(By.css('button[aria-label="Search resources"]')).click();
    await driver.findElement(By.css('input[aria-label="Search resources"]')).sendKeys(noMatch);
    await driver.wait(until.elementLocated(By.xpath("//*[normalize-space()='No matching resources']")), 15_000);

    await openPage("/dashboard/groups", "Study Groups");
    await driver.findElement(By.css('input[placeholder="Search study groups…"]')).sendKeys(noMatch);
    await driver.wait(until.elementLocated(By.xpath("//*[normalize-space()='No matching study groups']")), 5_000);
    await driver.findElement(By.xpath("//button[normalize-space()='Join with code']")).click();
    await driver.wait(until.elementLocated(By.xpath("//*[normalize-space()='Join Study Group']")), 5_000);
    await driver.findElement(By.xpath("//button[normalize-space()='Cancel']")).click();
  });

  test("Focus Timer starts, pauses, resumes, and resets", async () => {
    await openPage("/dashboard/timer", "Focus Timer");
    const timer = await driver.findElement(By.css('[data-testid="focus-timer"]'));
    const countdown = timer.findElement(By.css('[data-testid="focus-timer-countdown"]'));
    const status = timer.findElement(By.css('[data-testid="focus-timer-status"]'));

    await timer.findElement(By.xpath(".//button[normalize-space()='15 min']")).click();
    await driver.wait(until.elementTextIs(countdown, "15:00"), 2_000);
    await timer.findElement(By.xpath(".//button[normalize-space()='Start']")).click();
    await driver.wait(async () => (await status.getText()).toLowerCase().includes("focusing"), 5_000, "Start did not enter the focusing state.");
    await driver.wait(async () => (await countdown.getText()) !== "15:00", 5_000, "Countdown did not advance.");

    await timer.findElement(By.xpath(".//button[normalize-space()='Pause']")).click();
    await waitForText(status, "Paused");
    const pausedAt = await countdown.getText();
    await new Promise((resolve) => setTimeout(resolve, 1_100));
    assert.equal(await countdown.getText(), pausedAt, "Countdown should remain still while paused.");

    await timer.findElement(By.xpath(".//button[normalize-space()='Resume']")).click();
    await driver.wait(async () => timer.findElement(By.xpath(".//button[normalize-space()='Pause']")).isEnabled(), 3_000);
    await timer.findElement(By.xpath(".//button[normalize-space()='Reset']")).click();
    await driver.wait(until.elementTextIs(countdown, "15:00"), 2_000);
    await waitForText(status, "Ready", 2_000);
  });

  test("Nemo suggestions and in-chat Pomodoro timer work", async () => {
    await openPage("/dashboard/nemo", "Nemo");
    await driver.findElement(By.xpath("//button[normalize-space()='New chat']")).click();
    await driver.findElement(By.xpath("//button[normalize-space()='Start a 25-minute Pomodoro']")).click();
    const composer = await driver.findElement(By.css('textarea[placeholder="Message Nemo…"]'));
    assert.equal(await composer.getAttribute("value"), "Start a 25-minute Pomodoro");
    await composer.clear();

    await driver.findElement(By.css('button[aria-label="Toggle Pomodoro timer"]')).click();
    const panel = await driver.findElement(By.css('[aria-label="Pomodoro timer"]'));
    await panel.findElement(By.xpath(".//button[normalize-space()='15 min']")).click();
    const countdown = panel.findElement(By.css('[data-testid="pomodoro-countdown"]'));
    const status = panel.findElement(By.css("p"));
    await driver.wait(until.elementTextIs(countdown, "15:00"), 2_000);

    await panel.findElement(By.xpath(".//button[normalize-space()='Start']")).click();
    await driver.wait(async () => (await countdown.getText()) !== "15:00", 3_000, "Chat timer did not start.");
    await waitForText(status, "Focusing", 2_000);
    await panel.findElement(By.xpath(".//button[normalize-space()='Pause']")).click();
    await waitForText(status, "Paused", 2_000);
    const pausedAt = await countdown.getText();
    await new Promise((resolve) => setTimeout(resolve, 1_100));
    assert.equal(await countdown.getText(), pausedAt, "Chat timer should remain still while paused.");

    await panel.findElement(By.xpath(".//button[normalize-space()='Reset']")).click();
    await driver.wait(until.elementTextIs(countdown, "15:00"), 2_000);
    await waitForText(status, "Choose a focus interval", 2_000);
  });
});
