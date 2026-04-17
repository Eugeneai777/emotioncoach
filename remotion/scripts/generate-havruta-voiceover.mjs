import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const audioDir = path.resolve(__dirname, "../public/audio");
fs.mkdirSync(audioDir, { recursive: true });

const SUPABASE_URL = "https://vlsuzskvykddwrxbmcbu.supabase.co";
const ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZsc3V6c2t2eWtkZHdyeGJtY2J1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI4Mzg2NjQsImV4cCI6MjA3ODQxNDY2NH0.pYilMaNu2_EQvn4HrfIpAGxomkQCQCdPPLMq5NPv3pk";

// 男声沉稳款 - 豆包 zh_male_qingcang_mars_bigtts (沉稳磁性男声)
const VOICE = "zh_male_qingcang_mars_bigtts";

const segments = [
  { name: "havruta-01", text: "凌晨两点，你又一次睁眼到天亮。脑子里翻来覆去那点事，没人聊，也聊不清。" },
  { name: "havruta-02", text: "中年人的难，从来不是没答案，是没人陪你把问题问透。" },
  { name: "havruta-03", text: "海沃塔，源自犹太人两千年的学习传统。一种提问式的深度对话。" },
  { name: "havruta-04", text: "不灌输，不评判。只用追问，把彼此真实的想法逼出来。" },
  { name: "havruta-05", text: "第一步，倾听。不打断，不预判。" },
  { name: "havruta-06", text: "第二步，追问。用'为什么'、'然后呢'代替建议。" },
  { name: "havruta-07", text: "第三步，挑战。善意地戳破回避。" },
  { name: "havruta-08", text: "第四步，共识。不必赢，只求看见。" },
  { name: "havruta-09", text: "7天有劲训练营，每晚21点，4到6人一组，戴西老师领读。这一次，不再一个人扛。" },
];

for (const seg of segments) {
  console.log(`Generating: ${seg.name}...`);
  const res = await fetch(`${SUPABASE_URL}/functions/v1/volcengine-tts`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "apikey": ANON_KEY,
      "Authorization": `Bearer ${ANON_KEY}`,
    },
    body: JSON.stringify({ text: seg.text, voice_type: VOICE }),
  });

  if (!res.ok) {
    const errText = await res.text();
    console.error(`Failed ${seg.name}: ${res.status} ${errText}`);
    process.exit(1);
  }

  const data = await res.json();
  if (data.error) {
    console.error(`API error for ${seg.name}:`, data.error);
    process.exit(1);
  }

  const buf = Buffer.from(data.audioContent, "base64");
  const outPath = path.join(audioDir, `${seg.name}.mp3`);
  fs.writeFileSync(outPath, buf);
  console.log(`Saved: ${outPath} (${buf.length} bytes)`);
}

console.log("All Havruta voiceover segments generated!");
