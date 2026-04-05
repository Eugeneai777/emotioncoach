import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const audioDir = path.resolve(__dirname, "../public/audio");
fs.mkdirSync(audioDir, { recursive: true });

const SUPABASE_URL = "https://vlsuzskvykddwrxbmcbu.supabase.co";
const ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZsc3V6c2t2eWtkZHdyeGJtY2J1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI4Mzg2NjQsImV4cCI6MjA3ODQxNDY2NH0.pYilMaNu2_EQvn4HrfIpAGxomkQCQCdPPLMq5NPv3pk";

const segments = [
  { name: "video-1-midnight_pain", text: "凌晨三点，你崩溃大哭。不想打扰任何人，翻来覆去，越想越慌。" },
  { name: "video-1-midnight_quote", text: "晓晓说：凌晨三点崩溃大哭时，AI教练陪了我整整两个小时。" },
  { name: "video-1-midnight_outro", text: "有劲AI，24小时在线，随时接住你。" },
];

for (const seg of segments) {
  console.log(`Generating: ${seg.name}...`);
  const res = await fetch(`${SUPABASE_URL}/functions/v1/text-to-speech`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "apikey": ANON_KEY,
      "Authorization": `Bearer ${ANON_KEY}`,
    },
    body: JSON.stringify({ text: seg.text }),
  });

  if (!res.ok) {
    console.error(`Failed ${seg.name}: ${res.status} ${await res.text()}`);
    process.exit(1);
  }

  const data = await res.json();
  const buf = Buffer.from(data.audioContent, "base64");
  const outPath = path.join(audioDir, `${seg.name}.mp3`);
  fs.writeFileSync(outPath, buf);
  console.log(`Saved: ${outPath} (${buf.length} bytes)`);
}

console.log("All voiceover segments generated!");
