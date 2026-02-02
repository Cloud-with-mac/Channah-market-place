// Countries with their states/provinces
export interface StateProvince {
  name: string;
  code: string;
}

export interface Country {
  name: string;
  code: string;
  states: StateProvince[];
}

export const countries: Country[] = [
  {
    name: 'Nigeria', code: 'NG',
    states: [
      { name: 'Abia', code: 'AB' }, { name: 'Adamawa', code: 'AD' }, { name: 'Akwa Ibom', code: 'AK' },
      { name: 'Anambra', code: 'AN' }, { name: 'Bauchi', code: 'BA' }, { name: 'Bayelsa', code: 'BY' },
      { name: 'Benue', code: 'BE' }, { name: 'Borno', code: 'BO' }, { name: 'Cross River', code: 'CR' },
      { name: 'Delta', code: 'DE' }, { name: 'Ebonyi', code: 'EB' }, { name: 'Edo', code: 'ED' },
      { name: 'Ekiti', code: 'EK' }, { name: 'Enugu', code: 'EN' }, { name: 'FCT Abuja', code: 'FC' },
      { name: 'Gombe', code: 'GO' }, { name: 'Imo', code: 'IM' }, { name: 'Jigawa', code: 'JI' },
      { name: 'Kaduna', code: 'KD' }, { name: 'Kano', code: 'KN' }, { name: 'Katsina', code: 'KT' },
      { name: 'Kebbi', code: 'KE' }, { name: 'Kogi', code: 'KO' }, { name: 'Kwara', code: 'KW' },
      { name: 'Lagos', code: 'LA' }, { name: 'Nasarawa', code: 'NA' }, { name: 'Niger', code: 'NI' },
      { name: 'Ogun', code: 'OG' }, { name: 'Ondo', code: 'ON' }, { name: 'Osun', code: 'OS' },
      { name: 'Oyo', code: 'OY' }, { name: 'Plateau', code: 'PL' }, { name: 'Rivers', code: 'RI' },
      { name: 'Sokoto', code: 'SO' }, { name: 'Taraba', code: 'TA' }, { name: 'Yobe', code: 'YO' },
      { name: 'Zamfara', code: 'ZA' },
    ],
  },
  {
    name: 'United States', code: 'US',
    states: [
      { name: 'Alabama', code: 'AL' }, { name: 'Alaska', code: 'AK' }, { name: 'Arizona', code: 'AZ' },
      { name: 'Arkansas', code: 'AR' }, { name: 'California', code: 'CA' }, { name: 'Colorado', code: 'CO' },
      { name: 'Connecticut', code: 'CT' }, { name: 'Delaware', code: 'DE' }, { name: 'Florida', code: 'FL' },
      { name: 'Georgia', code: 'GA' }, { name: 'Hawaii', code: 'HI' }, { name: 'Idaho', code: 'ID' },
      { name: 'Illinois', code: 'IL' }, { name: 'Indiana', code: 'IN' }, { name: 'Iowa', code: 'IA' },
      { name: 'Kansas', code: 'KS' }, { name: 'Kentucky', code: 'KY' }, { name: 'Louisiana', code: 'LA' },
      { name: 'Maine', code: 'ME' }, { name: 'Maryland', code: 'MD' }, { name: 'Massachusetts', code: 'MA' },
      { name: 'Michigan', code: 'MI' }, { name: 'Minnesota', code: 'MN' }, { name: 'Mississippi', code: 'MS' },
      { name: 'Missouri', code: 'MO' }, { name: 'Montana', code: 'MT' }, { name: 'Nebraska', code: 'NE' },
      { name: 'Nevada', code: 'NV' }, { name: 'New Hampshire', code: 'NH' }, { name: 'New Jersey', code: 'NJ' },
      { name: 'New Mexico', code: 'NM' }, { name: 'New York', code: 'NY' }, { name: 'North Carolina', code: 'NC' },
      { name: 'North Dakota', code: 'ND' }, { name: 'Ohio', code: 'OH' }, { name: 'Oklahoma', code: 'OK' },
      { name: 'Oregon', code: 'OR' }, { name: 'Pennsylvania', code: 'PA' }, { name: 'Rhode Island', code: 'RI' },
      { name: 'South Carolina', code: 'SC' }, { name: 'South Dakota', code: 'SD' }, { name: 'Tennessee', code: 'TN' },
      { name: 'Texas', code: 'TX' }, { name: 'Utah', code: 'UT' }, { name: 'Vermont', code: 'VT' },
      { name: 'Virginia', code: 'VA' }, { name: 'Washington', code: 'WA' }, { name: 'West Virginia', code: 'WV' },
      { name: 'Wisconsin', code: 'WI' }, { name: 'Wyoming', code: 'WY' },
    ],
  },
  {
    name: 'United Kingdom', code: 'GB',
    states: [
      { name: 'England', code: 'ENG' }, { name: 'Scotland', code: 'SCT' },
      { name: 'Wales', code: 'WLS' }, { name: 'Northern Ireland', code: 'NIR' },
    ],
  },
  {
    name: 'Canada', code: 'CA',
    states: [
      { name: 'Alberta', code: 'AB' }, { name: 'British Columbia', code: 'BC' },
      { name: 'Manitoba', code: 'MB' }, { name: 'New Brunswick', code: 'NB' },
      { name: 'Newfoundland and Labrador', code: 'NL' }, { name: 'Nova Scotia', code: 'NS' },
      { name: 'Ontario', code: 'ON' }, { name: 'Prince Edward Island', code: 'PE' },
      { name: 'Quebec', code: 'QC' }, { name: 'Saskatchewan', code: 'SK' },
    ],
  },
  {
    name: 'Ghana', code: 'GH',
    states: [
      { name: 'Greater Accra', code: 'AA' }, { name: 'Ashanti', code: 'AH' },
      { name: 'Central', code: 'CP' }, { name: 'Eastern', code: 'EP' },
      { name: 'Northern', code: 'NP' }, { name: 'Upper East', code: 'UE' },
      { name: 'Upper West', code: 'UW' }, { name: 'Volta', code: 'TV' },
      { name: 'Western', code: 'WP' }, { name: 'Bono', code: 'BO' },
      { name: 'Bono East', code: 'BE' }, { name: 'Ahafo', code: 'AF' },
      { name: 'Savannah', code: 'SV' }, { name: 'North East', code: 'NE' },
      { name: 'Oti', code: 'OT' }, { name: 'Western North', code: 'WN' },
    ],
  },
  {
    name: 'South Africa', code: 'ZA',
    states: [
      { name: 'Eastern Cape', code: 'EC' }, { name: 'Free State', code: 'FS' },
      { name: 'Gauteng', code: 'GP' }, { name: 'KwaZulu-Natal', code: 'KZN' },
      { name: 'Limpopo', code: 'LP' }, { name: 'Mpumalanga', code: 'MP' },
      { name: 'North West', code: 'NW' }, { name: 'Northern Cape', code: 'NC' },
      { name: 'Western Cape', code: 'WC' },
    ],
  },
  {
    name: 'Kenya', code: 'KE',
    states: [
      { name: 'Nairobi', code: 'NBO' }, { name: 'Mombasa', code: 'MBS' },
      { name: 'Kisumu', code: 'KSM' }, { name: 'Nakuru', code: 'NKR' },
      { name: 'Kiambu', code: 'KBU' }, { name: 'Machakos', code: 'MKS' },
      { name: 'Kajiado', code: 'KJD' }, { name: 'Kilifi', code: 'KLF' },
    ],
  },
  {
    name: 'India', code: 'IN',
    states: [
      { name: 'Andhra Pradesh', code: 'AP' }, { name: 'Bihar', code: 'BR' },
      { name: 'Delhi', code: 'DL' }, { name: 'Goa', code: 'GA' },
      { name: 'Gujarat', code: 'GJ' }, { name: 'Haryana', code: 'HR' },
      { name: 'Karnataka', code: 'KA' }, { name: 'Kerala', code: 'KL' },
      { name: 'Madhya Pradesh', code: 'MP' }, { name: 'Maharashtra', code: 'MH' },
      { name: 'Punjab', code: 'PB' }, { name: 'Rajasthan', code: 'RJ' },
      { name: 'Tamil Nadu', code: 'TN' }, { name: 'Telangana', code: 'TG' },
      { name: 'Uttar Pradesh', code: 'UP' }, { name: 'West Bengal', code: 'WB' },
    ],
  },
  {
    name: 'Australia', code: 'AU',
    states: [
      { name: 'New South Wales', code: 'NSW' }, { name: 'Victoria', code: 'VIC' },
      { name: 'Queensland', code: 'QLD' }, { name: 'Western Australia', code: 'WA' },
      { name: 'South Australia', code: 'SA' }, { name: 'Tasmania', code: 'TAS' },
      { name: 'ACT', code: 'ACT' }, { name: 'Northern Territory', code: 'NT' },
    ],
  },
  {
    name: 'Germany', code: 'DE',
    states: [
      { name: 'Baden-Württemberg', code: 'BW' }, { name: 'Bavaria', code: 'BY' },
      { name: 'Berlin', code: 'BE' }, { name: 'Brandenburg', code: 'BB' },
      { name: 'Hamburg', code: 'HH' }, { name: 'Hesse', code: 'HE' },
      { name: 'Lower Saxony', code: 'NI' }, { name: 'North Rhine-Westphalia', code: 'NW' },
      { name: 'Saxony', code: 'SN' },
    ],
  },
  {
    name: 'France', code: 'FR',
    states: [
      { name: 'Île-de-France', code: 'IDF' }, { name: 'Provence-Alpes-Côte d\'Azur', code: 'PAC' },
      { name: 'Auvergne-Rhône-Alpes', code: 'ARA' }, { name: 'Occitanie', code: 'OCC' },
      { name: 'Nouvelle-Aquitaine', code: 'NAQ' }, { name: 'Hauts-de-France', code: 'HDF' },
      { name: 'Grand Est', code: 'GES' }, { name: 'Brittany', code: 'BRE' },
    ],
  },
  {
    name: 'Brazil', code: 'BR',
    states: [
      { name: 'São Paulo', code: 'SP' }, { name: 'Rio de Janeiro', code: 'RJ' },
      { name: 'Minas Gerais', code: 'MG' }, { name: 'Bahia', code: 'BA' },
      { name: 'Paraná', code: 'PR' }, { name: 'Rio Grande do Sul', code: 'RS' },
      { name: 'Pernambuco', code: 'PE' }, { name: 'Ceará', code: 'CE' },
    ],
  },
  {
    name: 'China', code: 'CN',
    states: [
      { name: 'Beijing', code: 'BJ' }, { name: 'Shanghai', code: 'SH' },
      { name: 'Guangdong', code: 'GD' }, { name: 'Zhejiang', code: 'ZJ' },
      { name: 'Jiangsu', code: 'JS' }, { name: 'Sichuan', code: 'SC' },
      { name: 'Hubei', code: 'HB' }, { name: 'Fujian', code: 'FJ' },
    ],
  },
  {
    name: 'Japan', code: 'JP',
    states: [
      { name: 'Tokyo', code: 'TK' }, { name: 'Osaka', code: 'OS' },
      { name: 'Kyoto', code: 'KY' }, { name: 'Hokkaido', code: 'HK' },
      { name: 'Aichi', code: 'AI' }, { name: 'Fukuoka', code: 'FK' },
    ],
  },
  {
    name: 'United Arab Emirates', code: 'AE',
    states: [
      { name: 'Abu Dhabi', code: 'AZ' }, { name: 'Dubai', code: 'DU' },
      { name: 'Sharjah', code: 'SH' }, { name: 'Ajman', code: 'AJ' },
      { name: 'Fujairah', code: 'FU' }, { name: 'Ras Al Khaimah', code: 'RK' },
      { name: 'Umm Al Quwain', code: 'UQ' },
    ],
  },
  {
    name: 'Saudi Arabia', code: 'SA',
    states: [
      { name: 'Riyadh', code: 'RD' }, { name: 'Mecca', code: 'MK' },
      { name: 'Medina', code: 'MD' }, { name: 'Eastern Province', code: 'EP' },
      { name: 'Asir', code: 'AS' }, { name: 'Tabuk', code: 'TB' },
    ],
  },
  {
    name: 'Egypt', code: 'EG',
    states: [
      { name: 'Cairo', code: 'C' }, { name: 'Alexandria', code: 'ALX' },
      { name: 'Giza', code: 'GZ' }, { name: 'Luxor', code: 'LX' },
      { name: 'Aswan', code: 'ASN' }, { name: 'Red Sea', code: 'RS' },
    ],
  },
  {
    name: 'Tanzania', code: 'TZ',
    states: [
      { name: 'Dar es Salaam', code: 'DS' }, { name: 'Dodoma', code: 'DO' },
      { name: 'Arusha', code: 'AR' }, { name: 'Mwanza', code: 'MW' },
      { name: 'Zanzibar', code: 'ZN' },
    ],
  },
  {
    name: 'Ethiopia', code: 'ET',
    states: [
      { name: 'Addis Ababa', code: 'AA' }, { name: 'Oromia', code: 'OR' },
      { name: 'Amhara', code: 'AM' }, { name: 'Tigray', code: 'TI' },
      { name: 'SNNPR', code: 'SN' },
    ],
  },
  {
    name: 'Cameroon', code: 'CM',
    states: [
      { name: 'Centre', code: 'CE' }, { name: 'Littoral', code: 'LT' },
      { name: 'West', code: 'OU' }, { name: 'North West', code: 'NW' },
      { name: 'South West', code: 'SW' }, { name: 'East', code: 'ES' },
      { name: 'Adamawa', code: 'AD' }, { name: 'North', code: 'NO' },
      { name: 'Far North', code: 'EN' }, { name: 'South', code: 'SU' },
    ],
  },
  {
    name: 'Mexico', code: 'MX',
    states: [
      { name: 'Mexico City', code: 'CMX' }, { name: 'Jalisco', code: 'JAL' },
      { name: 'Nuevo León', code: 'NLE' }, { name: 'Puebla', code: 'PUE' },
      { name: 'Guanajuato', code: 'GUA' }, { name: 'Chihuahua', code: 'CHH' },
    ],
  },
  {
    name: 'Singapore', code: 'SG',
    states: [],
  },
  {
    name: 'Malaysia', code: 'MY',
    states: [
      { name: 'Kuala Lumpur', code: 'KL' }, { name: 'Selangor', code: 'SL' },
      { name: 'Penang', code: 'PG' }, { name: 'Johor', code: 'JH' },
      { name: 'Sabah', code: 'SB' }, { name: 'Sarawak', code: 'SR' },
    ],
  },
  {
    name: 'Indonesia', code: 'ID',
    states: [
      { name: 'Jakarta', code: 'JK' }, { name: 'West Java', code: 'JB' },
      { name: 'East Java', code: 'JI' }, { name: 'Central Java', code: 'JT' },
      { name: 'Bali', code: 'BA' },
    ],
  },
  {
    name: 'Philippines', code: 'PH',
    states: [
      { name: 'Metro Manila', code: 'NCR' }, { name: 'Cebu', code: 'CEB' },
      { name: 'Davao', code: 'DAV' }, { name: 'Calabarzon', code: 'CAL' },
    ],
  },
  {
    name: 'Pakistan', code: 'PK',
    states: [
      { name: 'Punjab', code: 'PB' }, { name: 'Sindh', code: 'SD' },
      { name: 'Khyber Pakhtunkhwa', code: 'KP' }, { name: 'Balochistan', code: 'BA' },
      { name: 'Islamabad', code: 'IS' },
    ],
  },
  {
    name: 'Bangladesh', code: 'BD',
    states: [
      { name: 'Dhaka', code: 'DH' }, { name: 'Chittagong', code: 'CG' },
      { name: 'Rajshahi', code: 'RJ' }, { name: 'Khulna', code: 'KH' },
      { name: 'Sylhet', code: 'SY' },
    ],
  },
  {
    name: 'Turkey', code: 'TR',
    states: [
      { name: 'Istanbul', code: 'IST' }, { name: 'Ankara', code: 'ANK' },
      { name: 'Izmir', code: 'IZM' }, { name: 'Antalya', code: 'ANT' },
      { name: 'Bursa', code: 'BRS' },
    ],
  },
  {
    name: 'Russia', code: 'RU',
    states: [
      { name: 'Moscow', code: 'MOW' }, { name: 'Saint Petersburg', code: 'SPE' },
      { name: 'Novosibirsk', code: 'NVS' }, { name: 'Yekaterinburg', code: 'SVE' },
    ],
  },
  {
    name: 'Italy', code: 'IT',
    states: [
      { name: 'Lombardy', code: 'LOM' }, { name: 'Lazio', code: 'LAZ' },
      { name: 'Campania', code: 'CAM' }, { name: 'Sicily', code: 'SIC' },
      { name: 'Veneto', code: 'VEN' }, { name: 'Tuscany', code: 'TOS' },
    ],
  },
  {
    name: 'Spain', code: 'ES',
    states: [
      { name: 'Madrid', code: 'MD' }, { name: 'Catalonia', code: 'CT' },
      { name: 'Andalusia', code: 'AN' }, { name: 'Valencia', code: 'VC' },
      { name: 'Basque Country', code: 'PV' },
    ],
  },
  {
    name: 'Netherlands', code: 'NL',
    states: [
      { name: 'North Holland', code: 'NH' }, { name: 'South Holland', code: 'ZH' },
      { name: 'Utrecht', code: 'UT' }, { name: 'North Brabant', code: 'NB' },
    ],
  },
  {
    name: 'Rwanda', code: 'RW',
    states: [
      { name: 'Kigali', code: 'KV' }, { name: 'Eastern', code: 'ES' },
      { name: 'Northern', code: 'NO' }, { name: 'Southern', code: 'SU' },
      { name: 'Western', code: 'OU' },
    ],
  },
  {
    name: 'Uganda', code: 'UG',
    states: [
      { name: 'Central', code: 'C' }, { name: 'Eastern', code: 'E' },
      { name: 'Northern', code: 'N' }, { name: 'Western', code: 'W' },
    ],
  },
  {
    name: 'Ivory Coast', code: 'CI',
    states: [
      { name: 'Abidjan', code: 'AB' }, { name: 'Yamoussoukro', code: 'YM' },
      { name: 'Bouaké', code: 'BK' },
    ],
  },
  {
    name: 'Senegal', code: 'SN',
    states: [
      { name: 'Dakar', code: 'DK' }, { name: 'Thiès', code: 'TH' },
      { name: 'Saint-Louis', code: 'SL' },
    ],
  },
  {
    name: 'Morocco', code: 'MA',
    states: [
      { name: 'Casablanca-Settat', code: 'CS' }, { name: 'Rabat-Salé-Kénitra', code: 'RK' },
      { name: 'Marrakech-Safi', code: 'MS' }, { name: 'Fès-Meknès', code: 'FM' },
      { name: 'Tanger-Tétouan-Al Hoceima', code: 'TH' },
    ],
  },
];
