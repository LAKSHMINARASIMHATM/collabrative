declare module 'y-websocket/bin/utils.js' {
  import { WebSocket } from 'ws';
  import { IncomingMessage } from 'http';
  import { Doc } from 'yjs';

  export function setupWSConnection(
    conn: WebSocket,
    req: IncomingMessage,
    options?: {
      docName?: string;
      gc?: boolean;
      gcFilter?: (arg0: string, arg1: Doc) => boolean;
    }
  ): void;

  export function getYDoc(docName: string, gc?: boolean): Doc;
}
