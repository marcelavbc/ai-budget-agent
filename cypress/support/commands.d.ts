/// <reference types="cypress" />

declare namespace Cypress {
  interface Chainable {
    login(password: string): Chainable<void>;
    interceptGroq(fixtureName: string): Chainable<void>;
    setSliderValue(selector: string, value: number): Chainable<void>;
  }
}
