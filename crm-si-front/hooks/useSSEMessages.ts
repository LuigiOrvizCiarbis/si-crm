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

    // Construir URL: Backend + ID + Token + LastID
    // Nota: Ajusta la URL base según tu entorno (localhost:8000 o tu proxy API)
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
    const url = `${baseUrl}/api/conversations/${conversationId}/stream?token=${token}&last_id=${lastMessageIdRef.current}`;

    console.log(`🔌 SSE: Conectando a chat ${conversationId}...`);

    const eventSource = new EventSource(url);
    eventSourceRef.current = eventSource;

    eventSource.onopen = () => {
      console.log("🟢 SSE: Conexión establecida");
    };

    eventSource.addEventListener("message", (event) => {
      try {
        const newMessage = JSON.parse(event.data);
        console.log("📩 SSE: Mensaje recibido", newMessage);

        // Actualizar el puntero del último mensaje recibido
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
      console.log("🔌 SSE: Cerrando conexión...");
      eventSource.close();
    };
  }, [conversationId, token, onMessage]);
}
