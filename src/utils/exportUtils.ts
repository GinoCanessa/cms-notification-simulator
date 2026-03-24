import type { LogEntry } from '../types';

export function exportLogAsJson(entries: LogEntry[]): void {
  const json = JSON.stringify(entries, null, 2);
  downloadFile(json, 'event-log.json', 'application/json');
}

export function exportLogAsCsv(entries: LogEntry[]): void {
  const headers = ['timestamp', 'eventType', 'approach', 'step', 'from', 'to', 'messageType', 'channel', 'hopCount', 'totalHops'];
  const rows = entries.map((e) =>
    [e.timestamp, e.eventType, e.approach, e.step, e.from.name, e.to.name, e.messageType, e.channel, e.hopCount, e.totalHops].join(','),
  );
  const csv = [headers.join(','), ...rows].join('\n');
  downloadFile(csv, 'event-log.csv', 'text/csv');
}

function downloadFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function formatTimestamp(ms: number): string {
  const minutes = Math.floor(ms / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  const millis = ms % 1000;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}.${String(millis).padStart(3, '0')}`;
}
