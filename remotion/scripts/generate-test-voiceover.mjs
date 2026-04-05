import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const audioDir = path.resolve(__dirname, "../public/audio");
fs.mkdirSync(audioDir, { recursive: true });

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
if (!ELEVENLABS_API_KEY) {
  console.error("ELEVENLABS_API_KEY not set");
  process.exit(1);
}

const voiceId = "nPczCjzI2devNBz1zQrb"; // Brian

const segments = [
  {
    name: "video-1-midnight_pain",
    text: "凌晨三点，你崩溃大哭。不想打扰任何人，翻来覆去，越想越慌。",
  },
  {
    name: "video-1-midnight_quote",
    text: "晓晓说：凌晨三点崩溃大哭时，AI教练陪了我整整两个小时。",
  },
  {
    name: "video-1-midnight_outro",
    text: "有劲AI，24小时在线，随时接住你。",
  },
];

for (const seg of segments) {
  console.log(`Generating: ${seg.name}...`);
  const res = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}?output_format=mp3_44100_128`,
    {
      method: "POST",
      headers: {
        "xi-api-key": ELEVENLABS_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text: seg.text,
        model_id: "eleven_multilingual_v2",
        voice_settings: {
          stability: 0.75,
          similarity_boost: 0.75,
          style: 0.5,
          use_speaker_boost: true,
        },
      }),
    }
  );

  if (!res.ok) {
    const err = await res.text();
    console.error(`Failed ${seg.name}: ${res.status} ${err}`);
    process.exit(1);
  }

  const buf = Buffer.from(await res.arrayBuffer());
  const outPath = path.join(audioDir, `${seg.name}.mp3`);
  fs.writeFileSync(outPath, buf);
  console.log(`Saved: ${outPath} (${buf.length} bytes)`);
}

console.log("All voiceover segments generated!");
