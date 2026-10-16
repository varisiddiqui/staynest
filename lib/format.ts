const inr = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

export const formatINR = (amount: number) => inr.format(amount);

const dateFmt = new Intl.DateTimeFormat("en-IN", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "UTC", // booking dates are plain dates, so avoid timezone shifts
});

// "2026-10-20" -> "20 Oct 2026"
export const formatDate = (isoDate: string) =>
  dateFmt.format(new Date(`${isoDate}T00:00:00Z`));
