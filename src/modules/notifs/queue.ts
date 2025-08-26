import 'dotenv/config';
import type { JobsOptions, Processor } from 'bullmq';

// ⚠️ Importamos las clases de bullmq solo si está habilitado
const NOTIFS_ENABLED = process.env.NOTIFS_ENABLED === 'true';

export const QUEUE_NAME = 'notifs';

let BullmqQueue: any;
let BullmqWorker: any;
let IORedis: any;

if (NOTIFS_ENABLED) {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  ({ Queue: BullmqQueue, Worker: BullmqWorker } = require('bullmq'));
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  IORedis = require('ioredis');
}

function redact(url?: string) {
  try {
    if (!url) return 'undefined';
    const u = new URL(url);
    return `${u.protocol}//${u.hostname}:${u.port || ''}`;
  } catch {
    return 'invalid';
  }
}

// ---- conexión y queue REAL solo si enabled
let connection: any;
export let notifQueue: any;

if (NOTIFS_ENABLED) {
  const redisUrl = process.env.REDIS_URL ?? 'redis://127.0.0.1:6379';
  const host = (() => { try { return new URL(redisUrl).hostname; } catch { return undefined; } })();
  const useTLS = redisUrl.startsWith('rediss://');

  console.log('[NOTIFS] enabled');
  console.log('[REDIS] connecting to', redact(redisUrl));

  connection = new IORedis(redisUrl, {
    maxRetriesPerRequest: null,
    connectTimeout: 20000,
    family: 4,
    retryStrategy: (times: number) => Math.min(times * 1000, 15000),
    ...(useTLS ? { tls: { servername: host } } : {}),
  });

  notifQueue = new BullmqQueue(QUEUE_NAME, { connection });
} else {
  console.log('[NOTIFS] disabled → queue/redis NO inicializados');
}

// ---- helpers públicos (no-ops si disabled)
export async function enqueue<T = any>(name: string, payload: T, opts?: JobsOptions) {
  if (!NOTIFS_ENABLED || !notifQueue) {
    console.warn(`[NOTIFS] disabled → skip enqueue "${name}"`);
    return { id: 'noop', name, payload, opts };
  }
  return notifQueue.add(name, payload as any, opts);
}

export function makeWorker(processor: Processor) {
  if (!NOTIFS_ENABLED) {
    console.warn('[NOTIFS] disabled → worker NO iniciado');
    return undefined; // Worker | undefined
  }
  const concurrency = Number(process.env.WORKER_CONCURRENCY ?? '5');
  return new BullmqWorker(QUEUE_NAME, processor, {
    connection,
    concurrency,
    // opcional: menos housekeeping => menos tráfico (trade-off con detección de "stalled")
    stalledInterval: Number(process.env.WORKER_STALLED_INTERVAL_MS ?? '300000'), // 5min
  });
}
