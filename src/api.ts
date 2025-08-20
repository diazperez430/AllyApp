
let apiModule: any;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  apiModule = require('aws-amplify/api');
} catch {
  apiModule = {
    get: () => { throw new Error('Amplify API not available'); },
    post: () => { throw new Error('Amplify API not available'); },
    put: () => { throw new Error('Amplify API not available'); },
    del: () => { throw new Error('Amplify API not available'); },
  };
}
const { get, post, put, del } = apiModule;

import { ensureValidTokens, createAuthHeaders, CognitoTokens } from './utils/tokenManager';

// Utility function to get auth headers
export const getAuthHeaders = async (): Promise<Record<string, string>> => {
  try {
    const tokens = await ensureValidTokens();
    
    if (tokens) {
      return createAuthHeaders(tokens);
    }
  } catch (error) {
    console.error('Error getting auth headers:', error);
  }
  
  return {
    'Content-Type': 'application/json',
  };
};

// Generic authenticated API call function
export const authenticatedApiCall = async <T>(
  method: 'GET' | 'POST' | 'PUT' | 'DELETE',
  path: string,
  body?: any
): Promise<T> => {
  try {
    const tokens = await ensureValidTokens();
    
    if (!tokens) {
      throw new Error('No valid authentication tokens available');
    }

    const headers = createAuthHeaders(tokens);
    
    const config = {
      apiName: 'apia969530c',
      path,
      options: {
        headers,
        ...(body && { body: JSON.stringify(body) }),
      },
    };

    let response;
    switch (method) {
      case 'GET':
        response = await get(config);
        break;
      case 'POST':
        response = await post(config);
        break;
      case 'PUT':
        response = await put(config);
        break;
      case 'DELETE':
        response = await del(config);
        break;
      default:
        throw new Error(`Unsupported HTTP method: ${method}`);
    }

    const result = await response.response;
    return result.body as T;
  } catch (error) {
    console.error(`API ${method} ${path} error:`, error);
    throw error;
  }
};

// Existing function updated to use authentication
export async function listItems() {
  try {
    const res = await get({
      apiName: 'apia969530c',
      path: '/v1/items',
      options: {
        headers: await getAuthHeaders(),
      }
    });
    const response = await res.response;
    return response.body as unknown as { id: number; name: string }[];
  } catch (error) {
    console.error('Error fetching items:', error);
    return [] as { id: number; name: string }[];
  }
}

// Example of new authenticated API functions
export const createItem = async (item: { name: string }): Promise<{ id: number; name: string }> => {
  return authenticatedApiCall('POST', '/v1/items', item);
};

export const updateItem = async (id: number, item: { name: string }): Promise<{ id: number; name: string }> => {
  return authenticatedApiCall('PUT', `/v1/items/${id}`, item);
};

export const deleteItem = async (id: number): Promise<void> => {
  return authenticatedApiCall('DELETE', `/v1/items/${id}`);
};

export const getUserProfile = async (): Promise<any> => {
  return authenticatedApiCall('GET', '/v1/user/profile');
};

export const updateUserProfile = async (profile: any): Promise<any> => {
  return authenticatedApiCall('PUT', '/v1/user/profile', profile);
};

// Utility function to check if user is authenticated before making API calls
export const requireAuth = async (): Promise<CognitoTokens> => {
  const tokens = await ensureValidTokens();
  if (!tokens) {
    throw new Error('Authentication required. Please sign in.');
  }
  return tokens;
};

// Example of a protected API call that requires authentication
export const getProtectedData = async (): Promise<any> => {
  // This will throw an error if user is not authenticated
  await requireAuth();
  
  return authenticatedApiCall('GET', '/v1/protected-data');
};


