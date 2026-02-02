import { TwitterApi } from "twitter-api-v2";
import { config } from "../config/env";
import { RateLimiter } from "../utils/helpers";

export interface TwitterMention {
  id: string;
  authorId: string;
  text: string;
}

export class TwitterService {
  private client: TwitterApi;
  private userId: string;
  private limiter: RateLimiter;

  private constructor(client: TwitterApi, userId: string) {
    this.client = client;
    this.userId = userId;
    this.limiter = new RateLimiter(1500);
  }

  static async create(): Promise<TwitterService> {
    if (!config.twitter.enabled) {
      throw new Error("Twitter is disabled by configuration");
    }
    const client = new TwitterApi({
      appKey: config.twitter.apiKey,
      appSecret: config.twitter.apiSecret,
      accessToken: config.twitter.accessToken,
      accessSecret: config.twitter.accessSecret
    });
    const me = await client.v2.me();
    if (!me.data?.id) {
      throw new Error("Unable to resolve Twitter user id");
    }
    return new TwitterService(client, me.data.id);
  }

  async postTweet(text: string): Promise<string> {
    await this.limiter.wait();
    const response = await this.client.v2.tweet(text);
    return response.data.id;
  }

  async replyToTweet(text: string, replyToId: string): Promise<string> {
    await this.limiter.wait();
    const response = await this.client.v2.tweet({
      text,
      reply: { in_reply_to_tweet_id: replyToId }
    });
    return response.data.id;
  }

  async fetchMentions(sinceId?: string): Promise<TwitterMention[]> {
    await this.limiter.wait();
    const response = await this.client.v2.userMentionTimeline(this.userId, {
      since_id: sinceId,
      max_results: 20,
      "tweet.fields": ["author_id", "created_at", "text"]
    });

    const mentions = response.data?.data ?? [];
    return mentions.map((mention) => ({
      id: mention.id,
      authorId: mention.author_id || "",
      text: mention.text || ""
    }));
  }
}
