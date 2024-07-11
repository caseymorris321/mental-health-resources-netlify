const BASE_URL = 'https://countriesnow.space/api/v0.1';

export const fetchStates = async () => {
  try {
    const response = await fetch(`${BASE_URL}/countries/states`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ country: 'United States' }),
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    return data.data.states.map(state => ({
      name: state.name,
      abbreviation: state.state_code,
    }));
  } catch (error) {
    console.error('Error fetching states:', error);
    return [];
  }
};

const SUPPORTED_STATES = ["AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "FL", "GA", "HI", "ID", "IL", "IN", "IA", "KS", "KY", "LA", "ME", "MD", "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH", "NJ", "NM", "NY", "NC", "ND", "OH", "OK", "OR", "PA", "RI", "SC", "SD", "TN", "TX", "UT", "VT", "VA", "WA", "WV", "WI", "WY"];

export const fetchCities = async (stateAbbr) => {
  if (!SUPPORTED_STATES.includes(stateAbbr)) {
    console.error(`State ${stateAbbr} is not supported by the API.`);
    return [];
  }

  const stateData = await fetchStates();
  const stateName = stateData.find(state => state.abbreviation === stateAbbr)?.name;

  if (!stateName) {
    console.error(`Full name for state ${stateAbbr} not found.`);
    return [];
  }

  try {
    const response = await fetch(`${BASE_URL}/countries/state/cities`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        country: 'United States',
        state: stateName,
      }),
    });
    if (!response.ok) {
      const text = await response.text();
      console.error('API response:', text);
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    console.log('Cities data:', data);
    return data.data.map(city => ({
      name: city,
      state: stateAbbr,
    }));
  } catch (error) {
    console.error('Error fetching cities:', error);
    return [];
  }
};
