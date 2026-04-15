export const pricingRules = {
  baseVisitCost: 30,
  pricePerM2: 12,
  wallConditionMultiplier: {
    good: 1,
    medium: 1.2,
    bad: 1.5,
  },
} as const;
