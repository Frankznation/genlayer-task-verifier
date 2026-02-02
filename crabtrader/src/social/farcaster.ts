import { config } from "../config/env";
import { RateLimiter } from "../utils/helpers";

export interface FarcasterMention {
  id: string;
  author: string;
  text: string;
}

interface NeynarCastResponse {
  cast?: { hash?: string };
}

export class FarcasterService {
  private limiter: RateLimiter;

  constructor() {
    if (!config.farcaster.enabled) {
      throw new Error("Farcaster is disabled by configuration");
    }
    this.limiter = new RateLimiter(1200);
  }

  private headers() {
    return {
      "Content-Type": "application/json",
      "api_key": config.farcaster.neynarApiKey
    } as Record<string, string>;
  }

  async postCast(text: string): Promise<string> {
    await this.limiter.wait();
    const response = await fetch("https://api.neynar.com/v2/farcaster/cast", {
      method: "POST",
      headers: this.headers(),
      body: JSON.stringify({
        signer_uuid: config.farcaster.signerUuid,
        text
      })
    });
    if (!response.ok) {
      const body = await response.text();
      throw new Error(`Neynar postCast error: ${response.status} ${body}`);
    }
    const json = (await response.json()) as NeynarCastResponse;
    return json.cast?.hash ?? "";
  }

  async replyToCast(text: string, parentHash: string): Promise<string> {
    await this.limiter.wait();
    const response = await fetch("https://api.neynar.com/v2/farcaster/cast", {
      method: "POST",
      headers: this.headers(),
      body: JSON.stringify({
        signer_uuid: config.farcaster.signerUuid,
        text,
        parent: parentHash
      })
    });
    if (!response.ok) {
      const body = await response.text();
      throw new Error(`Neynar reply error: ${response.status} ${body}`);
    }
    const json = (await response.json()) as NeynarCastResponse;
    return json.cast?.hash ?? "";
  }

  async fetchMentions(): Promise<FarcasterMention[]> {
    if (!config.farcaster.fid) return [];
    await this.limiter.wait();
    const url = `https://api.neynar.com/v2/farcaster/notifications?fid=${config.farcaster.fid}&limit=20`;
    const response = await fetch(url, { headers: this.headers() });
    if (!response.ok) {
      const body = await response.text();
      throw new Error(`Neynar notifications error: ${response.status} ${body}`);
    }
    const json = (await response.json()) as {
      notifications?: Array<{
        type?: string;
        cast?: { hash?: string; text?: string; author?: { username?: string } };
      }>;
    };

    const notifications = json.notifications ?? [];
    return notifications
      .filter((item) => item.type === "mention")
      .map((item) => ({
        id: item.cast?.hash ?? "",
        author: item.cast?.author?.username ?? "unknown",
        text: item.cast?.text ?? ""
      }))
      .filter((item) => item.id);
  }
}
