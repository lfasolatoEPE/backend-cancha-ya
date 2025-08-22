import 'dotenv/config';

import { Queue, Worker, type JobsOptions, type Processor } from 'bullmq';
import IORedis from 'ioredis';
import { QUEUE_NOTIFS } from './events';

// Para log seguro (sin password)
function redact(url?: string) {
  try {
    if (!url) return 'undefined';
    const u = new URL(url);
    return `${u.protocol}//${u.hostname}:${u.port || ''}`;
  } catch {
    return 'invalid';
  }
}

const redisUrl = process.env.REDIS_URL ?? 'redis://127.0.0.1:6379';
const useTLS = redisUrl.startsWith('rediss://');

console.log('[REDIS] connecting to', redact(redisUrl));

const connection = new IORedis(redisUrl, {
  maxRetriesPerRequest: null,
  ...(useTLS ? { tls: {} } : {}), // TLS cuando es rediss://
});

export const notifQueue = new Queue(QUEUE_NOTIFS, { connection });

export function enqueue<T = any>(name: string, payload: T, opts?: JobsOptions) {
  return notifQueue.add(name, payload as any, opts);
}

export function makeWorker(processor: Processor) {
  return new Worker(QUEUE_NOTIFS, processor, { connection });
}