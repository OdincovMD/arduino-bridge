export type PlantSummary = {
  name: string;
  mode: string;
  moisture: string;
  levelPercent: number;
};

export type DeviceCard = {
  slug: string;
  name: string;
  connected: boolean;
  plantsOnline: number;
  pendingCommands: number;
  lightTemplate: string;
  lastHeartbeat: string;
  lastEvent: string;
  plants: PlantSummary[];
};

export type ActivityItem = {
  id: string;
  title: string;
  description: string;
  time: string;
};

export const mockDevices: DeviceCard[] = [
  {
    slug: 'greenhouse-01',
    name: 'Северная стойка',
    connected: true,
    plantsOnline: 4,
    pendingCommands: 2,
    lightTemplate: 'Утренний цикл',
    lastHeartbeat: '12 сек назад',
    lastEvent: 'EVT|v1|0|WATERING_STARTED|PLANT=2',
    plants: [
      { name: 'Базилик', mode: 'По влажности', moisture: '41%', levelPercent: 41 },
      { name: 'Мята', mode: 'По таймеру', moisture: '63%', levelPercent: 63 },
      { name: 'Томат', mode: 'По влажности', moisture: '52%', levelPercent: 52 },
      { name: 'Перец', mode: 'Отключено', moisture: '28%', levelPercent: 28 },
    ],
  },
  {
    slug: 'greenhouse-02',
    name: 'Зона рассады',
    connected: true,
    plantsOnline: 3,
    pendingCommands: 0,
    lightTemplate: 'Мягкий старт',
    lastHeartbeat: '26 сек назад',
    lastEvent: 'STATE|v1|0|LIGHT|STATE=ON|TIMER=1|TEMPLATE=2',
    plants: [
      { name: 'Рассада A', mode: 'По таймеру', moisture: '58%', levelPercent: 58 },
      { name: 'Рассада B', mode: 'По влажности', moisture: '47%', levelPercent: 47 },
      { name: 'Стеллаж черенков', mode: 'По влажности', moisture: '36%', levelPercent: 36 },
    ],
  },
];

export const mockActivity: ActivityItem[] = [
  {
    id: 'evt-1',
    title: 'Команда принята',
    description: 'greenhouse-01 получил LIGHT_MANUAL с высоким приоритетом и временным окном 30 минут.',
    time: 'сейчас',
  },
  {
    id: 'evt-2',
    title: 'Полив завершён',
    description: 'greenhouse-02 завершил ручной полив для каналов 0 и 2 без ошибок исполнения.',
    time: '4 мин',
  },
  {
    id: 'evt-3',
    title: 'Снимок синхронизирован',
    description: 'Последние блоки STATE получены от обоих контроллеров и обновили мобильный кэш.',
    time: '12 мин',
  },
  {
    id: 'evt-4',
    title: 'Пульс связи восстановлен',
    description: 'Северная стойка временно увеличила интервал heartbeat, но связь восстановилась на следующем опросе.',
    time: '18 мин',
  },
];

export const mockCommandStats = [
  { label: 'В очереди', value: '02' },
  { label: 'Доставлено', value: '18' },
  { label: 'Ошибок за день', value: '01' },
];
