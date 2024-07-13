import axios from 'axios';

const CORS_PROXY = 'https://cors-anywhere.herokuapp.com/';
const SAMHSA_API_BASE_URL = 'https://findtreatment.samhsa.gov/locator/listing';

export const fetchSAMHSAData = async () => {
  try {
    const response = await axios.get(CORS_PROXY + SAMHSA_API_BASE_URL);
    console.log('SAMHSA API response:', response.data);
    return response.data.results || [];
  } catch (error) {
    console.error('Error fetching SAMHSA data:', error);
    return [];
  }
};


export const transformSAMHSAData = (data) => {
    if (!Array.isArray(data) || data.length === 0) {
        console.log('No SAMHSA data to transform');
        return [];
    }
    // Define your category and subcategory mapping
    const categoryMapping = {
        'Substance Use': 'Substance Use Disorder',
        'Mental Health': 'Mental Health Treatment',
        // Add more mappings as needed
    };

    const subCategoryMapping = {
        'Outpatient': 'Outpatient Services',
        'Residential': 'Residential Treatment',
        // Add more mappings as needed
    };

    return data.map(item => ({
        name: item.name1,
        description: item.desc1,
        link: item.website,
        category: categoryMapping[item.categoryname] || 'Other',
        subCategory: subCategoryMapping[item.servicetype] || 'General',
        contactInfo: item.phone,
        address: `${item.street1}`,
        city: item.city,
        state: item.state,
        tags: [item.servicetype, item.categoryname],
    }));
};
