describe("Login", () => {
  it("disables submit button when password field is empty", () => {
    cy.visit("/login");
    cy.get('button[type="submit"]').should("be.disabled");
  });

  it("shows error message with wrong password", () => {
    cy.login("wrongpassword");
    cy.get('[role="alert"]').should("contain", "Contrasenya incorrecta");
  });

  it("redirects to home on successful login", () => {
    cy.login("test1234");
    cy.url().should("eq", `${Cypress.config("baseUrl")}/`);
  });
});
