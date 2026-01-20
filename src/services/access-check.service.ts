// async function allows(tenantId: number, featureKey: string): Promise<boolean> {
//   const entitlement = await entitlementService.getFeatureEntitlement(tenantId, featureKey)

//   if (!entitlement) return false

//   if (entitlement.unlimited) return true

//   return entitlement.used < entitlement.limit
// }
// class EntitlementService {
//   constructor(
//     private billingRepo,
//     private usageRepo,
//     private ledgerRepo
//   ) {}

//   async getFeatureEntitlement(tenantId: number, featureKey: string) {
//     const planFeature = await this.billingRepo.getActivePlanFeature(tenantId, featureKey)

//     if (!planFeature) return null

//     if (planFeature.included_units === -1) {
//       return { unlimited: true }
//     }

//     const used = await this.usageRepo.getUsageForCurrentPeriod(tenantId, featureKey)

//     const credits = await this.ledgerRepo.getAvailableCredits(tenantId, featureKey)

//     return {
//       unlimited: false,
//       limit: planFeature.included_units + credits,
//       used,
//     }
//   }
// }

// if (!(await allows(tenantId, "ai_chat"))) {
//   throw new ForbiddenError("Limit exceeded")
// }

// await usageService.recordUsage({
//   tenantId,
//   featureKey: "ai_chat",
//   units: 1,
//   idempotencyKey,
// })
export {}
