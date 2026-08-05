<script setup>
import { computed, ref } from 'vue'

import { getWeatherTheme } from '@/utils/weatherTheme'

const props = defineProps({
  weather: {
    type: Object,
    required: true,
  },
})

const isPlayerOpen = ref(false)

const playlists = Object.freeze({
  clear: {
    id: '37i9dQZF1DX3rxVfibe1L0',
    title: 'Mood Booster',
    description: '맑은 날의 가벼운 발걸음에 잘 어울리는 음악',
  },
  clouds: {
    id: '37i9dQZF1DX4WYpdgoIcn6',
    title: 'Chill Hits',
    description: '구름 낀 오후에 천천히 듣기 좋은 음악',
  },
  rain: {
    id: '37i9dQZF1DXbvABJXBIyiY',
    title: 'Rainy Day',
    description: '빗소리와 함께 차분하게 흐르는 음악',
  },
  thunderstorm: {
    id: '37i9dQZF1DX4sWSpwq3LiO',
    title: 'Peaceful Piano',
    description: '거센 날씨 속에서 잠시 호흡을 고르는 음악',
  },
  snow: {
    id: '37i9dQZF1DX4sWSpwq3LiO',
    title: 'Peaceful Piano',
    description: '눈 내리는 풍경에 조용히 스며드는 음악',
  },
  mist: {
    id: '37i9dQZF1DX4sWSpwq3LiO',
    title: 'Peaceful Piano',
    description: '안개 낀 아침에 집중하기 좋은 음악',
  },
  night: {
    id: '37i9dQZF1DX4sWSpwq3LiO',
    title: 'Peaceful Piano',
    description: '하루를 조용히 정리하는 밤의 음악',
  },
  neutral: {
    id: '37i9dQZF1DX4WYpdgoIcn6',
    title: 'Chill Hits',
    description: '지금 날씨에 부담 없이 어울리는 음악',
  },
})

const weatherTheme = computed(() => getWeatherTheme(props.weather))
const playlist = computed(() => playlists[weatherTheme.value.name] ?? playlists[weatherTheme.value.category] ?? playlists.neutral)
const embedUrl = computed(() => `https://open.spotify.com/embed/playlist/${playlist.value.id}?utm_source=generator&theme=0`)
const spotifyUrl = computed(() => `https://open.spotify.com/playlist/${playlist.value.id}`)
</script>

<template>
  <section class="playlist-panel" aria-labelledby="weather-playlist-title">
    <div class="playlist-copy">
      <span>WEATHER MIX</span>
      <h2 id="weather-playlist-title">{{ playlist.title }}</h2>
      <p>{{ playlist.description }}</p>
    </div>

    <div class="playlist-actions">
      <button type="button" :aria-expanded="isPlayerOpen" aria-controls="spotify-weather-player" @click="isPlayerOpen = !isPlayerOpen">
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path v-if="!isPlayerOpen" d="m9 7 8 5-8 5V7Z" />
          <path v-else d="M8 8h8M8 12h8M8 16h8" />
        </svg>
        {{ isPlayerOpen ? '플레이어 닫기' : '바로 듣기' }}
      </button>
      <a :href="spotifyUrl" target="_blank" rel="noopener noreferrer">Spotify에서 열기</a>
    </div>

    <div v-if="isPlayerOpen" id="spotify-weather-player" class="spotify-player">
      <iframe
        :src="embedUrl"
        :title="`${playlist.title} Spotify 플레이리스트`"
        width="100%"
        height="152"
        frameborder="0"
        allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
        loading="lazy"
      ></iframe>
    </div>
  </section>
</template>

<style scoped>
.playlist-panel {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: end;
  gap: 20px 28px;
  margin: 34px auto 0;
  padding: 22px 3px;
  border-top: 1px solid color-mix(in srgb, var(--hero-text) 16%, transparent);
  border-bottom: 1px solid color-mix(in srgb, var(--hero-text) 16%, transparent);
}

.playlist-copy > span {
  display: block;
  margin-bottom: 4px;
  color: var(--weather-accent);
  font-size: 8px;
  font-weight: 850;
  letter-spacing: 0.14em;
}

.playlist-copy h2 {
  margin: 0;
  color: var(--hero-text);
  font-size: 19px;
  letter-spacing: -0.04em;
}

.playlist-copy p {
  margin: 4px 0 0;
  color: var(--hero-muted);
  font-size: 11px;
  font-weight: 700;
}

.playlist-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.playlist-actions button,
.playlist-actions a {
  display: inline-flex;
  min-height: 36px;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 0 11px;
  border: 1px solid color-mix(in srgb, var(--hero-text) 17%, transparent);
  border-radius: 9px;
  background: color-mix(in srgb, white 8%, transparent);
  color: var(--hero-text);
  cursor: pointer;
  font-size: 9px;
  font-weight: 820;
  text-decoration: none;
}

.playlist-actions button {
  border-color: var(--hero-text);
  background: var(--hero-text);
  color: var(--hero-start);
}

.playlist-actions svg {
  width: 14px;
  height: 14px;
  fill: none;
  stroke: currentcolor;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 1.8;
}

.playlist-actions svg path:first-child {
  fill: currentcolor;
}

.spotify-player {
  grid-column: 1 / -1;
  overflow: hidden;
  border: 1px solid color-mix(in srgb, var(--hero-text) 12%, transparent);
  border-radius: 13px;
  background: rgba(18, 24, 27, 0.76);
}

.spotify-player iframe {
  display: block;
}

@media (max-width: 600px) {
  .playlist-panel {
    grid-template-columns: 1fr;
    align-items: start;
  }

  .playlist-actions {
    flex-wrap: wrap;
  }
}
</style>
