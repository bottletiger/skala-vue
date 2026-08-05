# Weather media sources

`public/weather-videos/`에는 현재 날씨 상태를 표현하는 짧은 배경 영상만 둔다. 도시·국가 풍경은 실제 관측 날씨로 오해될 수 있으므로 현재 날씨 매핑에 연결하지 않는다.

## License

모든 활성 영상은 원본 제작자가 Pexels에 공개한 클립의 편집본이다. Pexels는 사진·영상을 무료로 사용하고 수정할 수 있도록 허용하며 출처 표기를 의무화하지 않는다. 원본 파일 자체를 재판매하거나 다른 스톡 서비스처럼 재배포하는 행위는 허용하지 않는다.

- Official license: [Pexels License](https://www.pexels.com/legal-pages/license/)
- Download route convention: `https://www.pexels.com/download/video/<clip-id>/`
- 직접 CDN 주소는 다운로드 시점의 원본을 재현하기 위해 기록했으며 애플리케이션 런타임에서는 사용하지 않는다.

## Active weather backgrounds

| Weather key    | File               | Original clip                                                                                                                                     | Creator                      | Status              |
| -------------- | ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------- | ------------------- |
| `clear-day`    | `clear.mp4`        | [The Sun Shining Under A Blue Sky](https://www.pexels.com/video/the-sun-shining-under-a-blue-sky-3637063/)                                        | Sher Lyn .                   | Replaced 2026-08-05 |
| `clear-night`  | `night.mp4`        | [Night Sky Timelapse](https://www.pexels.com/video/night-sky-timelapse-5837931/)                                                                  | Dom Le Roy                   | Preserved           |
| `few-clouds`   | `few-clouds.mp4`   | [Blue Sky with Clouds](https://www.pexels.com/video/blue-sky-with-clouds-7692657/)                                                                | I Am Sorin                   | Preserved           |
| `overcast`     | `clouds.mp4`       | [Time Lapse Footage of Dark Clouds](https://www.pexels.com/video/time-lapse-footage-of-dark-clouds-4489974/)                                      | Artyom Saqib                 | Preserved           |
| `drizzle`      | `drizzle.mp4`      | [Rain Water on a Window](https://www.pexels.com/video/rain-water-on-a-window-2094757/)                                                            | Nino Souza                   | Preserved           |
| `rain`         | `rain.mp4`         | [Rain over Window](https://www.pexels.com/video/rain-over-window-13107321/)                                                                       | Yahia Alibrahim              | Preserved           |
| `heavy-rain`   | `heavy-rain.mp4`   | [Heavy Rain Pouring](https://www.pexels.com/video/heavy-rain-pouring-4919509/)                                                                    | Nothing Ahead                | Replaced 2026-08-05 |
| `thunderstorm` | `thunderstorm.mp4` | [Dramatic Thunderstorm Clouds with Lightning Strikes](https://www.pexels.com/video/dramatic-thunderstorm-clouds-with-lightning-strikes-36023141/) | Orhan Namlı                  | Replaced 2026-08-05 |
| `snow`         | `snow.mp4`         | [Snow Falling on the Ground](https://www.pexels.com/video/snow-falling-on-the-ground-6249072/)                                                    | `Ambient_Nature_ Atmosphere` | Replaced 2026-08-05 |
| `fog`          | `fog.mp4`          | [Fog over Forest](https://www.pexels.com/video/fog-over-forest-13157699/)                                                                         | Jozef Papp                   | Preserved           |

## Replacement conversion record

FFmpeg 8.1.1로 변환했다. 공통 출력은 H.264, 1280×720, 24 fps, `yuv420p`, 무음, `faststart`이며 `libx264 -preset slow`를 사용했다. 모든 결과물은 10초이고 1.5 MiB 이하이다.

| File               | Downloaded source                                                                                                                              | Source segment and loop treatment                                                             | Encoding                             | Output bytes |
| ------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- | ------------------------------------ | -----------: |
| `clear.mp4`        | [`3637063-hd_1920_1080_30fps.mp4`](https://videos.pexels.com/video-files/3637063/3637063-hd_1920_1080_30fps.mp4), 10.043 s, 6,368,443 bytes    | 0–5 s를 정방향 뒤 역방향으로 이어 첫 프레임과 마지막 프레임의 장면을 맞춤                     | CRF 27, maxrate 1000k, bufsize 2000k |    1,234,063 |
| `thunderstorm.mp4` | [`15276334_1920_1080_50fps.mp4`](https://videos.pexels.com/video-files/36023141/15276334_1920_1080_50fps.mp4), 5.400 s, 1,158,712 bytes        | 0–5 s를 정방향 뒤 역방향으로 이어 구름 움직임과 번개 장면이 자연스럽게 되돌아오도록 구성      | CRF 27, maxrate 1000k, bufsize 2000k |      245,199 |
| `heavy-rain.mp4`   | [`4919509-hd_1920_1080_25fps.mp4`](https://videos.pexels.com/video-files/4919509/4919509-hd_1920_1080_25fps.mp4), 24.042 s, 17,921,124 bytes   | 5–15 s를 본편으로 쓰고 마지막 2초를 3–5 s와 교차 페이드해 끝 장면이 첫 장면으로 돌아오게 구성 | CRF 28, maxrate 1000k, bufsize 2000k |    1,361,089 |
| `snow.mp4`         | [`6249072-uhd_3840_2160_30fps.mp4`](https://videos.pexels.com/video-files/6249072/6249072-uhd_3840_2160_30fps.mp4), 22.293 s, 69,705,287 bytes | 6–16 s를 본편으로 쓰고 마지막 2초를 4–6 s와 교차 페이드해 끝 장면이 첫 장면으로 돌아오게 구성 | CRF 28, maxrate 1000k, bufsize 2000k |      592,384 |

공통 필터는 `scale=1280:720:force_original_aspect_ratio=increase,crop=1280:720,fps=24`이며 출력 옵션은 `-an -c:v libx264 -preset slow -pix_fmt yuv420p -movflags +faststart`이다. `clear`와 `thunderstorm`은 정방향·역방향 5초를 `concat=n=2:v=1:a=0`으로 결합했다. 고정 카메라인 `heavy-rain`과 `snow`는 마지막 2초에 시작 직전 구간을 `xfade=transition=fade:duration=2:offset=8`로 합성해 반복 경계를 부드럽게 만들었다.

## Verification

`ffprobe`와 1초 간격 중간 프레임 시트로 다음을 확인했다.

| File               | Duration | Codec                   | Size            | Pixel format | Audio | Visual check                                                                           |
| ------------------ | -------: | ----------------------- | --------------- | ------------ | ----- | -------------------------------------------------------------------------------------- |
| `clear.mp4`        | 10.000 s | H.264, 1280×720, 24 fps | 1,234,063 bytes | `yuv420p`    | none  | 구름이 거의 없는 파란 하늘, 햇빛, 나무 실루엣이 전 구간에서 선명함                     |
| `thunderstorm.mp4` | 10.000 s | H.264, 1280×720, 24 fps | 245,199 bytes   | `yuv420p`    | none  | 검은 화면이 아니라 폭풍 구름의 윤곽이 계속 보이고 번개가 양방향 구간에서 반복해 나타남 |
| `heavy-rain.mp4`   | 10.000 s | H.264, 1280×720, 24 fps | 1,361,089 bytes | `yuv420p`    | none  | 인물·주택가 없이 노면에 부딪히는 굵은 빗방울과 물결이 화면 전체에서 확인됨             |
| `snow.mp4`         | 10.000 s | H.264, 1280×720, 24 fps | 592,384 bytes   | `yuv420p`    | none  | 적설된 들판·나무와 실제 내리는 눈이 함께 보여 눈 상태를 즉시 구분할 수 있음            |

## Travel-screen candidates only

아래 영상은 향후 여행지 소개 화면 후보이다. 현재 날씨 배경 매핑과 `public/weather-videos/`에는 넣지 않는다. 모든 후보는 동일한 [Pexels License](https://www.pexels.com/legal-pages/license/)가 적용된다.

| Destination | Candidate scene                         | Creator                                 | Official clip page                                                                                                                          |
| ----------- | --------------------------------------- | --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| 서울        | 한강 수면과 여의도 스카이라인           | Theodore Nguyen                         | [Stunning Seoul Cityscape with Iconic Skyscrapers](https://www.pexels.com/video/stunning-seoul-cityscape-with-iconic-skyscrapers-32242948/) |
| 도쿄        | 광고판과 교통이 있는 야간 거리          | Guarionex Del Carmen                    | [Night at the City of Tokyo](https://www.pexels.com/video/night-at-the-city-of-tokyo-4851872/)                                              |
| 파리        | 해질녘 에펠탑과 도시 전경               | Eugenio Manghi                          | [Paris, the Tour Eiffel](https://www.pexels.com/video/paris-the-tour-eiffel-26612921/)                                                      |
| 뉴욕        | 원 월드 트레이드 센터와 수변 스카이라인 | Zain Naqvi                              | [New York Skyline](https://www.pexels.com/video/new-york-skyline-27380760/)                                                                 |
| 두바이      | 부르즈 할리파 중심 스카이라인           | Abid Ali                                | [Dubai Skyline](https://www.pexels.com/video/dubai-skyline-27607374/)                                                                       |
| 시드니      | 오페라하우스·하버·페리 전경             | David Pickup \| Advertising & Marketing | [Sydney Opera House from Sydney Harbour View](https://www.pexels.com/video/sydney-opera-house-from-sydney-harbour-view-37265113/)           |

이 후보들은 목적지 자체를 소개할 때만 사용하며, 관측·예보 날씨를 설명하는 배경으로 재사용하지 않는다.
