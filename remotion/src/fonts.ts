import { loadFont as loadNotoSerifSC } from "@remotion/google-fonts/NotoSerifSC";
import { loadFont as loadNotoSansSC } from "@remotion/google-fonts/NotoSansSC";

const serif = loadNotoSerifSC("normal", {
  weights: ["700", "900"],
});

const sans = loadNotoSansSC("normal", {
  weights: ["300", "400", "500", "600", "700"],
});

export const SERIF_FONT = serif.fontFamily;
export const SANS_FONT = sans.fontFamily;
