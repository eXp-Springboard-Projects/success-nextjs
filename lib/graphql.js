/**
 * GraphQL client for WPGraphQL endpoint
 * Fetches data from WordPress using GraphQL queries
 */

const GRAPHQL_ENDPOINT = process.env.WPGRAPHQL_URL || 'https://your-site.wpengine.com/graphql';

/**
 * Fetch data from WPGraphQL endpoint
 * @param {string} query - GraphQL query string
 * @param {object} variables - Query variables (optional)
 * @returns {Promise<object>} - Response data object
 */
export async function fetchGraphQL(query, variables = {}) {
  try {
    const response = await fetch(GRAPHQL_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query,
        variables,
      }),
      // Enable caching with Next.js 14 fetch options
      next: {
        revalidate: 600, // Revalidate every 10 minutes
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const json = await response.json();

    // Check for GraphQL errors
    if (json.errors) {
      throw new Error(`GraphQL Error: ${json.errors[0]?.message || 'Unknown error'}`);
    }

    return json.data;
  } catch (error) {
    throw error;
  }
}

/**
 * Fetch data without caching (for real-time data)
 * @param {string} query - GraphQL query string
 * @param {object} variables - Query variables (optional)
 * @returns {Promise<object>} - Response data object
 */
export async function fetchGraphQLNoCache(query, variables = {}) {
  try {
    const response = await fetch(GRAPHQL_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query,
        variables,
      }),
      cache: 'no-store', // Disable caching
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const json = await response.json();

    if (json.errors) {
      throw new Error(`GraphQL Error: ${json.errors[0]?.message || 'Unknown error'}`);
    }

    return json.data;
  } catch (error) {
    throw error;
  }
}
