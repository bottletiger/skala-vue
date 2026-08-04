import assert from 'node:assert/strict'
import test from 'node:test'

import { GEOLOCATION_OPTIONS, getGeolocationErrorMessage, getGeolocationPermissionState, requestCurrentCoordinates } from '../src/services/geolocation.js'

test('위치 기능과 Permissions API 상태를 사용자 위치 진입 상태로 변환한다', async () => {
  assert.equal(await getGeolocationPermissionState({}), 'unsupported')
  assert.equal(await getGeolocationPermissionState({ geolocation: {} }), 'prompt')
  assert.equal(
    await getGeolocationPermissionState({
      geolocation: {},
      permissions: { query: async () => ({ state: 'granted' }) },
    }),
    'granted',
  )
  assert.equal(
    await getGeolocationPermissionState({
      geolocation: {},
      permissions: { query: async () => Promise.reject(new Error('blocked')) },
    }),
    'prompt',
  )
})

test('브라우저 좌표 요청은 제한된 옵션과 유효한 위도·경도만 반환한다', async () => {
  let receivedOptions
  const coordinates = await requestCurrentCoordinates({
    geolocation: {
      getCurrentPosition(onSuccess, _onError, options) {
        receivedOptions = options
        onSuccess({ coords: { latitude: 37.5665, longitude: 126.978 } })
      },
    },
  })

  assert.deepEqual(coordinates, { latitude: 37.5665, longitude: 126.978 })
  assert.deepEqual(receivedOptions, GEOLOCATION_OPTIONS)

  await assert.rejects(
    requestCurrentCoordinates({
      geolocation: {
        getCurrentPosition(onSuccess) {
          onSuccess({ coords: { latitude: '37.5', longitude: 126.978 } })
        },
      },
    }),
    /현재 위치 좌표를 확인하지 못했습니다/,
  )
})

test('브라우저 위치 오류 코드는 사이트 안내 문구로 변환한다', () => {
  assert.match(getGeolocationErrorMessage({ code: 1 }), /사이트 설정에서 위치 권한/)
  assert.match(getGeolocationErrorMessage({ code: 2 }), /기기의 위치 서비스/)
  assert.match(getGeolocationErrorMessage({ code: 3 }), /시간이 초과/)
  assert.equal(getGeolocationErrorMessage(new Error('직접 오류')), '직접 오류')
})
