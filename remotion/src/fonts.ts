import { loadFont as loadNotoSerifSC } from "@remotion/google-fonts/NotoSerifSC";
import { loadFont as loadNotoSansSC } from "@remotion/google-fonts/NotoSansSC";

const { fontFamily: serifFamily } = loadNotoSerifSC("normal", {
  weights: ["400", "700", "900"],
  subsets: ["chinese-simplified"],
});

const { fontFamily: sansFamily } = loadNotoSansSC("normal", {
  weights: ["300", "400", "500", "600", "700"],
  subsets: ["chinese-simplified"],
});

export const SERIF_FONT = serifFamily;
export const SANS_FONT = sansFamily;
