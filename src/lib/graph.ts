/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Account {
  id: string;
  email: string;
  password: string;
  refreshToken: string;
  clientId: string;
  status: string;
  latestOtp: string;
  lastChecked: string;
  raw: string;
}

export interface GraphMessage {
  id: string;
  subject: string;
  bodyPreview: string;
  receivedDateTime: string;
  webLink: string;
  body: {
    contentType: 'text' | 'html';
    content: string;
  };
}

/**
 * Refreshes the Microsoft OAuth2 Access Token
 */
export async function refreshAccessToken(clientId: string, refreshToken: string): Promise<string> {
  const response = await fetch("/api/proxy/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      client_id: clientId,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    let errorMessage = `Auth Error (${response.status})`;
    try {
      const errorJson = JSON.parse(errorText);
      errorMessage = errorJson.error_description || errorJson.error || errorMessage;
    } catch (e) {
      // Not JSON
    }
    throw new Error(errorMessage);
  }

  const data = await response.json();
  return data.access_token;
}

/**
 * Fetches the latest 10 messages from Microsoft Graph via Proxy
 */
export async function fetchGraphInbox(accessToken: string): Promise<GraphMessage[]> {
  const response = await fetch("/api/proxy/messages", {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${accessToken}`,
      "Accept": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`API Error (${response.status})`);
  }

  const data = await response.json();
  return data.value || [];
}

/**
 * Extracts a 4-8 digit OTP from text
 */
export function extractOtp(text: string): string | null {
  const match = text.match(/\b\d{4,8}\b/);
  return match ? match[0] : null;
}
