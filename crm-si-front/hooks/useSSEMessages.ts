import { useEffect, useRef } from "react";
import { Message } from "@/data/types";
import { getPusher } from "@/lib/pusher";

interface UseReverbMessagesProps {
  conversationId: string | number | null;
  onMessage: (message: Message) => void;
  onEdited?: (message: Message) => void;
  onDeleted?: (data: { id: number; conversation_id: number }) => void;
}

export function useSSEMessages({
  conversationId,
  onMessage,
  onEdited,
  onDeleted,
}: UseReverbMessagesProps) {
  const onMessageRef = useRef(onMessage);
  const onEditedRef = useRef(onEdited);
  const onDeletedRef = useRef(onDeleted);

  useEffect(() => {
    onMessageRef.current = onMessage;
  }, [onMessage]);

  useEffect(() => {
    onEditedRef.current = onEdited;
  }, [onEdited]);

  useEffect(() => {
    onDeletedRef.current = onDeleted;
  }, [onDeleted]);

  useEffect(() => {
    if (!conversationId) return;

    const pusher = getPusher();
    const channel = pusher.subscribe(`private-conversations.${conversationId}`);

    channel.bind("message.sent", (data: Message) => {
      onMessageRef.current(data);
    });

    channel.bind("message.edited", (data: Message) => {
      onEditedRef.current?.(data);
    });

    channel.bind("message.deleted", (data: { id: number; conversation_id: number }) => {
      onDeletedRef.current?.(data);
    });

    return () => {
      channel.unbind_all();
      pusher.unsubscribe(`private-conversations.${conversationId}`);
    };
  }, [conversationId]);
}
