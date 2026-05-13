export const bloomDemoPlants = [
  {
    name: 'Anthurium',
    status: 'Healthy',
    moisture: '68%',
    levelPercent: 68,
    mode: 'Daily mist',
  },
  {
    name: 'Monstera',
    status: 'Need attention',
    moisture: '34%',
    levelPercent: 34,
    mode: 'Deep watering',
  },
  {
    name: 'Calathea',
    status: 'Healthy',
    moisture: '59%',
    levelPercent: 59,
    mode: 'Shade cycle',
  },
  {
    name: 'Peace Lily',
    status: 'Ready to trim',
    moisture: '73%',
    levelPercent: 73,
    mode: 'Weekly feed',
  },
  {
    name: 'Areca Palm',
    status: 'Healthy',
    moisture: '61%',
    levelPercent: 61,
    mode: 'Balanced light',
  },
] as const;

export const bloomDemoFeed = [
  {
    slug: 'greenhouse-01',
    name: 'North Greenhouse',
    connected: true,
    lastEvent: 'Moisture levels are stable and the morning watering pulse finished on time.',
  },
  {
    slug: 'greenhouse-01',
    name: 'Propagation Bench',
    connected: true,
    lastEvent: 'Grow lights switched to the afternoon preset with no delayed commands.',
  },
  {
    slug: 'greenhouse-01',
    name: 'Tropical Corner',
    connected: false,
    lastEvent: 'One humid zone is below target and wants a quick manual check.',
  },
] as const;

export const bloomDemoStats = {
  light: 74,
  moisture: 63,
  humidity: 71,
  temperature: 27,
  liveDevices: 3,
  needsAttention: 1,
} as const;
