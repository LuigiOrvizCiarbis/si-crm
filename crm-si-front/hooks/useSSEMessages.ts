import { useEffect, useRef } from "react";
import { Message } from "@/data/types";
import { getPusher } from "@/lib/pusher";

interface UseReverbMessagesProps {
  conversationId: string | number | null;
  onMessage: (message: Message) => void;
}

export function useSSEMessages({
  conversationId,
  onMessage,
}: UseReverbMessagesProps) {
  const onMessageRef = useRef(onMessage);

  useEffect(() => {
    onMessageRef.current = onMessage;
  }, [onMessage]);

  useEffect(() => {
    if (!conversationId) return;

    const pusher = getPusher();
    const channel = pusher.subscribe(`private-conversations.${conversationId}`);

    channel.bind("message.sent", (data: Message) => {
      onMessageRef.current(data);
    });

    return () => {
      channel.unbind_all();
      pusher.unsubscribe(`private-conversations.${conversationId}`);
    };
  }, [conversationId]);
}
