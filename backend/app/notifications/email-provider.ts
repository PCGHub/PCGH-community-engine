/**
 * Email delivery scaffolding. "Email provider" is explicitly listed as
 * a *Future* External Integration (docs/backend-architecture.md,
 * "External Integrations"), not an approved current vendor -- this is
 * an interface plus an unconfigured stub, not a real integration,
 * matching the same pattern already used for the AI Service
 * (app/ai/client.ts). Selecting a vendor is an Architecture Change
 * Lifecycle decision, not made here.
 *
 * `to` is a recipient user id, not an email address -- resolving a
 * user id to a deliverable address is left to a real provider
 * implementation once one is chosen; it is not solved by this stub.
 */

export interface EmailDeliveryResult {
  readonly delivered: boolean;
  readonly reason?: string;
}

export interface EmailProvider {
  isConfigured(): boolean;
  send(to: string, subject: string, body: string): Promise<EmailDeliveryResult>;
}

export function getEmailProvider(): EmailProvider {
  return {
    isConfigured: () => false,
    send: async () => ({
      delivered: false,
      reason: 'No email provider configured -- Future External Integration, pending an Architecture Change Lifecycle decision.',
    }),
  };
}
