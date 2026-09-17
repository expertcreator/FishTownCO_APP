import { env } from "@/shared/constants";
import {
  getTokenCacheSnapshot,
  hydrateSessionTokens,
  subscribeTokenCache,
} from "@/shared/stores/secureSessionStorage";
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { io, Socket } from "socket.io-client";
import type { SocketProviderProps } from "./SocketProvider.type";

type SocketContextValue = {
  socket: Socket | null;
  isConnected: boolean;
};

const SocketContext = createContext<SocketContextValue | null>(null);

/** Same rules as `env.socketUrl` (variant + EXPO_PUBLIC_*_SOCKET_URL or API origin). */
const DEFAULT_SOCKET_URL = env.socketUrl.replace(/\/+$/, "");

export const SocketProvider = ({
  children,
  url = DEFAULT_SOCKET_URL,
  options,
}: SocketProviderProps) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const optionsRef = useRef(options);

  /** Re-run socket effect on login/logout/hydrate so we connect with the current token. */
  const authTokenSnapshot = useSyncExternalStore(
    subscribeTokenCache,
    getTokenCacheSnapshot,
    getTokenCacheSnapshot
  );

  useEffect(() => {
    optionsRef.current = options;
  }, [options]);

  /** Load Secure Store into memory as soon as the provider mounts (before root layout finishes fonts, etc.). */
  useEffect(() => {
    hydrateSessionTokens().catch(() => {});
  }, []);

  useEffect(() => {
    if (!url) {
      setSocket(null);
      setIsConnected(false);
      return;
    }

    const [sessionPart, guestPart] = authTokenSnapshot.split("\u0000");
    const sessionId = sessionPart || guestPart || null;

    // Backend requires sessionId - don't connect without it
    if (!sessionId) {
      // Clean up any existing socket
      setSocket((prevSocket) => {
        if (prevSocket) {
          prevSocket.disconnect();
        }
        return null;
      });
      setIsConnected(false);
      return;
    }

    // Validate sessionId is not empty string
    if (sessionId.trim() === "") {
      setSocket((prevSocket) => {
        if (prevSocket) {
          prevSocket.disconnect();
        }
        return null;
      });
      setIsConnected(false);
      return;
    }

    // Try both formats - backend might expect 'sessionId' or 'token'
    const instance = io(url, {
      transports: ["websocket"],
      auth: {
        token: sessionId,
        sessionId, // Some backends expect this format
      },
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      autoConnect: true, // Explicitly enable auto-connect
      ...optionsRef.current,
    });

    const handleConnect = () => {
      setIsConnected(true);
    };

    const handleDisconnect = () => {
      setIsConnected(false);
    };

    const handleConnectError = () => {
      setIsConnected(false);
    };

    const handleReconnectAttempt = () => {
      // Reconnection in progress
    };

    const handleReconnectFailed = () => {
      setIsConnected(false);
    };

    instance.on("connect", handleConnect);
    instance.on("disconnect", handleDisconnect);
    instance.on("connect_error", handleConnectError);
    instance.on("reconnect_attempt", handleReconnectAttempt);
    instance.on("reconnect_failed", handleReconnectFailed);

    setSocket(instance);

    return () => {
      instance.off("connect", handleConnect);
      instance.off("disconnect", handleDisconnect);
      instance.off("connect_error", handleConnectError);
      instance.disconnect();
      setSocket(null);
      setIsConnected(false);
    };
  }, [url, authTokenSnapshot]);

  const value = useMemo(() => ({ socket, isConnected }), [socket, isConnected]);

  return (
    <SocketContext.Provider value={value}>{children}</SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error("useSocket must be used within a SocketProvider");
  }
  return context;
};

export default SocketProvider;
