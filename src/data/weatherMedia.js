export const WEATHER_VIDEO_FILE_BY_KEY = Object.freeze({
  'clear-day': 'clear.mp4',
  'clear-night': 'night.mp4',
  'few-clouds': 'few-clouds.mp4',
  overcast: 'clouds.mp4',
  drizzle: 'drizzle.mp4',
  rain: 'rain.mp4',
  'heavy-rain': 'heavy-rain.mp4',
  thunderstorm: 'thunderstorm.mp4',
  snow: 'snow.mp4',
  fog: 'fog.mp4',
})

export const getWeatherVideoFile = (videoKey) => WEATHER_VIDEO_FILE_BY_KEY[videoKey] ?? ''

export const getWeatherVideoSource = (videoKey, baseUrl = '/') => {
  const videoFile = getWeatherVideoFile(videoKey)
  if (!videoFile) return ''

  const normalizedBaseUrl = baseUrl ? `${baseUrl.replace(/\/$/, '')}/` : '/'
  return `${normalizedBaseUrl}weather-videos/${videoFile}`
}
