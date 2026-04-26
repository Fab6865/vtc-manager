const API_BASE = '/api';

async function fetchApi(endpoint, options = {}) {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Erreur réseau' }));
    throw new Error(error.error || 'Erreur inconnue');
  }
  
  return response.json();
}

// Company
export const getCompany = () => fetchApi('/company');
export const updateCompany = (data) => fetchApi('/company', { method: 'PUT', body: JSON.stringify(data) });
export const getDashboard = () => fetchApi('/company/dashboard');
export const getTransactions = (limit = 50) => fetchApi(`/company/transactions?limit=${limit}`);

// Drivers
export const getDrivers = () => fetchApi('/drivers');
export const getDriverStats = (id) => fetchApi(`/drivers/${id}/stats`);
export const hireDriver = (name) => fetchApi('/drivers/hire', { method: 'POST', body: JSON.stringify({ name }) });
export const fireDriver = (id) => fetchApi(`/drivers/${id}`, { method: 'DELETE' });
export const trainDriver = (id, trainingType) => fetchApi(`/drivers/${id}/train`, { method: 'POST', body: JSON.stringify({ training_type: trainingType }) });
export const assignTruck = (driverId, truckId) => fetchApi(`/drivers/${driverId}/assign-truck`, { method: 'POST', body: JSON.stringify({ truck_id: truckId }) });

// Trucks
export const getTrucks = () => fetchApi('/trucks');
export const getOwnedTrucks = () => fetchApi('/trucks/owned');
export const buyTruck = (id) => fetchApi(`/trucks/${id}/buy`, { method: 'POST' });
export const rentTruck = (id) => fetchApi(`/trucks/${id}/rent`, { method: 'POST' });
export const sellTruck = (id) => fetchApi(`/trucks/${id}/sell`, { method: 'POST' });
export const renameTruck = (id, name) => fetchApi(`/trucks/${id}/name`, { method: 'PUT', body: JSON.stringify({ name }) });

// Deliveries
export const getDeliveries = (limit = 50, offset = 0) => fetchApi(`/deliveries?limit=${limit}&offset=${offset}`);
export const addDelivery = (data) => fetchApi('/deliveries', { method: 'POST', body: JSON.stringify(data) });
export const deleteDelivery = (id) => fetchApi(`/deliveries/${id}`, { method: 'DELETE' });
export const getDeliveryStats = () => fetchApi('/deliveries/stats');

// Rankings
export const getRealRankings = () => fetchApi('/rankings/real');
export const getRaceRankings = () => fetchApi('/rankings/race');
export const getRankingsOverview = () => fetchApi('/rankings/overview');

// Gallery
export const getGallery = () => fetchApi('/gallery');
export const deletePhoto = (id) => fetchApi(`/gallery/${id}`, { method: 'DELETE' });

// Shop
export const getShopItems = () => fetchApi('/shop');
export const buyDecoration = (itemId) => fetchApi(`/shop/buy/decoration/${itemId}`, { method: 'POST' });
export const buyGarageUpgrade = (itemId) => fetchApi(`/shop/buy/garage-upgrade/${itemId}`, { method: 'POST' });
export const getGarage = () => fetchApi('/shop/garage');
export const updateGarageName = (name) => fetchApi('/shop/garage/name', { method: 'PUT', body: JSON.stringify({ name }) });

// Admin
export const adminAddMoney = (amount) => fetchApi('/admin/money/add', { method: 'POST', body: JSON.stringify({ amount }) });
export const adminSetMoney = (amount) => fetchApi('/admin/money/set', { method: 'POST', body: JSON.stringify({ amount }) });
export const adminResetMoney = () => fetchApi('/admin/money/reset', { method: 'POST' });
export const adminSimulateTime = (minutes) => fetchApi('/admin/simulate-time', { method: 'POST', body: JSON.stringify({ minutes }) });
export const adminResetMonthly = () => fetchApi('/admin/reset-monthly', { method: 'POST' });
export const adminTestMonthChange = () => fetchApi('/admin/test-month-change', { method: 'POST' });
export const adminResetAll = () => fetchApi('/admin/reset-all', { method: 'POST' });
export const adminUnlockTrucks = () => fetchApi('/admin/unlock-trucks', { method: 'POST' });
export const adminGodMode = () => fetchApi('/admin/god-mode', { method: 'POST' });
export const adminGetAICompanies = () => fetchApi('/admin/ai-companies');
export const adminCreateAICompany = (data) => fetchApi('/admin/ai-company', { method: 'POST', body: JSON.stringify(data) });
export const adminUpdateAICompany = (id, data) => fetchApi(`/admin/ai-company/${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const adminDeleteAICompany = (id) => fetchApi(`/admin/ai-company/${id}`, { method: 'DELETE' });
export const adminGetFreeHiring = () => fetchApi('/admin/free-hiring');
export const adminToggleFreeHiring = () => fetchApi('/admin/free-hiring', { method: 'POST' });
export const adminGetTrucks = () => fetchApi('/admin/trucks');
export const adminCreateTruck = (data) => fetchApi('/admin/truck', { method: 'POST', body: JSON.stringify(data) });
export const adminDeleteTruck = (id) => fetchApi(`/admin/truck/${id}`, { method: 'DELETE' });
