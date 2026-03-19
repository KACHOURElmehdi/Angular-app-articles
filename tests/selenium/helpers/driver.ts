import { Builder, By, until, WebDriver } from 'selenium-webdriver';
import * as chrome from 'selenium-webdriver/chrome';
import * as firefox from 'selenium-webdriver/firefox';
import { seleniumConfig } from '../config';
import * as chromedriver from 'chromedriver';
import * as geckodriver from 'geckodriver';

export const SELECTOR = By; // small alias to keep page objects concise

export async function buildDriver(): Promise<WebDriver> {
  const { browser, headless, implicitWaitMs } = seleniumConfig;

  if (browser === 'firefox') {
    const options = new firefox.Options();
    if (headless) options.headless();
    const driver = await new Builder()
      .forBrowser('firefox')
      .setFirefoxService(new firefox.ServiceBuilder((geckodriver as any).path))
      .setFirefoxOptions(options)
      .build();
    if (implicitWaitMs) await driver.manage().setTimeouts({ implicit: implicitWaitMs });
    return driver;
  }

  // default to chrome
  const options = new chrome.Options().addArguments('--window-size=1366,768', '--disable-gpu', '--no-sandbox');
  if (headless) {
    options.addArguments('--headless=new');
  }

  const driver = await new Builder()
    .forBrowser('chrome')
    .setChromeService(new chrome.ServiceBuilder((chromedriver as any).path))
    .setChromeOptions(options)
    .build();
  if (implicitWaitMs) await driver.manage().setTimeouts({ implicit: implicitWaitMs });
  return driver;
}

export async function waitForVisible(driver: WebDriver, locator: By, timeoutMs = seleniumConfig.defaultTimeoutMs) {
  const el = await driver.wait(until.elementLocated(locator), timeoutMs);
  await driver.wait(until.elementIsVisible(el), timeoutMs);
  return el;
}

export async function waitForText(
  driver: WebDriver,
  locator: By,
  text: string,
  timeoutMs = seleniumConfig.defaultTimeoutMs,
) {
  return driver.wait(until.elementTextContains(await waitForVisible(driver, locator, timeoutMs), text), timeoutMs);
}
