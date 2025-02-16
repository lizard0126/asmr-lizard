var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });
var __export = (target, all) => {
  for (var name2 in all)
    __defProp(target, name2, { get: all[name2], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/index.ts
var src_exports = {};
__export(src_exports, {
  Config: () => Config,
  apply: () => apply,
  inject: () => inject,
  name: () => name,
  usage: () => usage
});
module.exports = __toCommonJS(src_exports);
var import_koishi = require("koishi");
var name = "asmr-lizard";
var inject = ["ffmpeg"];
var Config = import_koishi.Schema.object({
  sendMode: import_koishi.Schema.union(["voice", "file"]).default("file").description("音频发送方式，voice为语音消息，file为文件。")
});
var usage = `
# 🌙 助眠音频插件使用指南
## 提供多种类型的助眠音频，包括钢琴、雨声、脑波、自然等，让您享受深度放松与安眠。

---

<details>
<summary><strong><span style="font-size: 1.3em; color: #2a2a2a;">使用方法</span></strong></summary>

### 通过类型获取助眠音频
#### 示例：
<pre style="background-color: #f4f4f4; padding: 10px; border-radius: 4px; border: 1px solid #ddd;">助眠 钢琴 // 获取钢琴音乐</pre>
<pre style="background-color: #f4f4f4; padding: 10px; border-radius: 4px; border: 1px solid #ddd;">助眠 雨声 // 获取雨声音频</pre>
<pre style="background-color: #f4f4f4; padding: 10px; border-radius: 4px; border: 1px solid #ddd;">助眠 随机 // 随机获取一种类型的音频</pre>

### 注意事项：
- 当音频长度超过 5 分钟时，会分段发送。
- 支持语音和文件两种发送方式，使用配置项选择。
</details>

<details>
<summary><strong><span style="font-size: 1.3em; color: #2a2a2a;">如果要反馈建议或报告问题</span></strong></summary>

<strong>可以[点这里](https://github.com/lizard0126/asmr-lizard/issues)创建议题~</strong>
</details>

<details>
<summary><strong><span style="font-size: 1.3em; color: #2a2a2a;">如果喜欢我的插件</span></strong></summary>

<strong>可以[请我喝可乐](https://ifdian.net/a/lizard0126)，没准就有动力更新新功能了~</strong>
</details>
`;
var apis = {
  "钢琴": "https://www.hhlqilongzhu.cn/api/ximalaya/ximalaya_gangqin.php",
  "雨声": "https://www.hhlqilongzhu.cn/api/ximalaya/ximalaya_rain.php",
  "脑波": "https://www.hhlqilongzhu.cn/api/ximalaya/ximalaya_naobo.php",
  "自然": "https://www.hhlqilongzhu.cn/api/ximalaya/ximalaya_daziran.php",
  "故事": "https://www.hhlqilongzhu.cn/api/ximalaya/ximalaya_gushi.php"
};
async function fetchImage(ctx, url, referer) {
  const imageBuffer = await ctx.http.get(url, {
    headers: { referer },
    responseType: "arraybuffer"
  });
  return `data:image/jpeg;base64,${Buffer.from(imageBuffer).toString("base64")}`;
}
__name(fetchImage, "fetchImage");
function apply(ctx) {
  ctx.command("助眠 [type]", "获取助眠音频，包括小故事").action(async ({ session }, type) => {
    const config = ctx.config;
    const sendAsVoice = config.sendMode === "voice";
    if (!type) return "提供以下类型：钢琴、雨声、脑波、自然、故事，输入随机则随机获取。";
    if (type === "随机") {
      const keys = Object.keys(apis);
      type = keys[Math.floor(Math.random() * keys.length)];
    }
    const apiUrl = apis[type];
    if (!apiUrl) return "提供以下类型：钢琴、雨声、脑波、自然、故事，输入随机则随机获取。";
    try {
      const { title, cover, url } = await ctx.http.get(apiUrl, { timeout: 1e4 });
      const audioData = await ctx.http.get(url, { responseType: "arraybuffer" });
      const buffer = Buffer.from(audioData);
      const durationBuffer = await ctx.ffmpeg.builder().input(buffer).outputOption("-f", "null").run("info");
      const durationOutput = durationBuffer.toString();
      const match = /Duration: (\d+):(\d+):(\d+\.\d+)/.exec(durationOutput);
      const duration = match ? parseInt(match[1]) * 3600 + parseInt(match[2]) * 60 + parseFloat(match[3]) : 0;
      const imageBase64 = await fetchImage(ctx, cover, apiUrl);
      await session.send(`${title}
${import_koishi.h.image(imageBase64)}`);
      const maxSegmentDuration = 5 * 60;
      const [tipMessageId] = await session.send("正在获取音频，请耐心等待");
      const sendAudio = /* @__PURE__ */ __name(async (audioBuffer) => {
        if (sendAsVoice) {
          await session.send(import_koishi.h.audio(audioBuffer, "voice/mp3"));
        } else {
          await session.send(import_koishi.h.file(audioBuffer, "audio/mp3", { title: `${title}.mp3` }));
        }
      }, "sendAudio");
      if (sendAsVoice) {
        if (duration <= maxSegmentDuration) {
          await sendAudio(buffer);
          await session.bot.deleteMessage(session.channelId, tipMessageId);
        } else {
          const segmentCount = Math.ceil(duration / maxSegmentDuration);
          await session.send(`音频时长大于5分钟，将分${segmentCount}段发送。`);
          for (let i = 0; i < segmentCount; i++) {
            const startTime = i * maxSegmentDuration;
            const segmentBuffer = await ctx.ffmpeg.builder().input(buffer).inputOption("-ss", startTime.toString()).outputOption("-t", maxSegmentDuration.toString(), "-f", "mp3").run("buffer");
            const maxRetries = 3;
            let attempts = 0;
            let sent = false;
            while (attempts < maxRetries && !sent) {
              try {
                await sendAudio(segmentBuffer);
                sent = true;
              } catch (error) {
                attempts++;
                await session.send(`发送第 ${i + 1} 段音频失败，正在重试...（尝试次数: ${attempts}）`);
                if (attempts === maxRetries) await session.send(`第 ${i + 1} 段音频发送失败。`);
              }
            }
          }
          await session.bot.deleteMessage(session.channelId, tipMessageId);
        }
      } else {
        await sendAudio(buffer);
        await session.bot.deleteMessage(session.channelId, tipMessageId);
      }
    } catch (error) {
      ctx.logger.error("请求失败", error);
      return "请求过程中出现错误，请稍后重试。";
    }
  });
}
__name(apply, "apply");
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  Config,
  apply,
  inject,
  name,
  usage
});
