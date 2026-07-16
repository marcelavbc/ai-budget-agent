describe("New budget", () => {
  beforeEach(() => {
    cy.login("test1234");
    cy.visit("/budgets/nou");
  });

  it("renders the new budget page", () => {
    cy.get("h1").should("contain", "Nou pressupost");
  });

  it("shows validation error when description is empty", () => {
    cy.get('button[type="submit"]').click();
    cy.get('[role="alert"]').should("contain", "Escriu una descripció");
  });

  it("generates draft lines from AI response", () => {
    cy.interceptGroq("groq-draft-simple");
    cy.get('textarea[aria-label="Descripció del treball"]').type(
      "Pintar menjador 20m²"
    );
    cy.get('button[type="submit"]').click();
    cy.wait("@generateDraft");
    cy.contains("Pintura de parets i sostre").should("exist");
  });

  it("shows 'Generar pressupost' button after lines are added", () => {
    cy.interceptGroq("groq-draft-simple");
    cy.get('textarea[aria-label="Descripció del treball"]').type(
      "Pintar menjador 20m²"
    );
    cy.get('button[type="submit"]').click();
    cy.wait("@generateDraft");
    cy.contains("button", "Generar pressupost").should("exist");
  });

  it("navigates to draft view after clicking 'Generar pressupost'", () => {
    cy.interceptGroq("groq-draft-simple");
    cy.get('textarea[aria-label="Descripció del treball"]').type(
      "Pintar menjador 20m²"
    );
    cy.get('button[type="submit"]').click();
    cy.wait("@generateDraft");
    cy.contains("button", "Generar pressupost").click();
    cy.get('input[name="nameOrCompany"]').should("exist");
  });
  it("does not show 'Generar pressupost' when lines have pending prices", () => {
    cy.interceptGroq("groq-draft-pending");
    cy.get('textarea[aria-label="Descripció del treball"]').type(
      "Reparar esquerdes"
    );
    cy.get('button[type="submit"]').click();
    cy.wait("@generateDraft");
    cy.contains("button", "Generar pressupost").should("not.exist");
  });

  it("shows price per sqm slider", () => {
    cy.get('input[type="range"]#price-per-sqm').should("exist");
  });

  it("updates price per sqm when slider changes", () => {
    cy.interceptGroq("groq-draft-simple");
    cy.get('textarea[aria-label="Descripció del treball"]').type(
      "Pintar menjador 20m²"
    );
    cy.get('button[type="submit"]').click();
    cy.wait("@generateDraft");
    cy.setSliderValue('input[type="range"]#price-per-sqm', 18);
    cy.contains("18 €").should("exist");
  });
  it("renders option group card when AI returns alternative lines", () => {
    cy.interceptGroq("groq-draft-options");
    cy.get('textarea[aria-label="Descripció del treball"]').type(
      "Passamà opció 1 decapat o opció 2 esmalt"
    );
    cy.get('button[type="submit"]').click();
    cy.wait("@generateDraft");
    cy.contains("Opcions alternatives").should("exist");
    cy.contains("Opció 1").should("exist");
    cy.contains("Opció 2").should("exist");
  });
});
