import { ref, watch } from 'vue'

const STORAGE_KEY = 'weather-favorite-city-ids'

const readFavoriteIds = () => {
  try {
    const savedIds = JSON.parse(localStorage.getItem(STORAGE_KEY))

    return Array.isArray(savedIds) ? savedIds.map(String) : []
  } catch {
    return []
  }
}

export const useFavoriteCities = () => {
  const favoriteIds = ref(readFavoriteIds())

  const isFavorite = (cityId) =>
    favoriteIds.value.includes(String(cityId))

  const toggleFavorite = (cityId) => {
    const normalizedId = String(cityId)

    favoriteIds.value = isFavorite(normalizedId)
      ? favoriteIds.value.filter((id) => id !== normalizedId)
      : [...favoriteIds.value, normalizedId]
  }

  watch(
    favoriteIds,
    (ids) => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(ids))
    },
    { deep: true },
  )

  return {
    favoriteIds,
    isFavorite,
    toggleFavorite,
  }
}
