describe("Budgets", () => {
  beforeEach(() => {
    cy.login("test1234");
    cy.visit("/budgets");
  });

  it("renders the budgets page", () => {
    cy.get("h1").should("contain", "Pressupostos");
  });

  it("navigates to new budget page", () => {
    cy.contains("a", "Nou pressupost").click();
    cy.url().should("include", "/budgets/nou");
  });

  it("redirects unauthenticated user to /login", () => {
    cy.clearCookie("auth_session");
    cy.visit("/budgets");
    cy.url().should("include", "/login");
  });
});
