const API_BASE_URL = '/api';

// Helper function for API calls
const apiRequest = async (endpoint, options = {}) => {
  const token = localStorage.getItem('token');
  
  const defaultHeaders = {
    'Content-Type': 'application/json',
  };
  
  if (token) {
    defaultHeaders['Authorization'] = `Bearer ${token}`;
  }
  
  const config = {
    headers: { ...defaultHeaders, ...options.headers },
    ...options,
  };
  
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({
        message: `HTTP ${response.status}: ${response.statusText}`
      }));
      throw new Error(error.message || 'API request failed');
    }
    
    return await response.json();
  } catch (error) {
    console.error('API request error:', error);
    throw error;
  }
};

// Auth API
export const authAPI = {
  adminLogin: (code) => 
    apiRequest('/auth/admin/login', {
      method: 'POST',
      body: JSON.stringify({ code })
    }),
  
  verifyToken: () => 
    apiRequest('/auth/verify', {
      method: 'POST'
    }),
  
  login: (username, password) =>
    apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password })
    }),
  
  register: (userData) =>
    apiRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData)
    })
};

// Teams API
export const teamsAPI = {
  getAll: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiRequest(`/teams${query ? `?${query}` : ''}`);
  },
  
  getById: (id) => apiRequest(`/teams/${id}`),
  
  create: (teamData) =>
    apiRequest('/teams', {
      method: 'POST',
      body: JSON.stringify(teamData)
    }),
  
  update: (id, teamData) =>
    apiRequest(`/teams/${id}`, {
      method: 'PUT',
      body: JSON.stringify(teamData)
    }),
  
  delete: (id) =>
    apiRequest(`/teams/${id}`, {
      method: 'DELETE'
    }),
  
  addPlayer: (teamId, playerId) =>
    apiRequest(`/teams/${teamId}/players`, {
      method: 'POST',
      body: JSON.stringify({ playerId })
    }),
  
  removePlayer: (teamId, playerId) =>
    apiRequest(`/teams/${teamId}/players/${playerId}`, {
      method: 'DELETE'
    }),
  
  getPlayers: (teamId) => apiRequest(`/teams/${teamId}/players`),
  
  getPointsTable: () => apiRequest('/teams/points-table/all')
};

// Players API
export const playersAPI = {
  getAll: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiRequest(`/players${query ? `?${query}` : ''}`);
  },
  
  getById: (id) => apiRequest(`/players/${id}`),
  
  create: (playerData) =>
    apiRequest('/players', {
      method: 'POST',
      body: JSON.stringify(playerData)
    }),
  
  update: (id, playerData) =>
    apiRequest(`/players/${id}`, {
      method: 'PUT',
      body: JSON.stringify(playerData)
    }),
  
  delete: (id) =>
    apiRequest(`/players/${id}`, {
      method: 'DELETE'
    }),
  
  updateStats: (id, type, data) =>
    apiRequest(`/players/${id}/stats`, {
      method: 'PUT',
      body: JSON.stringify({ type, data })
    }),
  
  getLeaderboard: (type, limit = 10) =>
    apiRequest(`/players/stats/leaderboard?type=${type}&limit=${limit}`),
  
  search: (query) => apiRequest(`/players/search/${query}`)
};

// Matches API
export const matchesAPI = {
  getAll: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiRequest(`/matches${query ? `?${query}` : ''}`);
  },
  
  getLive: () => apiRequest('/matches/live'),
  
  getUpcoming: () => apiRequest('/matches/upcoming'),
  
  getCompleted: () => apiRequest('/matches/completed'),
  
  getById: (id) => apiRequest(`/matches/${id}`),
  
  create: (matchData) =>
    apiRequest('/matches', {
      method: 'POST',
      body: JSON.stringify(matchData)
    }),
  
  updateStatus: (id, statusData) =>
    apiRequest(`/matches/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify(statusData)
    }),
  
  addBall: (id, ballData) =>
    apiRequest(`/matches/${id}/balls`, {
      method: 'POST',
      body: JSON.stringify(ballData)
    }),
  
  updateResult: (id, resultData) =>
    apiRequest(`/matches/${id}/result`, {
      method: 'PUT',
      body: JSON.stringify(resultData)
    }),
  
  delete: (id) =>
    apiRequest(`/matches/${id}`, {
      method: 'DELETE'
    })
};

// Tournament API
export const tournamentAPI = {
  getCurrent: () => apiRequest('/tournament/current'),
  
  getAll: () => apiRequest('/tournament'),
  
  getById: (id) => apiRequest(`/tournament/${id}`),
  
  create: (tournamentData) =>
    apiRequest('/tournament', {
      method: 'POST',
      body: JSON.stringify(tournamentData)
    }),
  
  update: (id, tournamentData) =>
    apiRequest(`/tournament/${id}`, {
      method: 'PUT',
      body: JSON.stringify(tournamentData)
    }),
  
  createGroups: (id, groups) =>
    apiRequest(`/tournament/${id}/groups`, {
      method: 'POST',
      body: JSON.stringify({ groups })
    }),
  
  generateFixtures: (id, fixtureData) =>
    apiRequest(`/tournament/${id}/fixtures`, {
      method: 'POST',
      body: JSON.stringify(fixtureData)
    }),
  
  getStats: (id) => apiRequest(`/tournament/${id}/stats`),
  
  delete: (id) =>
    apiRequest(`/tournament/${id}`, {
      method: 'DELETE'
    })
};

// Admin API
export const adminAPI = {
  getDashboard: () => apiRequest('/admin/dashboard'),
  
  getUsers: () => apiRequest('/admin/users'),
  
  createUser: (userData) =>
    apiRequest('/admin/users', {
      method: 'POST',
      body: JSON.stringify(userData)
    }),
  
  updateUser: (id, userData) =>
    apiRequest(`/admin/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(userData)
    }),
  
  deleteUser: (id) =>
    apiRequest(`/admin/users/${id}`, {
      method: 'DELETE'
    }),
  
  bulkCreateTeams: (teams) =>
    apiRequest('/admin/bulk/teams', {
      method: 'POST',
      body: JSON.stringify({ teams })
    }),
  
  getLogs: () => apiRequest('/admin/logs'),
  
  backup: () =>
    apiRequest('/admin/backup', {
      method: 'POST'
    }),
  
  getHealth: () => apiRequest('/admin/health')
};

export default {
  auth: authAPI,
  teams: teamsAPI,
  players: playersAPI,
  matches: matchesAPI,
  tournament: tournamentAPI,
  admin: adminAPI
};