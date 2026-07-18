export function getPipelineProgress(stage: string): number {
  const normalized = stage.toLowerCase().trim();

  if (normalized.includes("prescreen")) return 5;

  if (normalized.includes("information"))
    return 15;

  if (normalized.includes("contact"))
    return 20;

  if (
    normalized.includes("work") ||
    normalized.includes("prepar")
  )
    return 45;

  if (
    normalized.includes("review") &&
    !normalized.includes("change")
  )
    return 70;

  if (normalized.includes("change"))
    return 80;

  if (normalized.includes("signature"))
    return 90;

  if (normalized.includes("ready"))
    return 95;

  if (
    normalized.includes("filed") ||
    normalized.includes("sent")
  )
    return 100;

  return 0;
}

export function getProgressColor(progress: number): string {
  if (progress <= 25)
    return "bg-red-500";

  if (progress <= 75)
    return "bg-yellow-500";

  return "bg-green-500";
}