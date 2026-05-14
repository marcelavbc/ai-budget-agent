describe("Home", () => {
  beforeEach(() => {
    cy.login("test1234");
  });

  it("renders the dashboard page", () => {
    cy.get("h1").should("contain", "Tauler");
  });

  it("renders the budgets section", () => {
    cy.get("#section-budgets").should("contain", "Pressupostos");
  });

  it("renders the invoices section", () => {
    cy.get("#section-invoices").should("contain", "Factures");
  });

  it("navigates to /budgets from 'Veure tots' link", () => {
    cy.contains("a", "Veure tots").click();
    cy.url().should("include", "/budgets");
  });

  it("navigates to /invoices from 'Veure totes' link", () => {
    cy.contains("a", "Veure totes").click();
    cy.url().should("include", "/invoices");
  });

  it("redirects unauthenticated user to /login", () => {
    cy.clearCookie("auth_session");
    cy.visit("/");
    cy.url().should("include", "/login");
  });
  it("shows filter bar", () => {
    cy.get('[aria-label="Filtres de data"]').should("exist");
  });

  it("filters by year and updates URL", () => {
    cy.get('[data-cy="year-toggle"]').click();
    cy.url().should("include", "year=");
  });

  it("opens month picker on trigger click", () => {
    cy.get('[aria-haspopup="dialog"]').click();
    cy.get('[role="dialog"]').should("be.visible");
  });

  it("selects a month and updates URL", () => {
    cy.get('[aria-haspopup="dialog"]').click();
    cy.get('[role="dialog"]').within(() => {
      cy.contains("button", "Abr").click();
    });
    cy.url().should("include", "month=4");
  });

  it("clears month filter", () => {
    cy.visit("/?month=4");
    cy.get('[aria-haspopup="dialog"]').click();
    cy.get('[role="dialog"]').within(() => {
      cy.contains("button", "Netejar").click();
    });
    cy.url().should("not.include", "month=");
  });
});
