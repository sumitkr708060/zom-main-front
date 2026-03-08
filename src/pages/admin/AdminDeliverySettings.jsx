import { useEffect, useMemo, useState } from 'react';
import { saveRadiusSettings, loadRadiusSettings } from '../../utils/radiusSettings';

export default function AdminDeliverySettings() {
  const [defaultRadius, setDefaultRadius] = useState(100);
  const [city, setCity] = useState('');
  const [radius, setRadius] = useState(100);
  const [cityMap, setCityMap] = useState({});

  useEffect(() => {
    const { defaultRadius, byCity } = loadRadiusSettings();
    setDefaultRadius(defaultRadius);
    setCityMap(byCity);
  }, []);

  const cityEntries = useMemo(() => Object.entries(cityMap), [cityMap]);

  const addCity = () => {
    if (!city.trim()) return;
    const name = city.trim().toLowerCase();
    setCityMap((prev) => ({ ...prev, [name]: Number(radius) || 100 }));
    setCity('');
    setRadius(100);
  };

  const saveAll = () => {
    saveRadiusSettings({ defaultRadius, byCity: cityMap });
    alert('Radius settings saved');
  };

  const removeCity = (name) => {
    const copy = { ...cityMap };
    delete copy[name];
    setCityMap(copy);
  };

  return (
    <div className="max-w-3xl space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Delivery Radius Settings</h1>
      <div className="card p-5 space-y-4">
        <div>
          <label className="label">Default radius for all cities (km)</label>
          <input
            type="number"
            min="1"
            max="500"
            value={defaultRadius}
            onChange={(e) => setDefaultRadius(Number(e.target.value) || 100)}
            className="input max-w-xs"
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
          <div className="sm:col-span-2">
            <label className="label">City name</label>
            <input
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="input"
              placeholder="e.g. varanasi"
            />
          </div>
          <div>
            <label className="label">Radius (km)</label>
            <input
              type="number"
              min="1"
              max="500"
              value={radius}
              onChange={(e) => setRadius(Number(e.target.value) || 100)}
              className="input"
            />
          </div>
          <button onClick={addCity} className="btn btn-primary sm:col-span-3">Add / Update City Radius</button>
        </div>
        {cityEntries.length > 0 && (
          <div className="space-y-2">
            <p className="font-semibold text-sm text-gray-700">Per-city overrides</p>
            <div className="divide-y divide-gray-100 rounded-xl border border-gray-100">
              {cityEntries.map(([name, km]) => (
                <div key={name} className="flex items-center justify-between px-4 py-2 bg-white">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="font-semibold capitalize">{name}</span>
                    <span className="text-gray-500">{km} km</span>
                  </div>
                  <button onClick={() => removeCity(name)} className="text-red-500 text-xs hover:underline">Remove</button>
                </div>
              ))}
            </div>
          </div>
        )}
        <div className="flex gap-3">
          <button onClick={saveAll} className="btn btn-primary">Save Settings</button>
          <button
            onClick={() => {
              setCityMap({});
              setDefaultRadius(100);
              saveRadiusSettings({ defaultRadius: 100, byCity: {} });
            }}
            className="btn btn-secondary"
          >Reset to 100km</button>
        </div>
      </div>
    </div>
  );
}
