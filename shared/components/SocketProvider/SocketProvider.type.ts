import type { ReactNode } from "react";
import type { ManagerOptions, SocketOptions } from "socket.io-client";

export type SocketProviderProps = {
  children: ReactNode;
  url?: string;
  options?: Partial<ManagerOptions & SocketOptions>;
};
