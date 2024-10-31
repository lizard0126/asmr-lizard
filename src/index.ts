import { Context, Schema, h } from 'koishi';
// npm publish --workspace koishi-plugin-asmr-lizard --access public --registry https://registry.npmjs.org
import { } from 'koishi-plugin-ffmpeg';

export const name = 'asmr-lizard';
export const inject = ['ffmpeg'];

export interface Config { }

export const Config = Schema.object({});

export const usage = `
- 获取以下类型的助眠音频：钢琴、雨声、脑波、自然

- 还有睡前故事哦~

- 如果是比较长的音频会分段发送~
`;

const apis = {
  '钢琴': 'https://www.hhlqilongzhu.cn/api/ximalaya/ximalaya_gangqin.php',
  '雨声': 'https://www.hhlqilongzhu.cn/api/ximalaya/ximalaya_rain.php',
  '脑波': 'https://www.hhlqilongzhu.cn/api/ximalaya/ximalaya_naobo.php',
  '自然': 'https://www.hhlqilongzhu.cn/api/ximalaya/ximalaya_daziran.php',
  '故事': 'https://www.hhlqilongzhu.cn/api/ximalaya/ximalaya_gushi.php',
};

export function apply(ctx: Context) {
  ctx.command('助眠 [type]', '获取助眠音频，包括小故事')
    .action(async ({ session }, type) => {
      if (!type) {
        return '提供以下类型：钢琴、雨声、脑波、自然、故事，或输入随机。';
      }

      if (type === '随机') {
        const keys = Object.keys(apis);
        type = keys[Math.floor(Math.random() * keys.length)];
      }

      const apiUrl = apis[type];
      if (!apiUrl) {
        return '提供以下类型：钢琴、雨声、脑波、自然、故事，或输入随机。';
      }

      try {
        const response = await ctx.http.get(apiUrl);
        const { title, cover, url } = response;

        // 获取音频数据
        const audioData = await ctx.http.get<ArrayBuffer>(url, { responseType: 'arraybuffer' });
        const buffer = Buffer.from(audioData);

        // 使用 FFmpeg 获取音频时长
        const durationBuffer = await ctx.ffmpeg.builder()
          .input(buffer)
          .outputOption('-f', 'null')
          .run('info');

        const durationOutput = durationBuffer.toString();
        const match = /Duration: (\d+):(\d+):(\d+\.\d+)/.exec(durationOutput);
        const duration = match ? (parseInt(match[1]) * 3600 + parseInt(match[2]) * 60 + parseFloat(match[3])) : 0;

        // 获取并发送封面图片
        const coverResponse = await ctx.http.get(cover);
        await session.send(`${title}\n${h.image(coverResponse)}`);

        const maxSegmentDuration = 5 * 60; // 最大段时长为5分钟
        if (duration <= maxSegmentDuration) {
          // 对于时长小于5分钟的音频，直接发送 MP3 格式
          await session.send(h.audio(buffer, 'audio/mp3'));
        } else {
          const segmentCount = Math.ceil(duration / maxSegmentDuration);
          await session.send(`音频时长大于5分钟，将分段发送，共 ${segmentCount} 段。`);

          for (let i = 0; i < segmentCount; i++) {
            const startTime = i * maxSegmentDuration;

            // 提取并转换每段为 MP3 格式
            const segmentBuffer = await ctx.ffmpeg.builder()
              .input(buffer)
              .inputOption('-ss', startTime.toString())
              .outputOption('-t', maxSegmentDuration.toString(), '-f', 'mp3')
              .run('buffer');

            // 发送每段音频
            await session.send(h.audio(segmentBuffer, 'audio/mp3'));
          }
        }
      } catch (error) {
        ctx.logger.error('请求失败', error.message);
        return '请求过程中出现错误，请稍后重试。';
      }
    });
}
