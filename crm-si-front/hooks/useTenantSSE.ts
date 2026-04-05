import { useEffect, useRef } from "react";
import { Message } from "@/data/types";
import { getPusher } from "@/lib/pusher";
import { useAuthStore } from "@/store/useAuthStore";

interface UseTenantReverbProps {
  onMessage: (message: Message) => void;
}

export function useTenantSSE({ onMessage }: UseTenantReverbProps) {
  const onMessageRef = useRef(onMessage);
  const tenantId = useAuthStore((s) => s.user?.tenant_id);

  useEffect(() => {
    onMessageRef.current = onMessage;
  }, [onMessage]);

  useEffect(() => {
    if (!tenantId) return;

    const pusher = getPusher();
    const channel = pusher.subscribe(`private-tenant.${tenantId}`);

    channel.bind("message.received", (data: Message) => {
      onMessageRef.current(data);
    });

    return () => {
      channel.unbind_all();
      pusher.unsubscribe(`private-tenant.${tenantId}`);
    };
  }, [tenantId]);
}
