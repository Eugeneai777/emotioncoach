export function getPostPaymentRedirectPath(packageKey?: string | null, returnUrl?: string): string {
  const key = packageKey ?? "";

  if (key === "synergy_bundle" || key === "camp-emotion_stress_7") {
    return "/camp-intro/emotion_stress_7";
  }

  if (key === "wealth_synergy_bundle" || key === "camp-wealth_block_7") {
    return "/camp-intro/wealth_block_7";
  }

  if (key === "zhile_havruta_bundle") {
    return "/promo/zhile-havruta";
  }

  if (key === "zhile_coach_389") {
    return "/promo/zhile-coach";
  }

  if (key.startsWith("camp-")) {
    const campType = key.replace("camp-", "");
    if (campType) return `/camp-intro/${campType}`;
  }

  if (returnUrl && returnUrl.startsWith("/")) {
    return returnUrl;
  }

  return `${window.location.pathname}${window.location.search}`;
}
