// AWS SQS integration wrapper.
// When AWS credentials + a queue URL are configured, messages are sent to the real
// SQS queue. Otherwise the app runs in sandbox mode (in-memory queue) so the whole
// platform works offline. Unit tested in test/awsSqsClient.test.ts.

import { SQSClient, SendMessageCommand, ReceiveMessageCommand } from '@aws-sdk/client-sqs';

export interface SqsSendResult {
  mode: 'LIVE' | 'SANDBOX';
  simulated: boolean;
  messageId: string;
  region: string | null;
  status: 'DELIVERED_TO_AWS_SQS' | 'SIMULATED_LOCAL_DISPATCH';
}

let cachedClient: SQSClient | null = null;

export function isSqsConfigured(): boolean {
  const queueUrl = process.env.AWS_SQS_QUEUE_URL;
  const region = process.env.AWS_REGION;
  const hasCreds = Boolean(process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY);
  return Boolean(queueUrl && region && hasCreds);
}

function getClient(): SQSClient {
  if (!cachedClient) {
    cachedClient = new SQSClient({
      region: process.env.AWS_REGION || 'us-east-1',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!
      }
    });
  }
  return cachedClient;
}

export async function sendToSqs(message: Record<string, unknown>): Promise<SqsSendResult> {
  if (!isSqsConfigured()) {
    return {
      mode: 'SANDBOX',
      simulated: true,
      messageId: `sim-${Date.now()}`,
      region: null,
      status: 'SIMULATED_LOCAL_DISPATCH'
    };
  }

  const client = getClient();
  const queueUrl = process.env.AWS_SQS_QUEUE_URL!;

  const command = new SendMessageCommand({
    QueueUrl: queueUrl,
    MessageBody: JSON.stringify(message),
    MessageAttributes: {
      service: { DataType: 'String', StringValue: 'carbon-devops' },
      enqueuedAt: { DataType: 'String', StringValue: new Date().toISOString() }
    }
  });

  const result = await client.send(command);
  return {
    mode: 'LIVE',
    simulated: false,
    messageId: result.MessageId ?? `aws-${Date.now()}`,
    region: process.env.AWS_REGION ?? null,
    status: 'DELIVERED_TO_AWS_SQS'
  };
}

export async function receiveFromSqs(maxNumberOfMessages = 10): Promise<Record<string, unknown>[]> {
  if (!isSqsConfigured()) {
    return [];
  }

  const command = new ReceiveMessageCommand({
    QueueUrl: process.env.AWS_SQS_QUEUE_URL!,
    MaxNumberOfMessages: maxNumberOfMessages,
    WaitTimeSeconds: 1
  });

  const result = await getClient().send(command);
  return (result.Messages ?? []).map((m) => {
    try {
      return JSON.parse(m.Body ?? '{}');
    } catch {
      return { rawBody: m.Body };
    }
  });
}

export function getSqsIntegrationStatus(): { mode: 'LIVE' | 'SANDBOX'; configured: boolean; queueUrl: string | null; region: string | null } {
  return {
    mode: isSqsConfigured() ? 'LIVE' : 'SANDBOX',
    configured: isSqsConfigured(),
    queueUrl: process.env.AWS_SQS_QUEUE_URL ?? null,
    region: process.env.AWS_REGION ?? null
  };
}