import { useEffect, useRef } from "react";
import { Message } from "@/data/types"; // Asegúrate de que este tipo coincida con tu modelo

interface UseSSEMessagesProps {
  conversationId: string | number | null;
  token: string | null; // Token de Sanctum
  onMessage: (message: Message) => void;
}

export function useSSEMessages({
  conversationId,
  token,
  onMessage,
}: UseSSEMessagesProps) {
  const eventSourceRef = useRef<EventSource | null>(null);
  // Guardamos el último ID para solicitar mensajes perdidos en caso de reconexión
  const lastMessageIdRef = useRef<number>(0);

  useEffect(() => {
    // Si no hay conversación seleccionada o no hay token, no conectamos
    if (!conversationId || !token) return;

    // Limpiar conexión anterior si cambia el ID
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    // Construir URL: usa el proxy de Next.js para evitar CORS
    const url = `/api/conversations/${conversationId}/stream?token=${token}&last_id=${lastMessageIdRef.current}`;


    const eventSource = new EventSource(url);
    eventSourceRef.current = eventSource;

    eventSource.addEventListener("message", (event) => {
      try {
        const newMessage = JSON.parse(event.data);

        if (newMessage.id) {
          lastMessageIdRef.current = newMessage.id;
        }

        onMessage(newMessage);
      } catch (error) {
        console.error("❌ SSE: Error parseando JSON", error);
      }
    });

    eventSource.onerror = (err) => {
      console.error("⚠️ SSE: Error de conexión", err);
      // EventSource intentará reconectar automáticamente.
      // Si es un error fatal (401/403), podrías querer cerrar la conexión aquí.
    };

    return () => {
      eventSource.close();
    };
  }, [conversationId, token, onMessage]);
}
