export const getWeatherRequestErrorMessage = (error, fallbackMessage) => {
  if (error?.response?.status === 429) {
    const reason = String(error?.response?.data?.reason || '').toLowerCase()
    if (reason.includes('daily api request limit exceeded')) {
      return '오늘 사용할 수 있는 날씨 데이터 요청량을 모두 사용했습니다. 내일 다시 확인해 주세요.'
    }
    return '날씨 데이터 요청 한도를 초과했습니다. 잠시 후 다시 시도해 주세요.'
  }
  if (error?.code === 'ECONNABORTED' || error?.name === 'TimeoutError') {
    return '날씨 서비스 응답이 지연되고 있습니다. 잠시 후 다시 시도해 주세요.'
  }
  if (error?.code === 'ERR_NETWORK') {
    return '날씨 서비스에 연결하지 못했습니다. 네트워크 상태를 확인해 주세요.'
  }
  return fallbackMessage
}
