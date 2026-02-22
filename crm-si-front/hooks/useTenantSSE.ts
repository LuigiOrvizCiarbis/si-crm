import { useEffect, useRef } from "react";
import { Message } from "@/data/types";

interface UseTenantSSEProps {
  token: string | null;
  onMessage: (message: Message) => void;
}

export function useTenantSSE({ token, onMessage }: UseTenantSSEProps) {
  const eventSourceRef = useRef<EventSource | null>(null);
  const onMessageRef = useRef(onMessage);

  useEffect(() => {
    onMessageRef.current = onMessage;
  }, [onMessage]);

  useEffect(() => {
    if (!token) return;

    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    const url = `/api/tenant/stream?token=${token}`;
    const eventSource = new EventSource(url);
    eventSourceRef.current = eventSource;

    eventSource.addEventListener("message", (event) => {
      try {
        const message = JSON.parse(event.data);
        onMessageRef.current(message);
      } catch (error) {
        console.error("Tenant SSE: error parsing", error);
      }
    });

    eventSource.onerror = () => {
      // EventSource auto-reconnects
    };

    return () => {
      eventSource.close();
    };
  }, [token]);
}
