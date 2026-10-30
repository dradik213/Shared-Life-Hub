/**
 * liveWeatherService.ts
 * Real-time, accurate online meteorological forecast service powered by Open-Meteo API.
 * Free, WMO-standard, open-access, requiring no proprietary API key.
 */

export interface WeatherLocation {
  name: string;
  admin1?: string;
  country?: string;
  latitude: number;
  longitude: number;
}

export interface HourlyPeriodForecast {
  period: 'Morning' | 'Midday' | 'Evening' | 'Night';
  time: string;
  temp: number;
  condition: string;
  iconName: 'Sun' | 'CloudSun' | 'Cloud' | 'CloudRain' | 'CloudLightning' | 'CloudSnow' | 'CloudDrizzle' | 'CloudFog' | 'Sunset' | 'Moon';
  humidity: number;
  windMph: number;
  precipChance: number;
}

export interface DayForecastData {
  dateStr: string; // YYYY-MM-DD
  highTemp: number;
  lowTemp: number;
  currentTemp?: number;
  condition: string;
  weatherCode: number;
  humidity: number;
  windMph: number;
  precipChance: number;
  isToday: boolean;
  isWithinHorizon: boolean;
  hourly: HourlyPeriodForecast[];
}

export interface LiveWeatherReport {
  location: WeatherLocation;
  fetchedAt: Date;
  days: Record<string, DayForecastData>; // indexed by YYYY-MM-DD
  current?: {
    temp: number;
    apparentTemp: number;
    humidity: number;
    windMph: number;
    condition: string;
    weatherCode: number;
  };
}

export const DEFAULT_LOCATION: WeatherLocation = {
  name: 'Austin',
  admin1: 'Texas',
  country: 'United States',
  latitude: 30.2672,
  longitude: -97.7431,
};

const STORAGE_LOCATION_KEY = 'sharedlifehub_weather_location';
const CACHE_KEY = 'sharedlifehub_weather_cache';
const CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes

export function getSavedLocation(): WeatherLocation {
  try {
    const raw = localStorage.getItem(STORAGE_LOCATION_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    // ignore
  }
  return DEFAULT_LOCATION;
}

export function saveLocation(loc: WeatherLocation): void {
  try {
    localStorage.setItem(STORAGE_LOCATION_KEY, JSON.stringify(loc));
  } catch (e) {
    // ignore
  }
}

export function getWeatherConditionText(code: number): { condition: string; icon: HourlyPeriodForecast['iconName'] } {
  switch (code) {
    case 0:
      return { condition: 'Clear & Sunny', icon: 'Sun' };
    case 1:
      return { condition: 'Mainly Clear', icon: 'Sun' };
    case 2:
      return { condition: 'Partly Cloudy', icon: 'CloudSun' };
    case 3:
      return { condition: 'Overcast', icon: 'Cloud' };
    case 45:
    case 48:
      return { condition: 'Fog & Mist', icon: 'CloudFog' };
    case 51:
    case 53:
    case 55:
      return { condition: 'Light Drizzle', icon: 'CloudDrizzle' };
    case 56:
    case 57:
      return { condition: 'Freezing Drizzle', icon: 'CloudSnow' };
    case 61:
      return { condition: 'Slight Rain', icon: 'CloudRain' };
    case 63:
      return { condition: 'Moderate Rain', icon: 'CloudRain' };
    case 65:
      return { condition: 'Heavy Rain', icon: 'CloudRain' };
    case 66:
    case 67:
      return { condition: 'Freezing Rain', icon: 'CloudSnow' };
    case 71:
    case 73:
    case 75:
      return { condition: 'Snowfall', icon: 'CloudSnow' };
    case 77:
      return { condition: 'Snow Grains', icon: 'CloudSnow' };
    case 80:
    case 81:
    case 82:
      return { condition: 'Rain Showers', icon: 'CloudRain' };
    case 85:
    case 86:
      return { condition: 'Snow Showers', icon: 'CloudSnow' };
    case 95:
      return { condition: 'Thunderstorm', icon: 'CloudLightning' };
    case 96:
    case 99:
      return { condition: 'Thunderstorm & Hail', icon: 'CloudLightning' };
    default:
      return { condition: 'Clear Sky', icon: 'Sun' };
  }
}

/**
 * Search locations using Open-Meteo Geocoding API
 */
export async function searchLocations(query: string): Promise<WeatherLocation[]> {
  const trimmed = query.trim();
  if (!trimmed || trimmed.length < 2) return [];

  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(trimmed)}&count=5&language=en&format=json`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Geocoding search failed');
  const data = await res.json();
  if (!data.results || !Array.isArray(data.results)) return [];

  return data.results.map((item: any) => ({
    name: item.name,
    admin1: item.admin1 || '',
    country: item.country || '',
    latitude: item.latitude,
    longitude: item.longitude,
  }));
}

/**
 * Fetch 14-day online weather forecast from Open-Meteo
 */
export async function fetchLiveForecast(loc: WeatherLocation, bypassCache = false): Promise<LiveWeatherReport> {
  // Check memory / localStorage cache first
  if (!bypassCache) {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        const age = Date.now() - new Date(parsed.fetchedAt).getTime();
        const sameLoc = Math.abs(parsed.location.latitude - loc.latitude) < 0.05 && 
                        Math.abs(parsed.location.longitude - loc.longitude) < 0.05;
        if (age < CACHE_TTL_MS && sameLoc) {
          parsed.fetchedAt = new Date(parsed.fetchedAt);
          return parsed;
        }
      }
    } catch (e) {
      // ignore
    }
  }

  const url = `https://api.open-meteo.com/v1/forecast?latitude=${loc.latitude}&longitude=${loc.longitude}&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,wind_speed_10m_max&hourly=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m,precipitation_probability&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m&temperature_unit=fahrenheit&wind_speed_unit=mph&precipitation_unit=inch&timezone=auto&forecast_days=14`;

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Open-Meteo request returned status ${res.status}`);
  }

  const data = await res.json();
  const cur = data.current;
  const daily = data.daily || {};
  const hourly = data.hourly || {};

  const currentCondition = cur ? getWeatherConditionText(cur.weather_code ?? 0) : null;
  const currentInfo = cur ? {
    temp: Math.round(cur.temperature_2m),
    apparentTemp: Math.round(cur.apparent_temperature ?? cur.temperature_2m),
    humidity: Math.round(cur.relative_humidity_2m),
    windMph: Math.round(cur.wind_speed_10m),
    condition: currentCondition?.condition || 'Clear',
    weatherCode: cur.weather_code ?? 0,
  } : undefined;

  const days: Record<string, DayForecastData> = {};
  const todayStr = new Date().toISOString().split('T')[0];

  if (daily.time && Array.isArray(daily.time)) {
    for (let i = 0; i < daily.time.length; i++) {
      const dateStr = daily.time[i];
      const wCode = daily.weather_code?.[i] ?? 0;
      const condInfo = getWeatherConditionText(wCode);
      const isToday = dateStr === todayStr;

      // Extract 4 periods from hourly data for this date
      // hourly.time contains strings like "2026-10-09T08:00"
      const morningIdx = hourly.time?.findIndex((t: string) => t === `${dateStr}T08:00`);
      const middayIdx = hourly.time?.findIndex((t: string) => t === `${dateStr}T13:00`);
      const eveningIdx = hourly.time?.findIndex((t: string) => t === `${dateStr}T18:00`);
      const nightIdx = hourly.time?.findIndex((t: string) => t === `${dateStr}T22:00`);

      const getPeriodData = (
        idx: number, 
        period: HourlyPeriodForecast['period'], 
        fallbackHourTime: string, 
        fallbackTemp: number, 
        fallbackIcon: HourlyPeriodForecast['iconName']
      ): HourlyPeriodForecast => {
        if (idx >= 0 && hourly.temperature_2m?.[idx] != null) {
          const code = hourly.weather_code?.[idx] ?? wCode;
          const { condition, icon } = getWeatherConditionText(code);
          return {
            period,
            time: fallbackHourTime,
            temp: Math.round(hourly.temperature_2m[idx]),
            condition,
            iconName: icon,
            humidity: Math.round(hourly.relative_humidity_2m?.[idx] ?? 50),
            windMph: Math.round(hourly.wind_speed_10m?.[idx] ?? 8),
            precipChance: Math.round(hourly.precipitation_probability?.[idx] ?? 0),
          };
        }
        return {
          period,
          time: fallbackHourTime,
          temp: fallbackTemp,
          condition: condInfo.condition,
          iconName: fallbackIcon,
          humidity: 50,
          windMph: 8,
          precipChance: 0,
        };
      };

      const high = Math.round(daily.temperature_2m_max?.[i] ?? 75);
      const low = Math.round(daily.temperature_2m_min?.[i] ?? 55);

      const morning = getPeriodData(morningIdx, 'Morning', '08:00 AM', low + 4, 'CloudSun');
      const midday = getPeriodData(middayIdx, 'Midday', '01:00 PM', high, 'Sun');
      const evening = getPeriodData(eveningIdx, 'Evening', '06:00 PM', high - 5, 'Sunset');
      const night = getPeriodData(nightIdx, 'Night', '10:00 PM', low + 2, 'Moon');

      days[dateStr] = {
        dateStr,
        highTemp: high,
        lowTemp: low,
        currentTemp: isToday && currentInfo ? currentInfo.temp : undefined,
        condition: condInfo.condition,
        weatherCode: wCode,
        humidity: Math.round(currentInfo && isToday ? currentInfo.humidity : 50),
        windMph: Math.round(daily.wind_speed_10m_max?.[i] ?? 8),
        precipChance: Math.round(daily.precipitation_probability_max?.[i] ?? 0),
        isToday,
        isWithinHorizon: true,
        hourly: [morning, midday, evening, night],
      };
    }
  }

  const report: LiveWeatherReport = {
    location: loc,
    fetchedAt: new Date(),
    days,
    current: currentInfo,
  };

  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(report));
  } catch (e) {
    // ignore
  }

  return report;
}
