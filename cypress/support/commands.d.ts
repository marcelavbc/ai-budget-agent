/// <reference types="cypress" />

declare namespace Cypress {
  interface Chainable<Subject = any> {
    /**
     * Custom login command.
     * @param password - password to use for login
     * @example cy.login('test1234')
     */
    login(password: string): Chainable<void>;
  }
}
