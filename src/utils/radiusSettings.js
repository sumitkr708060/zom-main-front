const KEY = 'zomitron_radius_settings';

export const loadRadiusSettings = () => {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { defaultRadius: 100, byCity: {} };
    const parsed = JSON.parse(raw);
    return {
      defaultRadius: Number(parsed.defaultRadius) || 100,
      byCity: parsed.byCity || {},
    };
  } catch {
    return { defaultRadius: 100, byCity: {} };
  }
};

export const saveRadiusSettings = (settings) => {
  const safe = {
    defaultRadius: Number(settings.defaultRadius) || 100,
    byCity: settings.byCity || {},
  };
  localStorage.setItem(KEY, JSON.stringify(safe));
};
