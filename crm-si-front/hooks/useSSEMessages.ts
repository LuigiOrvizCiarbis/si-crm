import { useEffect, useRef } from "react";
import { Message } from "@/data/types";

interface UseSSEMessagesProps {
  conversationId: string | number | null;
  token: string | null;
  onMessage: (message: Message) => void;
}

export function useSSEMessages({
  conversationId,
  token,
  onMessage,
}: UseSSEMessagesProps) {
  const eventSourceRef = useRef<EventSource | null>(null);
  const lastMessageIdRef = useRef<number>(0);
  const onMessageRef = useRef(onMessage);

  useEffect(() => {
    onMessageRef.current = onMessage;
  }, [onMessage]);

  useEffect(() => {
    if (!conversationId || !token) return;

    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    const url = `/api/conversations/${conversationId}/stream?token=${token}&last_id=${lastMessageIdRef.current}`;
    const eventSource = new EventSource(url);
    eventSourceRef.current = eventSource;

    eventSource.addEventListener("message", (event) => {
      try {
        const newMessage = JSON.parse(event.data);

        if (newMessage.id) {
          lastMessageIdRef.current = newMessage.id;
        }

        onMessageRef.current(newMessage);
      } catch (error) {
        console.error("SSE: Error parsing JSON", error);
      }
    });

    eventSource.onerror = () => {
      // EventSource auto-reconnects
    };

    return () => {
      eventSource.close();
    };
  }, [conversationId, token]);
}
