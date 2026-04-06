import { Composition } from "remotion";
import { VideoComposition } from "./VideoComposition";
import { CoverComposition } from "./covers/CoverComposition";
import { MidlifeCrisisHeyGen } from "./MidlifeCrisisHeyGen";
import { MidlifeStockVideo } from "./MidlifeStockVideo";

const VIDEOS = [
  {
    id: "video-1-midnight",
    painTitle: "凌晨3点",
    painSub: "你崩溃大哭",
    painDesc: "不想打扰任何人\n翻来覆去 越想越慌",
    quoteName: "晓晓",
    quoteIdentity: "24岁 · 研究生",
    quoteText: "凌晨三点崩溃大哭时\nAI教练陪了我整整两个小时",
    brandLine: "24小时在线 · 随时接住你",
    audioPrefix: "video-1-midnight",
  },
  {
    id: "video-2-feelings",
    painTitle: "老公说我矫情",
    painSub: "你的感受不被理解",
    painDesc: "委屈说不出口\n眼泪只能往肚子里咽",
    quoteName: "芳芳",
    quoteIdentity: "32岁 · 全职妈妈",
    quoteText: "AI教练说\n'你的感受是真实的'\n那一刻我终于被理解了",
    brandLine: "你的感受值得被听见",
  },
  {
    id: "video-3-wealth",
    painTitle: "赚得不少",
    painSub: "却存不下来",
    painDesc: "钱去了哪里？\n总觉得不够 却说不清为什么",
    quoteName: "大伟",
    quoteIdentity: "38岁 · 销售总监",
    quoteText: "做完财富信念测评\n才发现我一直在\n'配不上'的信念里打转",
    brandLine: "财富卡点测评 · 看见你的金钱信念",
  },
  {
    id: "video-4-parents",
    painTitle: "吵完架",
    painSub: "才发现在重复父母的模式",
    painDesc: "你骂孩子的样子\n像极了你的父母",
    quoteName: "丽姐",
    quoteIdentity: "42岁 · 两个孩子的妈妈",
    quoteText: "AI引导我看到了\n自己小时候被忽视的伤\n原来我在重复父母的模式",
    brandLine: "看见模式 打破循环",
  },
  {
    id: "video-5-career",
    painTitle: "35岁",
    painSub: "不知道该不该辞职",
    painDesc: "上面有老板 下面有房贷\n进退两难 越想越焦虑",
    quoteName: "阿明",
    quoteIdentity: "35岁 · 中层管理",
    quoteText: "被领导怼完\n躲在厕所用了5分钟呼吸练习\n整个人稳住了",
    brandLine: "任何情绪 它都在",
  },
];

const COVERS = [
  { id: "cover-1-midnight", title: "凌晨3点", subtitle: "谁能接住你的崩溃？", tag: "AI陪伴" },
  { id: "cover-2-feelings", title: "你的感受不是矫情", subtitle: "是真实的", tag: "AI理解" },
  { id: "cover-3-wealth", title: "为什么你总是\n存不下钱？", subtitle: "答案可能在这里", tag: "财富觉醒" },
  { id: "cover-4-parents", title: "你骂孩子的样子", subtitle: "像极了你的父母", tag: "模式觉察" },
  { id: "cover-5-career", title: "35岁", subtitle: "你还敢辞职吗？", tag: "职场觉醒" },
];

export const RemotionRoot = () => (
  <>
    {VIDEOS.map((v) => (
      <Composition
        key={v.id}
        id={v.id}
        component={VideoComposition}
        durationInFrames={480}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={v}
      />
    ))}
    {COVERS.map((c) => (
      <Composition
        key={c.id}
        id={c.id}
        component={CoverComposition}
        durationInFrames={1}
        fps={30}
        width={1080}
        height={1440}
        defaultProps={c}
      />
    ))}
    <Composition
      id="video-laoge-heygen"
      component={MidlifeCrisisHeyGen}
      durationInFrames={1650}
      fps={30}
      width={1080}
      height={1920}
    />
    <Composition
      id="video-midlife-stock"
      component={MidlifeStockVideo}
      durationInFrames={780}
      fps={30}
      width={1080}
      height={1920}
    />
  </>
);
