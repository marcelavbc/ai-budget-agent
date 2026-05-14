Cypress.Commands.add("login", (password: string) => {
  if (password === "test1234") {
    cy.setCookie("auth_session", "1");
    cy.visit("/");
    return;
  }

  cy.intercept("POST", "/api/auth/login", {
    statusCode: 401,
    body: { error: "Contrasenya incorrecta" },
  }).as("loginRequest");

  cy.visit("/login");
  cy.get('input[type="password"]').type(password);
  cy.get('button[type="submit"]').click();
  cy.wait("@loginRequest");
});

Cypress.Commands.add("interceptGroq", (fixtureName: string) => {
  cy.intercept("POST", "/api/generate-budget-draft", (req) => {
    req.reply({ fixture: fixtureName });
  }).as("generateDraft");
});
