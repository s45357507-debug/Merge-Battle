// Управление монетами: баланс, начисление при онбординге, списание при покупках.
// Использует serverSync.safeCall для работы с реальным сервером, если он доступен.

import { safeCall } from './serverSync';

const LOCAL_KEY = 'mb_user_state_v1';

export interface UserState {
  coins: number;
  hasReceivedOnboarding?: boolean;
  inventory?: string[]; // item IDs
  equipped?: { [slot: string]: string };
  // можно хранить и игровое поле
}

function loadLocal(): UserState {
  try {
    const raw = localStorage.getItem(LOCAL_KEY);
    if (!raw) return { coins: 0, hasReceivedOnboarding: false, inventory: [], equipped: {} };
    return JSON.parse(raw) as UserState;
  } catch {
    return { coins: 0, hasReceivedOnboarding: false, inventory: [], equipped: {} };
  }
}

function saveLocal(state: UserState) {
  localStorage.setItem(LOCAL_KEY, JSON.stringify(state));
}

// Получает состояние пользователя (синхронно с сервером если доступен)
export async function getUserState(userId?: string) : Promise<UserState> {
  // пробуем получить с сервера
  const serverRes = await safeCall('/api/user/state', { method: 'GET', userId });
  if (serverRes && serverRes.ok) {
    return serverRes.state as UserState;
  }
  // fallback
  return loadLocal();
}

// Выдача онбординга: +500 монет при первом входе
export async function awardOnboardingIfNeeded(userId?: string) : Promise<{ awarded: boolean; state: UserState }> {
  // Попытка через сервер
  const serverRes = await safeCall('/api/onboarding-award', { method: 'POST', userId });
  if (serverRes && serverRes.ok) {
    // serverRes.state содержит актуальное состояние
    return { awarded: serverRes.awarded, state: serverRes.state };
  }

  // Fallback локальный (с осторожностью — использовать только если нет сервера)
  const state = loadLocal();
  if (!state.hasReceivedOnboarding) {
    state.coins = (state.coins || 0) + 500;
    state.hasReceivedOnboarding = true;
    saveLocal(state);
    return { awarded: true, state };
  }
  return { awarded: false, state };
}

// Списание монет на покупку
export async function purchaseItem(userId: string | undefined, itemId: string, price: number) : Promise<{ success: boolean; state?: UserState; error?: string }> {
  // попробовать на сервере
  const serverRes = await safeCall('/api/shop/buy', { method: 'POST', userId, body: { itemId } });
  if (serverRes && serverRes.ok) {
    return { success: true, state: serverRes.state };
  }

  // fallback локальный
  const state = loadLocal();
  if ((state.coins || 0) < price) return { success: false, error: 'Not enough coins' };
  state.coins -= price;
  state.inventory = state.inventory || [];
  if (!state.inventory.includes(itemId)) state.inventory.push(itemId);
  state.equipped = state.equipped || {};
  // стандартная логика: items имеют слот 'default' если не указано
  state.equipped['default'] = itemId;
  saveLocal(state);
  return { success: true, state };
}