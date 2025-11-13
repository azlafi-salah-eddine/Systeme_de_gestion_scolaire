// Utility to test API connection and provide helpful error messages
export const testApiConnection = async (): Promise<{
  isConnected: boolean;
  error?: string;
  details?: any;
}> => {
  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
  
  try {
    // Test basic connectivity
    const response = await fetch(`${API_BASE_URL}/v1/eleves`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
      },
      credentials: 'include',
    });

    const contentType = response.headers.get('content-type');
    
    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      
      try {
        if (contentType && contentType.includes('application/json')) {
          const errorData = await response.json();
          errorMessage = errorData.message || errorData.error || errorMessage;
        } else {
          const textContent = await response.text();
          errorMessage = `Server returned: ${textContent.substring(0, 200)}...`;
        }
      } catch (parseError) {
        errorMessage = `Unable to parse error response: ${parseError}`;
      }
      
      return {
        isConnected: false,
        error: errorMessage,
        details: {
          status: response.status,
          statusText: response.statusText,
          contentType,
          url: `${API_BASE_URL}/v1/eleves`
        }
      };
    }

    // Check if response is JSON
    if (!contentType || !contentType.includes('application/json')) {
      const textContent = await response.text();
      return {
        isConnected: false,
        error: `Expected JSON but got ${contentType || 'unknown content type'}`,
        details: {
          contentType,
          content: textContent.substring(0, 200),
          url: `${API_BASE_URL}/v1/eleves`
        }
      };
    }

    // Try to parse JSON
    const text = await response.text();
    const cleanText = text.replace(/^\uFEFF/, ''); // Remove BOM
    
    try {
      const data = JSON.parse(cleanText);
      return {
        isConnected: true,
        details: {
          dataType: typeof data,
          hasData: Array.isArray(data) ? data.length : !!data,
          url: `${API_BASE_URL}/v1/eleves`
        }
      };
    } catch (jsonError) {
      return {
        isConnected: false,
        error: `Invalid JSON: ${jsonError instanceof Error ? jsonError.message : 'Unknown JSON error'}`,
        details: {
          jsonError: jsonError instanceof Error ? jsonError.message : 'Unknown error',
          content: cleanText.substring(0, 200),
          url: `${API_BASE_URL}/v1/eleves`
        }
      };
    }

  } catch (networkError) {
    return {
      isConnected: false,
      error: `Network error: ${networkError instanceof Error ? networkError.message : 'Unknown network error'}`,
      details: {
        networkError: networkError instanceof Error ? networkError.message : 'Unknown error',
        url: `${API_BASE_URL}/v1/eleves`
      }
    };
  }
};

// Helper to get API status message
export const getApiStatusMessage = (result: Awaited<ReturnType<typeof testApiConnection>>): string => {
  if (result.isConnected) {
    return '✅ API connection successful';
  }
  
  let message = '❌ API connection failed: ';
  
  if (result.error?.includes('Network error')) {
    message += 'Backend server is not running or not accessible. ';
    message += 'Please make sure the Laravel backend is running on http://localhost:8000';
  } else if (result.error?.includes('HTTP 401') || result.error?.includes('HTTP 403')) {
    message += 'Authentication required. Please log in.';
  } else if (result.error?.includes('HTTP 404')) {
    message += 'API endpoint not found. Check if the backend routes are properly configured.';
  } else if (result.error?.includes('HTTP 500')) {
    message += 'Server error. Check the backend logs.';
  } else if (result.error?.includes('Invalid JSON')) {
    message += 'Server returned invalid JSON. Check backend configuration.';
  } else {
    message += result.error || 'Unknown error';
  }
  
  return message;
};
