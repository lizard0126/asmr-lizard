import { Context, Schema } from 'koishi';
export declare const name = "asmr-lizard";
export declare const inject: string[];
export interface Config {
}
export declare const Config: Schema<Schemastery.ObjectS<{}>, Schemastery.ObjectT<{}>>;
export declare const usage = "\n- \u83B7\u53D6\u4EE5\u4E0B\u7C7B\u578B\u7684\u52A9\u7720\u97F3\u9891\uFF1A\u94A2\u7434\u3001\u96E8\u58F0\u3001\u8111\u6CE2\u3001\u81EA\u7136\n\n- \u8FD8\u6709\u7761\u524D\u6545\u4E8B\u54E6~\n\n- \u5982\u679C\u662F\u6BD4\u8F83\u957F\u7684\u97F3\u9891\u4F1A\u5206\u6BB5\u53D1\u9001~\n---\n<details>\n<summary>\u5982\u679C\u8981\u53CD\u9988\u5EFA\u8BAE\u6216\u62A5\u544A\u95EE\u9898</summary>\n\n\u53EF\u4EE5[\u70B9\u8FD9\u91CC](https://github.com/lizard0126/asmr-lizard/issues)\u521B\u5EFA\u8BAE\u9898~\n</details>\n<details>\n<summary>\u5982\u679C\u559C\u6B22\u6211\u7684\u63D2\u4EF6</summary>\n\n\u53EF\u4EE5[\u8BF7\u6211\u559D\u53EF\u4E50](https://ifdian.net/a/lizard0126)\uFF0C\u6CA1\u51C6\u5C31\u6709\u52A8\u529B\u66F4\u65B0\u65B0\u529F\u80FD\u4E86~\n</details>\n";
export declare function apply(ctx: Context): void;
