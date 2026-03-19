import { WebDriver } from 'selenium-webdriver';
import { SELECTOR, waitForVisible } from '../helpers/driver';
import { seleniumConfig } from '../config';

export class LoginPage {
  constructor(private readonly driver: WebDriver) {}

  private get signInNav() {
    return SELECTOR.linkText('Sign in');
  }

  private get emailInput() {
    return SELECTOR.css('input[formcontrolname="email"]');
  }

  private get passwordInput() {
    return SELECTOR.css('input[formcontrolname="password"]');
  }

  private get submitButton() {
    return SELECTOR.css('button[type="submit"]');
  }

  private profileLink(username: string) {
    return SELECTOR.xpath(`//a[contains(@class,'nav-link') and normalize-space(text())='${username}']`);
  }

  async open(): Promise<void> {
    await this.driver.get(`${seleniumConfig.baseUrl}/#/`);
  }

  async goToLogin(): Promise<void> {
    const link = await waitForVisible(this.driver, this.signInNav);
    await link.click();
    await waitForVisible(this.driver, this.emailInput);
  }

  async login(email: string, password: string): Promise<void> {
    const emailField = await waitForVisible(this.driver, this.emailInput);
    await emailField.clear();
    await emailField.sendKeys(email);

    const passwordField = await waitForVisible(this.driver, this.passwordInput);
    await passwordField.clear();
    await passwordField.sendKeys(password);

    const submit = await waitForVisible(this.driver, this.submitButton);
    await submit.click();
  }

  async assertLoggedIn(username: string): Promise<void> {
    await waitForVisible(this.driver, this.profileLink(username));
  }
}
