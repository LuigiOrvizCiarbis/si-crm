"use client";

import { useState, useEffect, useRef } from "react";

declare global {
  interface Window {
    FB: any;
    fbAsyncInit: () => void;
  }
}

export const useFacebookSDK = () => {
  const [isFacebookSDKLoaded, setIsFacebookSDKLoaded] = useState(false);
  const signupEventRef = useRef<any>(null);
  const lastResponseRef = useRef<any>(null);
  const codeRef = useRef<string | null>(null);
  const sentRef = useRef<boolean>(false);
  const debugEnabled = process.env.NEXT_PUBLIC_WHATSAPP_DEBUG === "1";

  useEffect(() => {
    loadFacebookSDK();
  }, []);

  const loadFacebookSDK = () => {
    if (document.getElementById("facebook-jssdk")) {
      setIsFacebookSDKLoaded(true);
      return;
    }

    const script = document.createElement("script");
    script.id = "facebook-jssdk";
    script.src = "https://connect.facebook.net/en_US/sdk.js";
    script.async = true;
    script.defer = true;
    script.crossOrigin = "anonymous";

    document.head.appendChild(script);

    window.fbAsyncInit = function () {
      window.FB.init({
        appId: process.env.NEXT_PUBLIC_FACEBOOK_APP_ID,
        autoLogAppEvents: true,
        xfbml: true,
        version: process.env.NEXT_PUBLIC_FACEBOOK_GRAPH_API_VERSION,
      });

      setIsFacebookSDKLoaded(true);

      const logDebug = (...args: any[]) => {
        if (debugEnabled) {
          console.info("[WA Embedded Signup]", ...args);
        }
      };

      const handleEmbeddedEvent = (payload: any) => {
        if (!payload || payload.type !== "WA_EMBEDDED_SIGNUP") return;

        signupEventRef.current = payload;
        logDebug("Event recibido:", payload.event, payload);

        // Solo enviamos al backend cuando el onboarding terminó exitosamente.
        if (payload.event === "FINISH_WHATSAPP_BUSINESS_APP_ONBOARDING") {
          if (codeRef.current && !sentRef.current) {
            sentRef.current = true;
            sendToBackend(
              codeRef.current,
              lastResponseRef.current,
              signupEventRef.current
            );
          }
          return;
        }

        if (payload.event === "CANCEL") {
          console.warn(
            "[WA Embedded Signup] Flujo cancelado/abortado en paso:",
            payload?.data?.current_step ?? "desconocido"
          );
        }
      };

      const handleMessage = (event: MessageEvent) => {
        if (!event.origin.endsWith("facebook.com")) return;

        try {
          const data = JSON.parse(event.data);
          handleEmbeddedEvent(data);
        } catch {
          const raw: any = (event as any).data;
          if (
            raw &&
            typeof raw === "object" &&
            raw.type === "WA_EMBEDDED_SIGNUP"
          ) {
            handleEmbeddedEvent(raw);
          } else if (typeof event.data === "string" && event.data.includes("&code=")) {
            const params = new URLSearchParams(event.data);
            const code = params.get("code");
            if (code) {
              codeRef.current = code;
              if (
                signupEventRef.current?.event === "FINISH_WHATSAPP_BUSINESS_APP_ONBOARDING" &&
                !sentRef.current
              ) {
                sentRef.current = true;
                sendToBackend(code, null, signupEventRef.current);
              } else {
                setTimeout(() => {
                  if (!sentRef.current && codeRef.current) {
                    console.warn(
                      "[WA Embedded Signup] No llegó FINISH en 6s. Enviando fallback al backend."
                    );
                    sentRef.current = true;
                    sendToBackend(codeRef.current, null, signupEventRef.current);
                  }
                }, 6000);
              }
            }
          } else {
            console.warn("Received non-JSON message from Facebook:", event.data);}
        }
      };

      window.addEventListener("message", handleMessage);
    };
  };

  const sendToBackend = async (
    code: string,
    response: any,
    signupPayload?: any
  ) => {
    try {
      const authStorage = localStorage.getItem("auth-storage");
      const token = authStorage ? JSON.parse(authStorage)?.state?.token : null;
      const embeddedEvent = signupPayload ?? signupEventRef.current ?? null;
      const embeddedData = embeddedEvent?.data ?? null;

      if (!token) {
        throw new Error("No authentication token found");
      }
      const backendResponse = await fetch(`/api/whatsapp-auth`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          code: code,
          full_response: response,
          data: embeddedData,
          embedded_signup_event: embeddedEvent?.event ?? null,
          embedded_signup_version: embeddedEvent?.version ?? null,
          waba_id: embeddedData?.waba_id ?? null,
          phone_number_id: embeddedData?.phone_number_id ?? null,
          business_id: embeddedData?.business_id ?? null,
        }),
      });

      const data = await backendResponse.json();

      if (data.success) {
      } else {
        throw new Error(data.message || "Error al conectar");
      }
    } catch (error) {
      console.error("Error enviando datos al backend:", error);
    }
  };

  // Response callback - debe ser síncrono
  const fbLoginCallback = (response: any) => {

    if (response.authResponse) {
      const code = response.authResponse.code;
      codeRef.current = code;
      lastResponseRef.current = response;

      // Si ya tenemos el evento, enviamos con 'data' ahora
      if (
        signupEventRef.current?.event === "FINISH_WHATSAPP_BUSINESS_APP_ONBOARDING" &&
        !sentRef.current
      ) {
        sentRef.current = true;
        sendToBackend(code, response, signupEventRef.current);
        return;
      }

      // Si no llega FINISH, enviamos de todos modos como fallback para no perder el code
      setTimeout(() => {
        if (!sentRef.current && codeRef.current) {
          console.warn(
            "[WA Embedded Signup] No llegó FINISH en 6s tras login callback. Enviando fallback al backend."
          );
          sentRef.current = true;
          sendToBackend(
            codeRef.current as string,
            lastResponseRef.current,
            signupEventRef.current
          );
        }
      }, 6000);
    } else {
      console.warn("Facebook login cancelled or failed:", response);
    }
  };

  // Launch method and callback registration
  const launchWhatsAppSignup = () => {
    if (!window.FB) {
      return;
    }

    window.FB.login(fbLoginCallback, {
      config_id: process.env.NEXT_PUBLIC_FACEBOOK_CONFIGURATION_ID,
      response_type: "code",
      override_default_response_type: true,
      extras: {
        setup: {},
        featureType: "whatsapp_business_app_onboarding",
        sessionInfoVersion: "3",
      },
    });
  };

  return {
    launchWhatsAppSignup,
    isFacebookSDKLoaded,
  };
};
