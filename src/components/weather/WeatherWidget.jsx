export default function WeatherWidget({ data, detailed = false }) {
  if (!data) {
    return (
      <div className="bg-gray-50 p-4 rounded-lg">
        <p className="text-gray-500 mb-2">Weather data not available</p>
        <p className="text-sm text-gray-400">Please set your location using the ZIP code input in the header to view weather data.</p>
      </div>
    );
  }

  return (
    <div>
      <h3 className="text-xl font-semibold mb-4">Current Weather</h3>
      {data.location && (
        <p className="text-sm text-gray-500 mb-3">📍 {data.location}</p>
      )}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-blue-50 p-3 rounded-lg">
          <p className="text-sm text-gray-600">Temperature</p>
          <p className="text-lg font-semibold">{data.temperature || 72}°F</p>
        </div>
        <div className="bg-green-50 p-3 rounded-lg">
          <p className="text-sm text-gray-600">Humidity</p>
          <p className="text-lg font-semibold">{data.humidity || 45}%</p>
        </div>
        <div className="bg-yellow-50 p-3 rounded-lg">
          <p className="text-sm text-gray-600">Wind Speed</p>
          <p className="text-lg font-semibold">{data.windSpeed || 12} mph</p>
        </div>
        <div className={`p-3 rounded-lg ${
          data.fireWeatherIndex === 'EXTREME' ? 'bg-red-100' :
          data.fireWeatherIndex === 'HIGH' ? 'bg-red-50' :
          data.fireWeatherIndex === 'MEDIUM' ? 'bg-yellow-50' : 'bg-green-50'
        }`}>
          <p className="text-sm text-gray-600">Fire Risk</p>
          <p className={`text-lg font-semibold ${
            data.fireWeatherIndex === 'EXTREME' ? 'text-red-700' :
            data.fireWeatherIndex === 'HIGH' ? 'text-red-600' :
            data.fireWeatherIndex === 'MEDIUM' ? 'text-yellow-600' : 'text-green-600'
          }`}>
            {data.fireWeatherIndex || 'Moderate'}
          </p>
        </div>
      </div>
      {data.description && (
        <div className="mt-4 bg-gray-50 p-3 rounded-lg">
          <p className="text-sm text-gray-700">
            <span className="font-medium">Conditions:</span> {data.description}
          </p>
        </div>
      )}
    </div>
  );
}