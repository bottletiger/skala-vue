import assert from 'node:assert/strict'
import { existsSync, readFileSync, statSync } from 'node:fs'
import { dirname, join } from 'node:path'
import test from 'node:test'
import { fileURLToPath } from 'node:url'

import { getWeatherVideoFile, getWeatherVideoSource, WEATHER_VIDEO_FILE_BY_KEY } from '../src/data/weatherMedia.js'

const projectRoot = join(dirname(fileURLToPath(import.meta.url)), '..')
const maximumVideoBytes = Math.floor(1.5 * 1024 * 1024)

test('날씨 영상 키와 파일 이름을 공통 데이터 모듈에서 관리한다', () => {
  assert.equal(Object.isFrozen(WEATHER_VIDEO_FILE_BY_KEY), true)
  assert.deepEqual(WEATHER_VIDEO_FILE_BY_KEY, {
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
  assert.equal(getWeatherVideoFile('clear-day'), 'clear.mp4')
  assert.equal(getWeatherVideoFile('unknown'), '')
})

test('배포 base 경로와 날씨 영상 파일 경로를 안전하게 결합한다', () => {
  assert.equal(getWeatherVideoSource('snow'), '/weather-videos/snow.mp4')
  assert.equal(getWeatherVideoSource('snow', '/skala-vue/'), '/skala-vue/weather-videos/snow.mp4')
  assert.equal(getWeatherVideoSource('snow', '/skala-vue'), '/skala-vue/weather-videos/snow.mp4')
  assert.equal(getWeatherVideoSource('unknown', '/skala-vue/'), '')
})

test('모든 매핑 영상이 공개 자산에 있고 1.5 MiB 이하이다', () => {
  for (const videoFile of Object.values(WEATHER_VIDEO_FILE_BY_KEY)) {
    const videoPath = join(projectRoot, 'public/weather-videos', videoFile)
    assert.equal(existsSync(videoPath), true, `${videoFile} 파일이 필요합니다.`)
    assert.ok(statSync(videoPath).size <= maximumVideoBytes, `${videoFile}은 1.5 MiB 이하여야 합니다.`)
  }
})

test('배경 컴포넌트는 하드코딩 매핑 대신 공통 미디어 모듈을 사용한다', () => {
  const componentSource = readFileSync(join(projectRoot, 'src/components/weather/WeatherBackgroundVideo.vue'), 'utf8')

  assert.match(componentSource, /import \{ getWeatherVideoSource \} from '@\/data\/weatherMedia'/)
  assert.match(componentSource, /getWeatherVideoSource\(activeVideoKey\.value, import\.meta\.env\.BASE_URL\)/)
  assert.doesNotMatch(componentSource, /const VIDEO_FILE_BY_KEY/)
})
