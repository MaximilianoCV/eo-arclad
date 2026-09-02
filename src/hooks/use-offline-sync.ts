import { useState, useEffect, useCallback, useRef } from "react";
import { createActivity } from "@/lib/api";
import type { ActivityInsert } from "@/types/study";

interface QueuedActivity { id: string; data: ActivityInsert; timestamp: number; }
const QUEUE_KEY = "eo_offline_queue";
function getQueue(): QueuedActivity[] { try { return JSON.parse(localStorage.getItem(QUEUE_KEY) || "[]"); } catch { return []; } }
function saveQueue(q: QueuedActivity[]) { localStorage.setItem(QUEUE_KEY, JSON.stringify(q)); }
export function addToQueue(activity: ActivityInsert) { const q = getQueue(); q.push({ id: crypto.randomUUID(), data: activity, timestamp: Date.now() }); saveQueue(q); }
export function getQueueLength(): number { return getQueue().length; }

export function useOfflineSync(onSynced?: () => void) {
  const syncingRef = useRef(false);
  const [pendingCount, setPendingCount] = useState(getQueueLength());
  const sync = useCallback(async () => {
    if (syncingRef.current) return;
    const queue = getQueue();
    if (queue.length === 0) { setPendingCount(0); return; }
    syncingRef.current = true;
    const remaining: QueuedActivity[] = [];
    for (const item of queue) { try { await createActivity(item.data); } catch { remaining.push(item); } }
    saveQueue(remaining); setPendingCount(remaining.length); syncingRef.current = false;
    if (remaining.length < queue.length) onSynced?.();
  }, [onSynced]);
  useEffect(() => { const h = () => { sync(); }; window.addEventListener("online", h); return () => window.removeEventListener("online", h); }, [sync]);
  useEffect(() => { sync(); }, [sync]);
  useEffect(() => { const id = setInterval(() => setPendingCount(getQueueLength()), 2000); return () => clearInterval(id); }, []);
  return { sync, pendingCount };
}
export function useOnlineStatus() {
  const [online, setOnline] = useState(navigator.onLine);
  useEffect(() => {
    const on = () => setOnline(true), off = () => setOnline(false);
    window.addEventListener("online", on); window.addEventListener("offline", off);
    return () => { window.removeEventListener("online", on); window.removeEventListener("offline", off); };
  }, []);
  return online;
}
