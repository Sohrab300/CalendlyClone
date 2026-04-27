export interface Timezone {
  name: string;
  label: string;
  region: string;
  offset: number; // Offset in minutes from UTC
}

export const timezones: Timezone[] = [
  // US/CANADA
  { name: 'Pacific Time - US & Canada', label: 'Pacific Time - US & Canada', region: 'US/CANADA', offset: -420 },
  { name: 'Mountain Time - US & Canada', label: 'Mountain Time - US & Canada', region: 'US/CANADA', offset: -360 },
  { name: 'Central Time - US & Canada', label: 'Central Time - US & Canada', region: 'US/CANADA', offset: -300 },
  { name: 'Eastern Time - US & Canada', label: 'Eastern Time - US & Canada', region: 'US/CANADA', offset: -240 },
  { name: 'Alaska Time', label: 'Alaska Time', region: 'US/CANADA', offset: -480 },
  { name: 'Hawaii Time', label: 'Hawaii Time', region: 'US/CANADA', offset: -600 },
  
  // AMERICA
  { name: 'America/Adak', label: 'America/Adak', region: 'AMERICA', offset: -540 },
  { name: 'Buenos Aires Time', label: 'Buenos Aires Time', region: 'AMERICA', offset: -180 },
  { name: 'Asuncion Time', label: 'Asuncion Time', region: 'AMERICA', offset: -180 },
  { name: 'Bogota, Jamaica, Lima Time', label: 'Bogota, Jamaica, Lima Time', region: 'AMERICA', offset: -300 },
  { name: 'America/Caracas', label: 'America/Caracas', region: 'AMERICA', offset: -240 },
  
  // EUROPE
  { name: 'London, Dublin, Lisbon Time', label: 'London, Dublin, Lisbon Time', region: 'EUROPE', offset: 60 },
  { name: 'Paris, Berlin, Rome Time', label: 'Paris, Berlin, Rome Time', region: 'EUROPE', offset: 120 },
  
  // ASIA
  { name: 'India Standard Time', label: 'India Standard Time', region: 'ASIA', offset: 330 },
  { name: 'China Standard Time', label: 'China Standard Time', region: 'ASIA', offset: 480 },
  { name: 'Tokyo Standard Time', label: 'Tokyo Standard Time', region: 'ASIA', offset: 540 },
];
