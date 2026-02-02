// WhatsApp Cloud API integration
export interface WhatsAppMessage {
  id: string
  from: string
  to: string
  text: string
  timestamp: number
  type: "text" | "image" | "document"
  status: "sent" | "delivered" | "read" | "failed"
}

export interface WhatsAppContact {
  phone: string
  name?: string
  profile_name?: string
}

export class WhatsAppAPI {
  private accessToken: string
  private phoneNumberId: string
  private baseUrl = "https://graph.facebook.com/v18.0"

  constructor(accessToken: string, phoneNumberId: string) {
    this.accessToken = accessToken
    this.phoneNumberId = phoneNumberId
  }

  async sendMessage(to: string, message: string): Promise<WhatsAppMessage> {
    const response = await fetch(`${this.baseUrl}/${this.phoneNumberId}/messages`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to,
        type: "text",
        text: { body: message },
      }),
    })

    const data = await response.json()

    return {
      id: data.messages?.[0]?.id || "",
      from: this.phoneNumberId,
      to,
      text: message,
      timestamp: Date.now(),
      type: "text",
      status: "sent",
    }
  }

  async sendTemplate(to: string, templateName: string, parameters: string[] = []): Promise<WhatsAppMessage> {
    const response = await fetch(`${this.baseUrl}/${this.phoneNumberId}/messages`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to,
        type: "template",
        template: {
          name: templateName,
          language: { code: "es" },
          components:
            parameters.length > 0
              ? [
                  {
                    type: "body",
                    parameters: parameters.map((param) => ({ type: "text", text: param })),
                  },
                ]
              : [],
        },
      }),
    })

    const data = await response.json()

    return {
      id: data.messages?.[0]?.id || "",
      from: this.phoneNumberId,
      to,
      text: `Template: ${templateName}`,
      timestamp: Date.now(),
      type: "text",
      status: "sent",
    }
  }

  async getMessages(limit = 100): Promise<WhatsAppMessage[]> {
    // Mock implementation - in real app would fetch from webhook storage
    return []
  }

  async markAsRead(messageId: string): Promise<boolean> {
    const response = await fetch(`${this.baseUrl}/${this.phoneNumberId}/messages`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        status: "read",
        message_id: messageId,
      }),
    })

    return response.ok
  }
}

// Mock WhatsApp API for development
export const mockWhatsAppAPI = {
  sendMessage: async (to: string, message: string): Promise<WhatsAppMessage> => {
    await new Promise((resolve) => setTimeout(resolve, 1000)) // Simulate API delay
    return {
      id: `msg_${Date.now()}`,
      from: "+1234567890",
      to,
      text: message,
      timestamp: Date.now(),
      type: "text",
      status: "sent",
    }
  },

  sendTemplate: async (to: string, templateName: string): Promise<WhatsAppMessage> => {
    await new Promise((resolve) => setTimeout(resolve, 1000))
    return {
      id: `msg_${Date.now()}`,
      from: "+1234567890",
      to,
      text: `Template: ${templateName}`,
      timestamp: Date.now(),
      type: "text",
      status: "sent",
    }
  },
}
