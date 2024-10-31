import { Context, Schema, h } from 'koishi';
// npm publish --workspace koishi-plugin-asmr-lizard --access public --registry https://registry.npmjs.org
import { } from 'koishi-plugin-ffmpeg';
import { } from 'koishi-plugin-silk';

export const name = 'asmr-lizard';
export const inject = ['ffmpeg', 'silk'];

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
      } else {
      }

      const apiUrl = apis[type];

      try {
        const response = await ctx.http.get(apiUrl);
        const { title, cover, url } = response;

        const audioData = await ctx.http.get<ArrayBuffer>(url, { responseType: 'arraybuffer' });
        const buffer = Buffer.from(audioData);

        const durationBuffer = await ctx.ffmpeg.builder()
          .input(buffer)
          .outputOption('-f', 'null')
          .run('info');

        const durationOutput = durationBuffer.toString();
        const match = /Duration: (\d+):(\d+):(\d+\.\d+)/.exec(durationOutput);
        const duration = match ? (parseInt(match[1]) * 3600 + parseInt(match[2]) * 60 + parseFloat(match[3])) : 0;

        const coverResponse = await ctx.http.get(cover);
        await session.send(`${title}\n${h.image(coverResponse)}`);

        const maxSegmentDuration = 5 * 60;
        if (duration <= maxSegmentDuration) {
          const silkBuffer = await ctx.ffmpeg.builder()
            .input(buffer)
            .outputOption('-f', 'silk')
            .run('buffer');

          await session.send(h.audio(silkBuffer, 'audio/silk'));
        } else {
          await session.send('音频时长大于5分钟，将分段发送');
          const segmentCount = Math.ceil(duration / maxSegmentDuration);

          for (let i = 0; i < segmentCount; i++) {
            const startTime = i * maxSegmentDuration;

            const segmentBuffer = await ctx.ffmpeg.builder()
              .input(buffer)
              .inputOption('-ss', startTime.toString())
              .outputOption('-t', maxSegmentDuration.toString(), '-f', 'silk')
              .run('buffer');

            await session.send(h.audio(segmentBuffer, 'audio/silk'));
          }
        }

      } catch (error) {
        ctx.logger.error('请求失败', error.message);
        return '请求过程中出现错误，请稍后重试。';
      }
    });
}
