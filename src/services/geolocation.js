export const CURRENT_LOCATION_ID = 'current-location'

export const GEOLOCATION_OPTIONS = Object.freeze({
  enableHighAccuracy: false,
  timeout: 10_000,
  maximumAge: 5 * 60 * 1000,
})

export const getGeolocationPermissionState = async (browserNavigator = globalThis.navigator) => {
  if (!browserNavigator?.geolocation) return 'unsupported'
  if (!browserNavigator.permissions?.query) return 'prompt'

  try {
    const permission = await browserNavigator.permissions.query({ name: 'geolocation' })
    return ['granted', 'denied', 'prompt'].includes(permission.state) ? permission.state : 'prompt'
  } catch {
    return 'prompt'
  }
}

export const requestCurrentCoordinates = (browserNavigator = globalThis.navigator, options = GEOLOCATION_OPTIONS) => {
  return new Promise((resolve, reject) => {
    if (!browserNavigator?.geolocation) {
      reject(new Error('이 브라우저에서는 위치 기능을 사용할 수 없습니다.'))
      return
    }

    browserNavigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        if (!Number.isFinite(coords?.latitude) || !Number.isFinite(coords?.longitude)) {
          reject(new Error('현재 위치 좌표를 확인하지 못했습니다.'))
          return
        }

        resolve({ latitude: coords.latitude, longitude: coords.longitude })
      },
      (error) => reject(error),
      options,
    )
  })
}

export const getGeolocationErrorMessage = (error) => {
  if (error?.code === 1) return '위치 권한이 꺼져 있습니다. 브라우저의 사이트 설정에서 위치 권한을 허용해 주세요.'
  if (error?.code === 2) return '현재 위치를 확인하지 못했습니다. 네트워크와 기기의 위치 서비스를 확인해 주세요.'
  if (error?.code === 3) return '위치 확인 시간이 초과되었습니다. 잠시 후 다시 시도해 주세요.'
  return error?.message || '현재 위치를 확인하지 못했습니다.'
}
