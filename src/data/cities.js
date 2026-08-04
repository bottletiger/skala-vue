export const CITY_CONFIG = Object.freeze([
  {
    id: 'city_01',
    name: '서울',
    fullName: '대한민국 서울특별시',
    latitude: 37.5665,
    longitude: 126.978,
  },
  {
    id: 'city_02',
    name: '수원',
    fullName: '대한민국 경기도 수원시',
    latitude: 37.2636,
    longitude: 127.0286,
  },
  {
    id: 'city_10',
    name: '세종',
    fullName: '대한민국 세종특별자치시',
    latitude: 36.48,
    longitude: 127.289,
  },
  {
    id: 'city_04',
    name: '인천',
    fullName: '대한민국 인천광역시',
    latitude: 37.4563,
    longitude: 126.7052,
  },
  {
    id: 'city_03',
    name: '부산',
    fullName: '대한민국 부산광역시',
    latitude: 35.1796,
    longitude: 129.0756,
  },
  {
    id: 'city_05',
    name: '대전',
    fullName: '대한민국 대전광역시',
    latitude: 36.3504,
    longitude: 127.3845,
  },
  {
    id: 'city_06',
    name: '대구',
    fullName: '대한민국 대구광역시',
    latitude: 35.8714,
    longitude: 128.6014,
  },
  {
    id: 'city_07',
    name: '광주',
    fullName: '대한민국 광주광역시',
    latitude: 35.1595,
    longitude: 126.8526,
  },
  {
    id: 'city_08',
    name: '울산',
    fullName: '대한민국 울산광역시',
    latitude: 35.5384,
    longitude: 129.3114,
  },
  {
    id: 'city_09',
    name: '제주',
    fullName: '대한민국 제주특별자치도 제주시',
    latitude: 33.4996,
    longitude: 126.5312,
  },
])

export const findCityConfig = (cityId) => CITY_CONFIG.find((city) => city.id === cityId)
