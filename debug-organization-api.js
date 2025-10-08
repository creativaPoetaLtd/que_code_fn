// Debug script to test organization API endpoints
// Run this in the browser console to debug the API call

const testOrganizationAPI = async (organizationId) => {
  console.log('Testing Organization API for ID:', organizationId);
  
  // Get the current base URL
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5500/api/v1';
  console.log('Base URL:', baseUrl);
  
  // Get auth token
  const getTokenFromCookie = () => {
    if (typeof document === 'undefined') return null;
    const nameEQ = "token=";
    const ca = document.cookie.split(';');
    for (let i = 0; i < ca.length; i++) {
      let c = ca[i];
      while (c.charAt(0) === ' ') c = c.substring(1, c.length);
      if (c.indexOf(nameEQ) === 0) {
        try {
          const cookieValue = c.substring(nameEQ.length, c.length);
          const cookieData = JSON.parse(cookieValue);
          if (cookieData.expires && new Date().getTime() > cookieData.expires) {
            return null;
          }
          return cookieData.value;
        } catch (error) {
          console.error('Error parsing token cookie:', error);
          return null;
        }
      }
    }
    return null;
  };
  
  const getAuthHeaders = () => {
    let authToken = getTokenFromCookie();
    
    if (!authToken) {
      const raw = sessionStorage.getItem('token') ?? localStorage.getItem('token');
      if (raw) {
        try {
          const parsed = JSON.parse(raw);
          authToken = parsed.value || parsed;
        } catch {
          authToken = raw;
        }
      }
    }
    
    console.log('Auth token found:', authToken ? 'YES' : 'NO');
    if (authToken) {
      console.log('Token preview:', authToken.substring(0, 20) + '...');
    }
    
    return authToken ? { Authorization: `Bearer ${authToken}` } : {};
  };
  
  const headers = getAuthHeaders();
  const url = `${baseUrl}/transactions/organization/${organizationId}/wallet`;
  
  console.log('Full URL:', url);
  console.log('Headers:', headers);
  
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    });
    
    console.log('Response status:', response.status);
    console.log('Response headers:', [...response.headers.entries()]);
    
    const data = await response.text();
    console.log('Response data:', data);
    
    if (response.ok) {
      console.log('✅ Success!');
      return JSON.parse(data);
    } else {
      console.log('❌ Error:', response.status, response.statusText);
      return null;
    }
  } catch (error) {
    console.error('❌ Network error:', error);
    return null;
  }
};

// Usage: testOrganizationAPI('7d0b5cf8-9794-4454-a5b3-fbd7898fced9')
console.log('Debug script loaded. Use: testOrganizationAPI("your-organization-id")');
