declare module "lgtv2" {
  export interface LGTVOptions {
    url: string;
    timeout?: number;
    reconnect?: number | false;
    clientKey?: string;
    rejectUnauthorized?: boolean;
  }

  export default class LGTV {
    constructor(options: LGTVOptions);

    on(event: "connect", callback: () => void): void;
    on(event: "close", callback: () => void): void;
    on(event: "error", callback: (err: Error) => void): void;
    on(event: "prompt", callback: () => void): void;
    on(event: "connecting", callback: () => void): void;

    request(
      uri: string,
      payload: any,
      callback: (err: Error | null, response: any) => void,
    ): void;
    disconnect(): void;

    clientKey?: string;
  }
}
