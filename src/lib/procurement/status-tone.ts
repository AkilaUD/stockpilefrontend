import type { StatusTone } from "@/components/ui/status-pill";

/** Map wire quote statuses to register pills (status-first desk). */
export function quoteStatusTone(status: string): StatusTone {
  switch (status) {
    case "Accepted":
      return "success";
    case "Declined":
    case "Withdrawn":
      return "danger";
    case "Submitted":
    case "UnderReview":
      return "warning";
    case "Expired":
      return "neutral";
    default:
      return "neutral";
  }
}

/** Map wire order statuses to register pills. */
export function orderStatusTone(status: string): StatusTone {
  switch (status) {
    case "Completed":
    case "Delivered":
      return "success";
    case "Cancelled":
      return "danger";
    case "Pending":
    case "Processing":
    case "Confirmed":
      return "warning";
    default:
      return "neutral";
  }
}

/** Map supplier lead inbox statuses to register pills. */
export function leadStatusTone(status: string): StatusTone {
  const normalized = status.toLowerCase().replace(/\s+/g, "_");
  switch (normalized) {
    case "new":
    case "due_soon":
      return "warning";
    case "quoted":
    case "negotiating":
      return "info";
    case "won":
      return "success";
    case "lost":
      return "danger";
    case "follow_up":
      return "neutral";
    default:
      return "neutral";
  }
}
