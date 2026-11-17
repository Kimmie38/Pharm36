import AsyncStorage from '@react-native-async-storage/async-storage';
import { request, ApiError } from '../api/client';

const QUEUE_KEY = 'pharm36.outbox.v1';
const FAILED_KEY = 'pharm36.outbox.failed.v1';
let flushing = false;

async function read(key) {
  try { return JSON.parse((await AsyncStorage.getItem(key)) || '[]'); } catch { return []; }
}
const write = (key, value) => AsyncStorage.setItem(key, JSON.stringify(value));

export const listPending = () => read(QUEUE_KEY);
export const listFailed = () => read(FAILED_KEY);
export const clearFailed = () => AsyncStorage.removeItem(FAILED_KEY);
export const clearOutbox = async () => { await AsyncStorage.removeItem(QUEUE_KEY); await AsyncStorage.removeItem(FAILED_KEY); };

export const newClientId = () => `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 12)}`;

// item: { path, method, body, label }
export async function enqueue(item) {
  const queue = await read(QUEUE_KEY);
  queue.push({ id: newClientId(), createdAt: Date.now(), ...item });
  await write(QUEUE_KEY, queue);
  return queue.length;
}

// Sends queued writes in order. Stops at the first network/server problem so order is kept;
// requests the server rejects for good (validation, restricted category...) move to the failed list.
export async function flushOutbox() {
  if (flushing) return { sent: 0, failed: 0, remaining: (await read(QUEUE_KEY)).length };
  flushing = true;
  let sent = 0;
  let failed = 0;
  try {
    let queue = await read(QUEUE_KEY);
    while (queue.length) {
      const item = queue[0];
      try {
        await request(item.path, { method: item.method || 'POST', body: item.body });
        sent += 1;
      } catch (error) {
        const status = error instanceof ApiError ? error.status : 0;
        const retryable = status === 0 || status === 401 || status === 408 || status === 429 || status >= 500;
        if (retryable) break;
        const rejected = await read(FAILED_KEY);
        rejected.push({ ...item, error: error.message, status });
        await write(FAILED_KEY, rejected);
        failed += 1;
      }
      queue = queue.slice(1);
      await write(QUEUE_KEY, queue);
    }
    return { sent, failed, remaining: queue.length };
  } finally {
    flushing = false;
  }
}
