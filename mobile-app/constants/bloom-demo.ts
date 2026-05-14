export const bloomDemoPlants = [
  {
    name: 'Томат',
    status: 'Стабильно',
    moisture: '68%',
    levelPercent: 68,
    mode: 'По влажности',
  },
  {
    name: 'Огурец',
    status: 'Нужна проверка',
    moisture: '34%',
    levelPercent: 34,
    mode: 'По таймеру',
  },
  {
    name: 'Базилик',
    status: 'Стабильно',
    moisture: '59%',
    levelPercent: 59,
    mode: 'По влажности',
  },
  {
    name: 'Перец',
    status: 'Готов к циклу',
    moisture: '73%',
    levelPercent: 73,
    mode: 'По таймеру',
  },
  {
    name: 'Салат',
    status: 'Стабильно',
    moisture: '61%',
    levelPercent: 61,
    mode: 'Подсветка сбалансирована',
  },
] as const;

export const bloomDemoFeed = [
  {
    slug: 'greenhouse-01',
    name: 'Северная теплица',
    connected: true,
    lastEvent: 'Влажность в норме, утренний импульс полива завершился по расписанию.',
  },
  {
    slug: 'greenhouse-01',
    name: 'Стеллаж рассады',
    connected: true,
    lastEvent: 'Подсветка переключилась на дневной профиль без задержки команд.',
  },
  {
    slug: 'greenhouse-01',
    name: 'Тропический угол',
    connected: false,
    lastEvent: 'Один влажный контур ниже порога и просит ручную проверку.',
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
