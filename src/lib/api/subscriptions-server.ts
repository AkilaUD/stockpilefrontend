import { serverGet } from "./server";
import type { Plan } from "./subscriptions";

/** SSR read of public subscription plans. */
export function getSubscriptionPlans(): Promise<Plan[]> {
  return serverGet<Plan[]>("/api/v1/subscriptions/plans");
}
