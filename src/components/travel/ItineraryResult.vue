<script setup>
import { computed } from 'vue'

const props = defineProps({
  itinerary: {
    type: Object,
    default: null,
  },
  canSave: {
    type: Boolean,
    default: false,
  },
  isSaved: {
    type: Boolean,
    default: false,
  },
  isSaving: {
    type: Boolean,
    default: false,
  },
  isRegenerating: {
    type: Boolean,
    default: false,
  },
  canRegenerate: {
    type: Boolean,
    default: true,
  },
  citations: {
    type: Array,
    default: () => [],
  },
})

const emit = defineEmits(['save', 'regenerate'])

const periodLabels = Object.freeze({
  morning: '오전',
  afternoon: '오후',
  evening: '저녁',
  night: '밤',
})

const toTextList = (value) => {
  if (!Array.isArray(value)) return []
  return value
    .map((item) => {
      if (typeof item === 'string') return { title: item, detail: '' }
      return {
        title: item?.item || item?.title || item?.name || item?.text || '',
        detail: item?.reason || item?.detail || item?.description || '',
      }
    })
    .filter((item) => item.title)
}

const normalizedDays = computed(() => {
  const days = props.itinerary?.days ?? props.itinerary?.dailyPlan ?? props.itinerary?.daily_plan ?? []
  if (!Array.isArray(days)) return []

  return days.map((day, dayIndex) => {
    const rawBlocks = day?.blocks ?? day?.schedule ?? day?.items ?? day?.activities ?? []
    const blockEntries = Array.isArray(rawBlocks) ? rawBlocks.map((block) => ['', block]) : Object.entries(rawBlocks || {})
    const blocks = blockEntries.length
      ? blockEntries
          .map((block, blockIndex) => {
            const [entryPeriod, entryValue] = block
            if (typeof entryValue === 'string') {
              return { key: `${dayIndex}-${blockIndex}`, period: periodLabels[entryPeriod] || entryPeriod, title: entryValue, detail: '', weatherNote: '' }
            }

            const rawPeriod = entryValue?.period || entryValue?.timeOfDay || entryValue?.time_of_day || entryValue?.time || entryPeriod || ''
            return {
              key: entryValue?.id || `${dayIndex}-${blockIndex}`,
              period: periodLabels[rawPeriod] || rawPeriod,
              title: entryValue?.activity || entryValue?.title || entryValue?.placeName || entryValue?.place_name || entryValue?.place?.title || '일정',
              detail: entryValue?.note || entryValue?.description || entryValue?.reason || '',
              weatherNote: entryValue?.weatherNote || entryValue?.weather_note || '',
            }
          })
          .filter((block) => block.title)
      : []

    return {
      key: day?.date || dayIndex,
      date: day?.date || '',
      title: day?.title || `${dayIndex + 1}일차`,
      weather: day?.weatherSummary || day?.weather_summary || day?.weather || '',
      blocks,
      warnings: Array.isArray(day?.warnings) ? day.warnings.filter(Boolean) : [],
    }
  })
})

const packingItems = computed(() => toTextList(props.itinerary?.packingList ?? props.itinerary?.packing ?? props.itinerary?.packing_list))
const weatherNotes = computed(() => toTextList(props.itinerary?.weatherNotes ?? props.itinerary?.weather_notes ?? props.itinerary?.cautions ?? props.itinerary?.warnings))

const normalizeHttpUrl = (value) => {
  if (typeof value !== 'string' || !value.trim()) return ''

  try {
    const url = new URL(value)
    return ['http:', 'https:'].includes(url.protocol) ? url.toString() : ''
  } catch {
    return ''
  }
}

const sources = computed(() => {
  const itinerarySources = Array.isArray(props.itinerary?.sources) ? props.itinerary.sources : []
  const metaSources = Array.isArray(props.citations) ? props.citations : []
  const normalized = [...itinerarySources, ...metaSources]
    .map((source) => {
      const url = normalizeHttpUrl(source?.url || source?.citation?.url)
      return {
        title: String(source?.title || source?.citation?.title || url).trim(),
        url,
      }
    })
    .filter((source) => source.title && source.url)

  return [...new Map(normalized.map((source) => [source.url, source])).values()]
})

const sourceTitleMap = computed(() => new Map(sources.value.map((source) => [source.url, source])))

const claimSourceLinks = (value) => {
  if (!Array.isArray(value)) return []
  const links = value
    .map(normalizeHttpUrl)
    .map((url) => sourceTitleMap.value.get(url))
    .filter(Boolean)
  return [...new Map(links.map((source) => [source.url, source])).values()]
}

const legacyBriefText = (item) => {
  if (!item || typeof item !== 'object') return ''
  const title = item.item || item.title || item.name || ''
  const detail = item.reason || item.detail || item.description || ''
  return [title, detail].filter(Boolean).join(' · ')
}

const toTravelBriefItems = (value) => {
  if (!Array.isArray(value)) return []

  return value
    .map((item) => {
      if (typeof item === 'string') {
        const text = item.trim()
        return text ? { text, sourceLinks: [], isLegacy: true } : null
      }
      if (!item || typeof item !== 'object') return null

      if (typeof item.text === 'string') {
        const text = item.text.trim()
        const sourceUrls = item.sourceUrls ?? item.source_urls
        const sourceLinks = claimSourceLinks(sourceUrls)
        return text && sourceLinks.length ? { text, sourceLinks, isLegacy: false } : null
      }

      const text = legacyBriefText(item)
      return text ? { text, sourceLinks: [], isLegacy: true } : null
    })
    .filter(Boolean)
}

const travelBriefGroups = computed(() => {
  const brief = props.itinerary?.travelBrief ?? props.itinerary?.travel_brief
  if (!brief || typeof brief !== 'object') return []

  return [
    { key: 'highlights', title: '여행 포인트', items: toTravelBriefItems(brief.highlights) },
    { key: 'operations', title: '방문 전 확인', items: toTravelBriefItems(brief.operationNotes ?? brief.operation_notes) },
    { key: 'seasonal', title: '계절 메모', items: toTravelBriefItems(brief.seasonalTips ?? brief.seasonal_tips) },
  ].filter((group) => group.items.length)
})

const claimedSourceUrls = computed(
  () => new Set(travelBriefGroups.value.flatMap((group) => group.items.flatMap((item) => item.sourceLinks.map((source) => source.url)))),
)
const footerSources = computed(() => sources.value.filter((source) => !claimedSourceUrls.value.has(source.url)))
</script>

<template>
  <article v-if="itinerary" class="itinerary-result" aria-labelledby="itinerary-result-title">
    <header class="result-heading">
      <div>
        <span>YOUR ROUTE</span>
        <h2 id="itinerary-result-title">여행 일정</h2>
      </div>
      <div class="result-actions">
        <button v-if="canRegenerate" type="button" :disabled="isRegenerating || isSaving" @click="emit('regenerate')">
          {{ isRegenerating ? '다시 만드는 중' : '다시 만들기' }}
        </button>
        <button v-if="canSave" class="save-button" type="button" :disabled="isSaved || isSaving || isRegenerating" @click="emit('save')">
          {{ isSaved ? '저장됨' : isSaving ? '저장 중' : '내 여행에 저장' }}
        </button>
      </div>
    </header>

    <p v-if="itinerary.summary" class="result-summary">{{ itinerary.summary }}</p>

    <ol v-if="normalizedDays.length" class="day-list">
      <li v-for="(day, dayIndex) in normalizedDays" :key="day.key" class="day-section">
        <header>
          <span>{{ String(dayIndex + 1).padStart(2, '0') }}</span>
          <div>
            <h3>{{ day.title }}</h3>
            <p v-if="day.date || day.weather">{{ [day.date, day.weather].filter(Boolean).join(' · ') }}</p>
          </div>
        </header>

        <ol v-if="day.blocks.length" class="schedule-list">
          <li v-for="block in day.blocks" :key="block.key">
            <span>{{ block.period || '일정' }}</span>
            <div>
              <strong>{{ block.title }}</strong>
              <p v-if="block.detail">{{ block.detail }}</p>
              <small v-if="block.weatherNote">{{ block.weatherNote }}</small>
            </div>
          </li>
        </ol>
        <ul v-if="day.warnings.length" class="day-warnings">
          <li v-for="warning in day.warnings" :key="warning">{{ warning }}</li>
        </ul>
      </li>
    </ol>

    <div v-if="packingItems.length || weatherNotes.length" class="travel-notes">
      <section v-if="packingItems.length" aria-labelledby="packing-list-title">
        <h3 id="packing-list-title">챙길 것</h3>
        <ul>
          <li v-for="item in packingItems" :key="`${item.title}-${item.detail}`">
            <strong>{{ item.title }}</strong>
            <span v-if="item.detail">{{ item.detail }}</span>
          </li>
        </ul>
      </section>
      <section v-if="weatherNotes.length" aria-labelledby="weather-notes-title">
        <h3 id="weather-notes-title">날씨 메모</h3>
        <ul>
          <li v-for="item in weatherNotes" :key="`${item.title}-${item.detail}`">
            <strong>{{ item.title }}</strong>
            <span v-if="item.detail">{{ item.detail }}</span>
          </li>
        </ul>
      </section>
    </div>

    <div v-if="travelBriefGroups.length" class="travel-brief">
      <section v-for="group in travelBriefGroups" :key="group.key" :aria-labelledby="`travel-brief-${group.key}`">
        <h3 :id="`travel-brief-${group.key}`">{{ group.title }}</h3>
        <ul>
          <li v-for="(item, itemIndex) in group.items" :key="`${group.key}-${itemIndex}-${item.text}`">
            <strong>{{ item.text }}</strong>
            <span v-if="item.isLegacy" class="legacy-claim-note">이전 저장 결과 · 출처 연결 없음</span>
            <span v-else class="claim-citations" aria-label="이 문장의 출처">
              <a
                v-for="(source, sourceIndex) in item.sourceLinks"
                :key="source.url"
                :href="source.url"
                target="_blank"
                rel="noopener noreferrer"
                :aria-label="`${source.title} 출처를 새 창에서 열기`"
              >[{{ sourceIndex + 1 }}] {{ source.title }}</a>
            </span>
          </li>
        </ul>
      </section>
    </div>

    <footer v-if="footerSources.length" class="itinerary-sources">
      <h3>기타 참고 링크</h3>
      <ul>
        <li v-for="source in footerSources" :key="source.url">
          <a :href="source.url" target="_blank" rel="noopener noreferrer" :aria-label="`${source.title} 참고 자료를 새 창에서 열기`">
            {{ source.title }}
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14 5h5v5M19 5l-8 8M18 13v5H6V6h5" /></svg>
          </a>
        </li>
      </ul>
    </footer>
  </article>
</template>

<style scoped>
.itinerary-result {
  display: grid;
  gap: 22px;
}

.result-heading {
  display: flex;
  align-items: end;
  justify-content: space-between;
  gap: 20px;
}

.result-heading > div:first-child > span {
  display: block;
  margin-bottom: 4px;
  color: var(--weather-accent);
  font-size: 9px;
  font-weight: 850;
  letter-spacing: 0.14em;
}

.result-heading h2 {
  margin: 0;
  color: var(--hero-text);
  font-size: clamp(25px, 4vw, 34px);
  line-height: 1;
  letter-spacing: -0.045em;
}

.result-actions {
  display: flex;
  align-items: center;
  gap: 7px;
}

.result-actions button {
  min-height: 36px;
  padding: 0 11px;
  border: 1px solid color-mix(in srgb, var(--hero-text) 18%, transparent);
  border-radius: 9px;
  background: color-mix(in srgb, white 8%, transparent);
  color: var(--hero-text);
  cursor: pointer;
  font-size: 10px;
  font-weight: 820;
}

.result-actions .save-button {
  border-color: var(--hero-text);
  background: var(--hero-text);
  color: var(--hero-start);
}

.result-actions button:disabled {
  cursor: not-allowed;
  opacity: 0.48;
}

.result-summary {
  max-width: 720px;
  margin: -5px 0 0;
  color: var(--hero-muted);
  font-size: 13px;
  line-height: 1.7;
}

.day-list,
.schedule-list,
.day-warnings,
.travel-notes ul,
.travel-brief ul,
.itinerary-sources ul {
  margin: 0;
  padding: 0;
  list-style: none;
}

.day-list {
  border-top: 1px solid color-mix(in srgb, var(--hero-text) 17%, transparent);
  border-bottom: 1px solid color-mix(in srgb, var(--hero-text) 17%, transparent);
}

.day-section {
  display: grid;
  grid-template-columns: minmax(165px, 0.7fr) minmax(0, 1.8fr);
  gap: 28px;
  padding: 24px 3px;
}

.day-section + .day-section {
  border-top: 1px solid color-mix(in srgb, var(--hero-text) 13%, transparent);
}

.day-section > header {
  display: grid;
  grid-template-columns: 28px minmax(0, 1fr);
  align-content: start;
  gap: 9px;
}

.day-section > header > span {
  padding-top: 2px;
  color: var(--weather-accent);
  font-size: 9px;
  font-weight: 850;
  font-variant-numeric: tabular-nums;
}

.day-section h3 {
  margin: 0;
  color: var(--hero-text);
  font-size: 15px;
  letter-spacing: -0.02em;
}

.day-section header p {
  margin: 3px 0 0;
  color: var(--hero-muted);
  font-size: 10px;
  font-weight: 700;
}

.schedule-list li {
  display: grid;
  grid-template-columns: 52px minmax(0, 1fr);
  gap: 12px;
  padding: 0 0 16px;
}

.schedule-list li:last-child {
  padding-bottom: 0;
}

.schedule-list li > span {
  padding-top: 2px;
  color: var(--hero-muted);
  font-size: 10px;
  font-weight: 800;
}

.schedule-list li > div {
  display: grid;
  gap: 3px;
}

.schedule-list strong {
  color: var(--hero-text);
  font-size: 13px;
}

.schedule-list p,
.schedule-list small {
  margin: 0;
  color: var(--hero-muted);
  font-size: 11px;
  line-height: 1.55;
}

.day-warnings {
  grid-column: 2;
  display: flex;
  flex-wrap: wrap;
  gap: 5px 14px;
}

.day-warnings li {
  color: color-mix(in srgb, var(--weather-accent) 74%, var(--hero-text));
  font-size: 9px;
  font-weight: 740;
}

.schedule-list small {
  color: color-mix(in srgb, var(--weather-accent) 76%, var(--hero-text));
  font-weight: 740;
}

.travel-notes {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 32px;
}

.travel-brief {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 24px;
  padding-top: 19px;
  border-top: 1px solid color-mix(in srgb, var(--hero-text) 14%, transparent);
}

.travel-brief h3,
.itinerary-sources h3 {
  margin: 0 0 8px;
  color: var(--hero-text);
  font-size: 12px;
}

.travel-brief li {
  display: grid;
  gap: 5px;
  padding: 7px 0;
  border-top: 1px solid color-mix(in srgb, var(--hero-text) 9%, transparent);
}

.travel-brief li strong {
  color: var(--hero-text);
  font-size: 10px;
  line-height: 1.5;
}

.travel-brief li span {
  color: var(--hero-muted);
  font-size: 9px;
}

.travel-brief .legacy-claim-note {
  color: color-mix(in srgb, var(--hero-muted) 82%, transparent);
  font-weight: 700;
}

.claim-citations {
  display: flex;
  flex-wrap: wrap;
  gap: 4px 10px;
}

.claim-citations a {
  color: color-mix(in srgb, var(--weather-accent) 74%, var(--hero-text));
  font-size: 9px;
  font-weight: 760;
  line-height: 1.45;
  text-decoration: underline;
  text-decoration-color: color-mix(in srgb, currentcolor 34%, transparent);
  text-underline-offset: 3px;
}

.itinerary-sources {
  padding-top: 16px;
  border-top: 1px solid color-mix(in srgb, var(--hero-text) 12%, transparent);
}

.itinerary-sources ul {
  display: flex;
  flex-wrap: wrap;
  gap: 6px 18px;
}

.itinerary-sources a {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  color: var(--hero-muted);
  font-size: 9px;
  font-weight: 750;
  text-decoration: underline;
  text-decoration-color: color-mix(in srgb, currentcolor 35%, transparent);
  text-underline-offset: 3px;
}

.itinerary-sources svg {
  width: 11px;
  height: 11px;
  fill: none;
  stroke: currentcolor;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 1.7;
}

.travel-notes h3 {
  margin: 0 0 9px;
  color: var(--hero-text);
  font-size: 13px;
}

.travel-notes ul {
  border-top: 1px solid color-mix(in srgb, var(--hero-text) 14%, transparent);
}

.travel-notes li {
  display: grid;
  gap: 1px;
  padding: 9px 2px;
  border-bottom: 1px solid color-mix(in srgb, var(--hero-text) 10%, transparent);
}

.travel-notes li strong {
  color: var(--hero-text);
  font-size: 11px;
}

.travel-notes li span {
  color: var(--hero-muted);
  font-size: 10px;
  line-height: 1.5;
}

@media (max-width: 660px) {
  .result-heading {
    align-items: start;
    flex-direction: column;
    gap: 14px;
  }

  .day-section {
    grid-template-columns: 1fr;
    gap: 18px;
    padding-block: 20px;
  }

  .day-warnings {
    grid-column: auto;
  }

  .travel-notes {
    grid-template-columns: 1fr;
    gap: 24px;
  }

  .travel-brief {
    grid-template-columns: 1fr;
    gap: 18px;
  }
}

@media (max-width: 420px) {
  .result-actions {
    width: 100%;
  }

  .result-actions button {
    flex: 1 1 0;
  }
}
</style>
