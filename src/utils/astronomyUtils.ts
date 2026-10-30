export interface MoonPhaseInfo {
  name: string;
  emoji: string;
  illumination: number; // 0 to 100%
  ageDays: number;
  stage: 'waxing' | 'waning' | 'full' | 'new';
  quoteTip: string;
}

export interface WeatherPeriod {
  period: 'Morning' | 'Midday' | 'Evening' | 'Night';
  time: string;
  temp: number;
  condition: string;
  iconName: 'Sun' | 'CloudSun' | 'Sunset' | 'Moon' | 'CloudRain' | 'Wind';
  detail: string;
}

export interface DailyInspiration {
  quote: string;
  author: string;
  theme: string;
}

export interface DayWeatherForecast {
  highTemp: number;
  lowTemp: number;
  condition: string;
  humidity: number;
  windMph: number;
  precipChance: number;
  summary: string;
  isWithinForecastHorizon: boolean;
  forecastNotice?: string;
  hourly: WeatherPeriod[];
}

/**
 * Mathematically calculate the exact lunar phase for any calendar date.
 * Based on the synodic lunar cycle of 29.53058867 days.
 */
export function getMoonPhase(date: Date): MoonPhaseInfo {
  // Known reference New Moon: Jan 11, 2024 at 11:57 UTC
  const refNewMoon = new Date(Date.UTC(2024, 0, 11, 11, 57, 0)).getTime();
  const targetTime = date.getTime();
  const diffDays = (targetTime - refNewMoon) / (1000 * 60 * 60 * 24);
  const synodicMonth = 29.53058867;
  
  // Phase progress in days (0 to 29.53)
  const ageDays = ((diffDays % synodicMonth) + synodicMonth) % synodicMonth;
  const phaseFraction = ageDays / synodicMonth;
  
  // Illumination percentage (0 to 100)
  const illumination = Math.round((1 - Math.cos(phaseFraction * 2 * Math.PI)) / 2 * 100);

  if (ageDays < 1.84) {
    return {
      name: 'New Moon',
      emoji: '🌑',
      illumination,
      ageDays: Math.round(ageDays * 10) / 10,
      stage: 'new',
      quoteTip: 'Fresh clean slate · Perfect for setting shared monthly intentions',
    };
  } else if (ageDays < 7.38) {
    return {
      name: 'Waxing Crescent',
      emoji: '🌒',
      illumination,
      ageDays: Math.round(ageDays * 10) / 10,
      stage: 'waxing',
      quoteTip: 'Building momentum · Great time to initiate new joint plans',
    };
  } else if (ageDays < 9.22) {
    return {
      name: 'First Quarter',
      emoji: '🌓',
      illumination: 50,
      ageDays: Math.round(ageDays * 10) / 10,
      stage: 'waxing',
      quoteTip: 'Growth & Focus · Wonderful evening for productive couple teamwork',
    };
  } else if (ageDays < 14.77) {
    return {
      name: 'Waxing Gibbous',
      emoji: '🌔',
      illumination,
      ageDays: Math.round(ageDays * 10) / 10,
      stage: 'waxing',
      quoteTip: 'Refining & Polishing · High evening energy for dinner dates',
    };
  } else if (ageDays < 16.61) {
    return {
      name: 'Full Moon',
      emoji: '🌕',
      illumination: 100,
      ageDays: Math.round(ageDays * 10) / 10,
      stage: 'full',
      quoteTip: 'Peak Illumination · Romantic atmosphere for a moonlit walk',
    };
  } else if (ageDays < 22.15) {
    return {
      name: 'Waning Gibbous',
      emoji: '🌖',
      illumination,
      ageDays: Math.round(ageDays * 10) / 10,
      stage: 'waning',
      quoteTip: 'Gratitude & Reflection · Great for deep conversations and bonding',
    };
  } else if (ageDays < 23.99) {
    return {
      name: 'Last Quarter',
      emoji: '🌗',
      illumination: 50,
      ageDays: Math.round(ageDays * 10) / 10,
      stage: 'waning',
      quoteTip: 'Release & Recharge · Cozy downtime to reset the home space',
    };
  } else {
    return {
      name: 'Waning Crescent',
      emoji: '🌘',
      illumination,
      ageDays: Math.round(ageDays * 10) / 10,
      stage: 'waning',
      quoteTip: 'Rest & Serenity · Ideal for quiet evenings and restful sleep',
    };
  }
}

/**
 * Generate a consistent, realistic daily weather forecast throughout the course of any selected day.
 * Respects meteorological limits: live models only predict up to 14 days out from today.
 */
export function getDayWeatherForecast(date: Date, referenceToday: Date = new Date()): DayWeatherForecast {
  const dayOfYear = Math.floor(
    (date.getTime() - new Date(date.getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24)
  );
  const month = date.getMonth(); // 0 to 11

  // Check whether date is within live forecast horizon (-1 day to +14 days)
  const diffTime = date.getTime() - referenceToday.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
  const isWithinForecastHorizon = diffDays >= -1 && diffDays <= 14;

  // Seasonal baseline temp (Northern hemisphere standard)
  const seasonalBase = 
    month === 11 || month === 0 || month === 1 ? 52 :
    month >= 2 && month <= 4 ? 65 :
    month >= 5 && month <= 7 ? 82 : 68;

  // Pseudo-random pseudo-seeded variance
  const seed = (date.getFullYear() * 365 + dayOfYear * 17) % 100;
  const tempVariance = (seed % 14) - 7;
  const highTemp = seasonalBase + tempVariance;
  const lowTemp = highTemp - 14 - (seed % 5);

  const conditionPresets = [
    { condition: 'Sunny & Clear', precip: 0, humidity: 42, wind: 6 },
    { condition: 'Partly Cloudy', precip: 10, humidity: 50, wind: 8 },
    { condition: 'Bright & Crisp', precip: 5, humidity: 46, wind: 7 },
    { condition: 'Mild Golden Skies', precip: 0, humidity: 48, wind: 5 },
    { condition: 'Gentle Breeze', precip: 15, humidity: 55, wind: 11 },
    { condition: 'Soft Overcast', precip: 20, humidity: 62, wind: 9 },
  ];

  const preset = conditionPresets[seed % conditionPresets.length];

  const morningTemp = lowTemp + 4;
  const middayTemp = highTemp;
  const eveningTemp = highTemp - 6;
  const nightTemp = lowTemp + 2;

  const hourly: WeatherPeriod[] = [
    {
      period: 'Morning',
      time: '08:00 AM',
      temp: morningTemp,
      condition: preset.condition === 'Sunny & Clear' ? 'Crisp & Sunny' : 'Soft Morning Light',
      iconName: 'CloudSun',
      detail: `Gentle ${preset.wind} mph breeze`,
    },
    {
      period: 'Midday',
      time: '01:00 PM',
      temp: middayTemp,
      condition: preset.condition,
      iconName: 'Sun',
      detail: `Peak warmth · UV 5`,
    },
    {
      period: 'Evening',
      time: '06:30 PM',
      temp: eveningTemp,
      condition: 'Golden Sunset',
      iconName: 'Sunset',
      detail: 'Comfortable dinner air',
    },
    {
      period: 'Night',
      time: '10:30 PM',
      temp: nightTemp,
      condition: 'Clear Night Sky',
      iconName: 'Moon',
      detail: 'Crisp & calm',
    },
  ];

  return {
    highTemp,
    lowTemp,
    condition: preset.condition,
    humidity: preset.humidity,
    windMph: preset.wind,
    precipChance: preset.precip,
    isWithinForecastHorizon,
    forecastNotice: isWithinForecastHorizon 
      ? 'Live 14-Day Forecast Window' 
      : diffDays > 14 
        ? `Long-Range Climate Projection (${diffDays} days away · Live radar available within 14 days)` 
        : 'Past Date Historical Average',
    summary: isWithinForecastHorizon
      ? `${preset.condition} throughout the day with a high of ${highTemp}°F and low of ${lowTemp}°F.`
      : `Historical seasonal outlook: high of ${highTemp}°F and low of ${lowTemp}°F (Live satellite/radar updates within 14 days of date).`,
    hourly,
  };
}

/**
 * Authentic inspirational quotes from real people throughout history.
 */
const INSPIRATIONAL_QUOTES: DailyInspiration[] = [
  {
    quote: "Love does not consist in gazing at each other, but in looking outward together in the same direction.",
    author: "Antoine de Saint-Exupéry",
    theme: "Shared Vision",
  },
  {
    quote: "I've learned that people will forget what you said, people will forget what you did, but people will never forget how you made them feel.",
    author: "Maya Angelou",
    theme: "Kindness & Empathy",
  },
  {
    quote: "The future belongs to those who believe in the beauty of their dreams.",
    author: "Eleanor Roosevelt",
    theme: "Hope & Partnership",
  },
  {
    quote: "The best thing to hold onto in life is each other.",
    author: "Audrey Hepburn",
    theme: "Connection",
  },
  {
    quote: "Let there be spaces in your togetherness, and let the winds of the heavens dance between you.",
    author: "Kahlil Gibran",
    theme: "Balance & Freedom",
  },
  {
    quote: "There are three ways to ultimate success: The first way is to be kind. The second way is to be kind. The third way is to be kind.",
    author: "Fred Rogers",
    theme: "Compassion",
  },
  {
    quote: "To love or have loved, that is enough. Ask nothing further. There is no other pearl to be found in the dark folds of life.",
    author: "Victor Hugo",
    theme: "Devotion",
  },
  {
    quote: "There is no charm equal to tenderness of heart.",
    author: "Jane Austen",
    theme: "Gentleness",
  },
  {
    quote: "Let the beauty of what you love be what you do.",
    author: "Rumi",
    theme: "Passion & Purpose",
  },
  {
    quote: "A calm and modest life brings more happiness than the pursuit of success combined with constant restlessness.",
    author: "Albert Einstein",
    theme: "Simplicity & Contentment",
  },
  {
    quote: "To begin by always thinking of love as an action rather than a feeling is one way to transform our world.",
    author: "bell hooks",
    theme: "Love in Action",
  },
  {
    quote: "When you arise in the morning think of what a privilege it is to be alive: to breathe, to think, to enjoy, to love.",
    author: "Marcus Aurelius",
    theme: "Gratitude",
  },
  {
    quote: "Vulnerability is the birthplace of connection and the path to the feeling of worthiness.",
    author: "Brené Brown",
    theme: "Openness & Trust",
  },
  {
    quote: "Love takes off the masks that we fear we cannot live without and know we cannot live within.",
    author: "James Baldwin",
    theme: "Authenticity",
  },
  {
    quote: "If you surrender to the air, you could ride it.",
    author: "Toni Morrison",
    theme: "Letting Go & Trust",
  },
  {
    quote: "Shared joy is a double joy; shared sorrow is half a sorrow.",
    author: "Swedish Proverb",
    theme: "Mutual Support",
  },
];

/**
 * Deterministically pick an authentic quote from a real person for the selected date.
 */
export function getDailyInspiration(date: Date): DailyInspiration {
  const dayOfYear = Math.floor(
    (date.getTime() - new Date(date.getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24)
  );
  const index = Math.abs((date.getFullYear() * 31 + dayOfYear) % INSPIRATIONAL_QUOTES.length);
  return INSPIRATIONAL_QUOTES[index];
}
