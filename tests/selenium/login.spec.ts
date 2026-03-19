import { expect } from 'chai';
import { WebDriver } from 'selenium-webdriver';
import { buildDriver } from './helpers/driver';
import { LoginPage } from './page-objects/login.page';

describe('Selenium UI - Login flow', function () {
  this.timeout(45000); // allow driver startup + navigation

  let driver: WebDriver;
  let loginPage: LoginPage;

  // Use bracket access (repo enables noPropertyAccessFromIndexSignature).
  const email = process.env['DEMO_EMAIL'] ?? 'demo@example.com';
  const password = process.env['DEMO_PASSWORD'] ?? 'password';
  const username = process.env['DEMO_USERNAME'] ?? 'demo';

  before(async () => {
    driver = await buildDriver();
    loginPage = new LoginPage(driver);
  });

  after(async () => {
    if (driver) {
      await driver.quit();
    }
  });

  it('logs in and shows the profile link', async () => {
    await loginPage.open();
    await loginPage.goToLogin();
    await loginPage.login(email, password);
    await loginPage.assertLoggedIn(username);

    const title = await driver.getTitle();
    expect(title.toLowerCase()).to.include('conduit');
  });
});
