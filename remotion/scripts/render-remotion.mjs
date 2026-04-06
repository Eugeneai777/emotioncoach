import { bundle } from "@remotion/bundler";
import { renderMedia, renderStill, selectComposition, openBrowser } from "@remotion/renderer";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const videoIds = [
  "video-1-midnight",
  "video-2-feelings",
  "video-3-wealth",
  "video-4-parents",
  "video-5-career",
];

const coverIds = [
  "cover-1-midnight",
  "cover-2-feelings",
  "cover-3-wealth",
  "cover-4-parents",
  "cover-5-career",
];

const videoFilenames = [
  "video_1_midnight.mp4",
  "video_2_feelings.mp4",
  "video_3_wealth.mp4",
  "video_4_parents.mp4",
  "video_5_career.mp4",
];

const coverFilenames = [
  "cover_1_midnight.png",
  "cover_2_feelings.png",
  "cover_3_wealth.png",
  "cover_4_parents.png",
  "cover_5_career.png",
];

console.log("Bundling...");
const bundled = await bundle({
  entryPoint: path.resolve(__dirname, "../src/index.ts"),
  webpackOverride: (config) => config,
});

console.log("Opening browser...");
const browser = await openBrowser("chrome", {
  browserExecutable: process.env.PUPPETEER_EXECUTABLE_PATH ?? "/bin/chromium",
  chromiumOptions: {
    args: ["--no-sandbox", "--disable-gpu", "--disable-dev-shm-usage"],
  },
  chromeMode: "chrome-for-testing",
});

// Render only what's requested via CLI args, or everything
const target = process.argv[2]; // "videos", "covers", "all", or a specific id

async function renderVideo(id, filename) {
  console.log(`Rendering ${id}...`);
  const composition = await selectComposition({ serveUrl: bundled, id, puppeteerInstance: browser });
  await renderMedia({
    composition,
    serveUrl: bundled,
    codec: "h264",
    outputLocation: `/mnt/documents/${filename}`,
    puppeteerInstance: browser,
    muted: true,
    concurrency: 1,
  });
  console.log(`Done: /mnt/documents/${filename}`);
}

async function renderCover(id, filename) {
  console.log(`Rendering ${id}...`);
  const composition = await selectComposition({ serveUrl: bundled, id, puppeteerInstance: browser });
  await renderStill({
    composition,
    serveUrl: bundled,
    output: `/mnt/documents/${filename}`,
    puppeteerInstance: browser,
  });
  console.log(`Done: /mnt/documents/${filename}`);
}

try {
  if (!target || target === "all" || target === "covers") {
    for (let i = 0; i < coverIds.length; i++) {
      await renderCover(coverIds[i], coverFilenames[i]);
    }
  }

  if (!target || target === "all" || target === "videos") {
    for (let i = 0; i < videoIds.length; i++) {
      await renderVideo(videoIds[i], videoFilenames[i]);
    }
  }

  // Single target
  if (target && !["all", "videos", "covers"].includes(target)) {
    const vi = videoIds.indexOf(target);
    const ci = coverIds.indexOf(target);
    if (vi >= 0) await renderVideo(videoIds[vi], videoFilenames[vi]);
    else if (ci >= 0) await renderCover(coverIds[ci], coverFilenames[ci]);
    else {
      // Try as arbitrary composition ID
      const filename = target.replace(/-/g, "_") + ".mp4";
      await renderVideo(target, filename);
    }
  }
} finally {
  await browser.close({ silent: false });
}
