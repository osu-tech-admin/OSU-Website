import { getCookie } from "./utils/index";

/**
 * Utility function to handle API requests
 * @param {string} url - API endpoint URL
 * @param {string} method - HTTP method (GET, POST, PUT, DELETE)
 * @param {Object} [body] - Request body for POST/PUT requests
 * @returns {Promise<any>} - Response data
 */
const apiRequest = async (url, method, body = null) => {
  const headers = {
    "Content-Type": "application/json",
    "X-CSRFToken": getCookie("csrftoken")
  };

  const options = {
    method,
    headers,
    credentials: "include"
  };

  if (body && (method === "POST" || method === "PUT")) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(url, options);

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({
      message: "Unknown error occurred"
    }));
    throw new Error(errorData.message || "API request failed");
  }

  // Handle empty responses (like DELETE operations)
  const contentType = response.headers.get("content-type");
  if (contentType && contentType.includes("application/json")) {
    return response.json();
  }

  return { success: true };
};

/**
 * Fetch teams
 * @returns {Promise<Array>} - List of teams
 */
export const fetchTeams = async () => {
  return apiRequest("/api/teams", "GET");
};

export const fetchTeamBySlug = async teamSlug => {
  return apiRequest(`/api/teams/by-slug/${teamSlug}`, "GET");
};

/**
 * Fetch tournaments
 * @returns {Promise<Array>} - List of tournaments
 */
export const fetchTournaments = async () => {
  return apiRequest("/api/tournaments", "GET");
};

/**
 * Fetch tournament by ID
 * @param {number} tournamentId - Tournament ID
 * @returns {Promise<Object>} - Tournament data
 */
export const fetchTournament = async tournamentId => {
  return apiRequest(`/api/tournaments/${tournamentId}`, "GET");
};

/**
 * Fetch tournament by slug
 * @param {string} tournamentSlug - Tourrnament slug
 * @returns {Promise<Object>} - Tournament data
 */
export const fetchTournamentBySlug = async tournamentSlug => {
  return apiRequest(`/api/tournaments/${tournamentSlug}`, "GET");
};

/**
 * Fetch fields by tournament ID
 * @param {number} tournamentId - Tournament ID
 * @returns {Promise<Array>} - List of fields
 */
export const fetchFieldsByTournamentId = async tournamentId => {
  return apiRequest(`/api/tournaments/${tournamentId}/fields`, "GET");
};

/**
 * Fetch a team's roster for a tournanment
 * @param {string} tournamentSlug - Tournament Slug
 * @param {string} teamSlug - Tournament Slug
 * @returns {Promise<Array>} - List of fields
 */
export const fetchTournamentTeamRoster = async (tournamentSlug, teamSlug) => {
  return apiRequest(
    `/api/tournaments/${tournamentSlug}/team/${teamSlug}/roster`,
    "GET"
  );
};

/**
 * Fetch pools by tournament slug
 * @param {string} tournamentSlug - Tournament slug
 * @returns {Promise<Array>} - List of pools
 */
export const fetchPoolsBySlug = async tournamentSlug => {
  return apiRequest(`/api/tournaments/${tournamentSlug}/pools`, "GET");
};

/**
 * Fetch cross pool by tournament ID
 * @param {number} tournamentId - Tournament ID
 * @returns {Promise<Object>} - Cross pool data
 */
export const fetchCrossPool = async tournamentId => {
  return apiRequest(`/api/tournaments/${tournamentId}/cross-pools`, "GET");
};

/**
 * Fetch brackets by tournament slug
 * @param {string} tournamentSlug - Tournament slug
 * @returns {Promise<Array>} - List of brackets
 */
export const fetchBracketsBySlug = async tournamentSlug => {
  return apiRequest(`/api/tournaments/${tournamentSlug}/brackets`, "GET");
};

/**
 * Fetch position pools by tournament ID
 * @param {number} tournamentId - Tournament ID
 * @returns {Promise<Array>} - List of position pools
 */
export const fetchPositionPools = async tournamentId => {
  return apiRequest(`/api/tournaments/${tournamentId}/position-pools`, "GET");
};

/**
 * Fetch matches by tournament ID
 * @param {number} tournamentId - Tournament ID
 * @returns {Promise<Array>} - List of matches
 */
export const fetchMatches = async tournamentId => {
  return apiRequest(`/api/matches?tournament_id=${tournamentId}`, "GET");
};

/**
 * Fetch all matches for a team in a tournament
 * @param {number} tournamentSlug - Tournament Slug
 * @param {number} teamSlug - Team Slug
 * @returns {Promise<Array>} - List of matches
 */

export const fetchTournamentTeamMatches = async (tournamentSlug, teamSlug) => {
  return apiRequest(
    `/api/matches/tournament/${tournamentSlug}/team/${teamSlug}`,
    "GET"
  );
};

export const fetchUserPermissionsForMatch = async tournamentSlug => {
  return apiRequest(`/api/tournaments/${tournamentSlug}/me/access`, "GET");
};

/**
 * Update seeding for a tournament
 * @param {Object} params - Parameters
 * @param {number} params.id - Tournament ID
 * @param {Array} params.teamSeeding - Updated team seeding
 * @returns {Promise<Object>} - Updated tournament data
 */
export const updateSeeding = async ({ id, teamSeeding }) => {
  return apiRequest(`/api/tournaments/${id}/update-seeding`, "POST", {
    seeding: teamSeeding
  });
};

/**
 * Delete a tournament
 * @param {Object} params - Parameters
 * @param {number} params.id - Tournament ID
 * @returns {Promise<Object>} - Success response
 */
export const deleteTournament = async ({ id }) => {
  return apiRequest(`/api/tournaments/${id}`, "DELETE");
};

/**
 * Create a field for a tournament
 * @param {Object} params - Parameters
 * @param {number} params.tournamentId - Tournament ID
 * @param {Object} params.fieldData - Field data
 * @returns {Promise<Object>} - Created field data
 */
export const createField = async ({ tournamentId, fieldData }) => {
  return apiRequest(
    `/api/tournaments/${tournamentId}/fields`,
    "POST",
    fieldData
  );
};

/**
 * Update a field
 * @param {Object} params - Parameters
 * @param {number} params.fieldId - Field ID
 * @param {Object} params.fieldData - Updated field data
 * @returns {Promise<Object>} - Updated field data
 */
export const updateField = async ({ fieldId, fieldData }) => {
  return apiRequest(`/api/fields/${fieldId}`, "PUT", fieldData);
};

/**
 * Create a pool for a tournament
 * @param {Object} params - Parameters
 * @param {number} params.tournament_id - Tournament ID
 * @param {string} params.name - Pool name
 * @param {number} params.seq_num - Sequence number
 * @param {string} params.seeding_list - JSON string of seeding list
 * @returns {Promise<Object>} - Created pool data
 */
export const createPool = async ({
  tournament_id,
  name,
  seq_num,
  seeding_list
}) => {
  return apiRequest("/api/tournaments/pools", "POST", {
    tournament_id,
    name,
    sequence_number: seq_num,
    seeding: JSON.parse(seeding_list)
  });
};

/**
 * Create a cross pool for a tournament
 * @param {Object} params - Parameters
 * @param {number} params.tournament_id - Tournament ID
 * @returns {Promise<Object>} - Created cross pool data
 */
export const createCrossPool = async ({ tournament_id }) => {
  return apiRequest("/api/tournaments/cross-pools", "POST", { tournament_id });
};

/**
 * Create a bracket for a tournament
 * @param {Object} params - Parameters
 * @param {number} params.tournament_id - Tournament ID
 * @param {string} params.name - Bracket name
 * @param {number} params.seq_num - Sequence number
 * @returns {Promise<Object>} - Created bracket data
 */
export const createBracket = async ({ tournament_id, name, seq_num }) => {
  return apiRequest("/api/tournaments/brackets", "POST", {
    tournament_id,
    name,
    sequence_number: seq_num
  });
};

/**
 * Create a position pool for a tournament
 * @param {Object} params - Parameters
 * @param {number} params.tournament_id - Tournament ID
 * @param {string} params.name - Pool name
 * @param {number} params.seq_num - Sequence number
 * @param {string} params.seeding_list - JSON string of seeding list
 * @returns {Promise<Object>} - Created position pool data
 */
export const createPositionPool = async ({
  tournament_id,
  name,
  seq_num,
  seeding_list
}) => {
  return apiRequest("/api/tournaments/position-pools", "POST", {
    tournament_id,
    name,
    sequence_number: seq_num,
    seeding: JSON.parse(seeding_list)
  });
};

/**
 * Create a match
 * @param {Object} params - Parameters
 * @param {number} params.tournament_id - Tournament ID
 * @param {Object} params.body - Match data
 * @returns {Promise<Object>} - Created match data
 */
export const createMatch = async ({ tournament_id, body }) => {
  let matchData = {
    name: `${body.seed_1} vs ${body.seed_2}`,
    tournament_id,
    sequence_number: body.seq_num,
    time: body.time,
    placeholder_seed_1: body.seed_1,
    placeholder_seed_2: body.seed_2,
    status: "YTF"
  };

  // Add field if provided
  if (body.field_id) {
    matchData.field_id = body.field_id;
  }

  // Add appropriate pool/bracket data based on stage
  if (body.stage === "pool" && body.stage_id) {
    matchData.pool_id = body.stage_id;
  } else if (body.stage === "cross_pool" && body.stage_id) {
    matchData.cross_pool_id = body.stage_id;
  } else if (body.stage === "bracket" && body.stage_id) {
    matchData.bracket_id = body.stage_id;
  } else if (body.stage === "position_pool" && body.stage_id) {
    matchData.position_pool_id = body.stage_id;
  }

  return apiRequest("/api/matches", "POST", matchData);
};

/**
 * Update a match
 * @param {Object} params - Parameters
 * @param {number} params.match_id - Match ID
 * @param {Object} params.body - Updated match data
 * @returns {Promise<Object>} - Updated match data
 */
export const updateMatch = async ({ match_id, body }) => {
  return apiRequest(`/api/matches/${match_id}`, "PUT", body);
};

/**
 * Start a tournament
 * @param {Object} params - Parameters
 * @param {number} params.tournament_id - Tournament ID
 * @returns {Promise<Object>} - Success response
 */
export const startTournament = async ({ tournament_id }) => {
  return apiRequest(`/api/tournaments/start/${tournament_id}`, "POST");
};

/**
 * Generate tournament fixtures
 * @param {Object} params - Parameters
 * @param {number} params.tournament_id - Tournament ID
 * @returns {Promise<Object>} - Success response
 */
export const generateTournamentFixtures = async ({ tournament_id }) => {
  return apiRequest(
    `/api/tournaments/generate-fixtures/${tournament_id}`,
    "POST"
  );
};

/**
 * Submit match score AS A STAFF USER
 * @param {Object} params - Parameters
 * @param {number} params.match_id - Match ID
 * @param {Object} params.body - Score data
 * @returns {Promise<Object>} - Updated match data
 */
export const addMatchScore = async ({ match_id, body }) => {
  return apiRequest(
    `/api/matches/${match_id}/staff-submit-score`,
    "POST",
    body
  );
};

/**
 * Submit match score as a team admin (captain, spirit captain, owner or coach)
 * @param {Object} params - Parameters
 * @param {number} params.match_id - Match ID
 * @param {Object} params.body - Score data
 * @returns {Promise<Object>} - Updated match data
 */
export const submitMatchScore = async ({ match_id, body }) => {
  return apiRequest(`/api/matches/${match_id}/submit-score`, "POST", body);
};

export const submitMatchSpiritScore = async ({ match_id, body }) => {
  return apiRequest(
    `/api/matches/${match_id}/submit-spirit-score`,
    "POST",
    body
  );
};

/**
 * Delete a match
 * @param {Object} params - Parameters
 * @param {number} params.match_id - Match ID
 * @returns {Promise<Object>} - Success response
 */
export const deleteMatch = async ({ match_id }) => {
  return apiRequest(`/api/matches/${match_id}`, "DELETE");
};
