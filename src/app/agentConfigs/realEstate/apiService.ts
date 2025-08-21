// API service for fetching properties from Cloe Edu
interface SearchParams {
  city?: string;
  property_type?: string;
  budget_per_month?: number;
  currency?: string;
  move_in_date?: string;
  duration_months?: number;
}

interface APIProperty {
  id: number;
  type: string;
  city_id: number;
  title: string;
  address: string;
  url: string;
  images: string[];
  costs?: number; // API returns costs instead of price
}

interface SearchResult {
  criteria: SearchParams;
  total: number;
  properties: any[];
}

// Property type mapping for API
const propertyTypeMapping: Record<string, string> = {
  'studio': 'studio',
  'apartment': 'apartment',
  'house': 'house',
  'room': 'room',
  't1': 'studio',
  't2': 'apartment',
  't3': 'apartment',
  't4': 'apartment',
  'shared': 'room',
  'dorm': 'room'
};

export async function searchPropertiesFromAPI(params: SearchParams): Promise<SearchResult> {
  try {
    console.log('🚀 Calling Cloe Edu API with params:', params);

    // Build query parameters
    const queryParams = new URLSearchParams();
    
    // Map property type to API format
    if (params.property_type) {
      const normalizedType = params.property_type.toLowerCase().trim();
      const apiType = propertyTypeMapping[normalizedType] || 'apartment';
      queryParams.append('type', apiType);
    }
    
    // Note: City filtering might need to be handled on the client side
    // or the API might support it with a different parameter name
    // For now, we'll pass it as a query param in case the API supports it
    if (params.city) {
      queryParams.append('city', params.city);
    }

    // Add budget (multiply by 100 as per API requirements)
    if (params.budget_per_month) {
      const maxPrice = params.budget_per_month * 100;
      queryParams.append('max_price', maxPrice.toString());
    }

    // Add move-in date
    if (params.move_in_date) {
      queryParams.append('enter_date', params.move_in_date);
    }

    // Add duration
    if (params.duration_months) {
      queryParams.append('duration', params.duration_months.toString());
    }

    // Build the API URL
    const baseUrl = 'https://cloe-edu.fr/api/v1/559/properties/search';
    const url = `${baseUrl}?${queryParams.toString()}`;
    
    console.log('📡 API URL:', url);

    // Make the API call
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer bKvOsJ4O7x4JZcfwU7ofsSBuSEkBOyPAQSTy1rvf2pSG1DGenodyJ3bTRjy6'
      },
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }

    const data: APIProperty[] = await response.json();
    console.log('📦 Raw API response:', data);

    // Transform API response to match your property format
    const transformedProperties = data.map((property) => ({
      id: property.id,
      title: property.title,
      city: params.city || 'Unknown', // Use the search city or fallback
      address: property.address,
      min_description: property.title, // Using title as description for now
      type: property.type,
      price: property.costs ? Math.round(property.costs / 100) : 0, // Convert costs to price (divide by 100)
      link: property.url,
      image_url: property.images[0] || '',
      image_urls: property.images || []
    }));

    console.log('🔄 Transformed properties:', transformedProperties);

    return {
      criteria: params,
      total: transformedProperties.length,
      properties: transformedProperties.slice(0, 3), // Limit to 3 properties
    };

  } catch (error) {
    console.error('❌ API call failed:', error);
    throw error; // Re-throw to trigger fallback
  }
}
