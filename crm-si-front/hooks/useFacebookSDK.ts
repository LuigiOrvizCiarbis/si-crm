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

      const handleMessage = (event: MessageEvent) => {
        if (!event.origin.endsWith("facebook.com")) return;

        try {
          const data = JSON.parse(event.data);
          if (data.type === "WA_EMBEDDED_SIGNUP") {
            console.log("WhatsApp Embedded Signup event:", data);

            // Persistimos el objeto 'data' que incluye waba_id, phone_number_id, etc.
            signupEventRef.current = data.data ?? null;

            // Si ya tenemos el code, enviamos ahora junto al 'data'
            if (codeRef.current && !sentRef.current) {
              sentRef.current = true;
              sendToBackend(
                codeRef.current,
                lastResponseRef.current,
                signupEventRef.current
              );
            }
          }
        } catch {
          // Puede venir como objeto ya parseado
          const raw: any = (event as any).data;
          if (
            raw &&
            typeof raw === "object" &&
            raw.type === "WA_EMBEDDED_SIGNUP"
          ) {
            console.log("WhatsApp Embedded Signup event (raw object):", raw);
            signupEventRef.current = raw.data ?? null;

            if (codeRef.current && !sentRef.current) {
              sentRef.current = true;
              sendToBackend(
                codeRef.current,
                lastResponseRef.current,
                signupEventRef.current
              );
            }
          } else if (typeof event.data === "string" && event.data.includes("&code=")) {
            const params = new URLSearchParams(event.data);
            const code = params.get("code");
            if (code) {
              console.log("Authorization code from message event:", code);
              codeRef.current = code;
              if (signupEventRef.current && !sentRef.current) {
                sentRef.current = true;
                sendToBackend(code, null, signupEventRef.current);
              } else {
                setTimeout(() => {
                  if (!sentRef.current && codeRef.current) {
                    sentRef.current = true;
                    sendToBackend(codeRef.current, null, signupEventRef.current);
                  }
                }, 4000);
              }
            }
          } else {
            console.log("Facebook message event:", event.data);
          }
        }
      };

      window.addEventListener("message", handleMessage);
    };
  };

  const sendToBackend = async (
    code: string,
    response: any,
    signupData?: any
  ) => {
    try {
      const authStorage = localStorage.getItem("auth-storage");
      const token = authStorage ? JSON.parse(authStorage)?.state?.token : null;

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
          //type: "authorization",
          code: code,
          full_response: response,
          data: signupData ?? signupEventRef.current ?? null,
          waba_id: (signupData ?? signupEventRef.current)?.waba_id ?? null,
          phone_number_id:
            (signupData ?? signupEventRef.current)?.phone_number_id ?? null,
          business_id:
            (signupData ?? signupEventRef.current)?.business_id ?? null,
        }),
      });

      const data = await backendResponse.json();
      console.log("Backend response:", data);

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
    console.log("Facebook login response:", response);

    if (response.authResponse) {
      const code = response.authResponse.code;
      console.log("Authorization code received:", code);
      codeRef.current = code;
      lastResponseRef.current = response;

      // Si ya tenemos el evento, enviamos con 'data' ahora
      if (signupEventRef.current && !sentRef.current) {
        sentRef.current = true;
        sendToBackend(code, response, signupEventRef.current);
        return;
      }

      // Espera un poco más por si el evento llega con retraso; luego enviamos fallback
      setTimeout(() => {
        if (!sentRef.current) {
          sentRef.current = true;
          sendToBackend(
            codeRef.current as string,
            lastResponseRef.current,
            signupEventRef.current
          );
        }
      }, 4000);
    } else {
      console.log("User cancelled login or did not authorize:", response);
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
      },
    });
  };

  return {
    launchWhatsAppSignup,
    isFacebookSDKLoaded,
  };
};
