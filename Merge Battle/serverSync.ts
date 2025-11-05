// Абстракция для вызовов серверных endpoint'ов. Возвращает null если сервер недоступен.
// safeCall(path, opts) -> { ok: boolean, ...body } | null
// В реальном приложении заменить базовый URL и добавить авторизацию (JWT/Session).
const BASE = ''; // если есть реальный бэкенд, поставьте '/api' или полный URL

async function request(path: string, init: RequestInit & { userId?: string; body?: any } = {}): Promise<any | null> {
  try {
    const url = (BASE ? BASE : '') + path;
    const opts: RequestInit = { method: init.method || 'POST', headers: { 'Content-Type': 'application/json' } };
    if (init.method === 'GET') delete opts.body;
    if (init.body) opts.body = JSON.stringify(init.body);
    const res = await fetch(url, opts);
    if (!res.ok) {
      // сервер ответил ошибкой — вернуть null для fallback
      return null;
    }
    const json = await res.json();
    return json;
  } catch (err) {
    // сеть недоступна или CORS — вернём null, чтобы использовать локальную логику
    return null;
  }
}

export async function safeCall(path: string, opts: any = {}) {
  const res = await request(path, opts);
  return res;
}