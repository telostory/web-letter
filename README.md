# web-letter

손글씨 폰트(JunHand)로 엽서 크기(148×100mm) 편지를 쓰는 웹 페이지.

## 기능

- 엽서 위에 바로 타이핑 (가로/세로)
- 글씨: 크기, 자간, 장평, 줄 간격, 굵기(보통/가늘게), 색상(프리셋 + 직접 선택)
- 엽서: 종이(크림/화이트/크라프트/하늘), 선(줄/모눈/없음)
- PNG 저장: 300dpi (1748×1181px), 화면과 같은 줄바꿈 규칙으로 다시 그림
- 인쇄 · PDF: 엽서 실제 크기 한 장
- 쓰던 내용과 설정은 브라우저에 자동 저장 (서버로 보내지 않음)
- 내용이 엽서를 넘치면 경고

## 폰트 내려받기

`download/` 폴더에 설치용 TTF(보통·가늘게)와 ZIP이 있고, 페이지 설정 패널에서도 받을 수 있다. 현재 버전: 1.6

## 구조

```
index.html   화면
style.css    엽서·설정 패널 스타일, 인쇄 규칙
app.js       설정 적용, 자동 저장, PNG 저장
fonts/       JunHand-Regular.woff2, JunHand-Light.woff2 (웹 표시용)
download/    JunHand-Regular.ttf, JunHand-Light.ttf, JunHand-1.6.zip (설치용)
```

빌드 과정 없이 정적 파일만으로 동작한다. GitHub Pages(main 브랜치 루트)로 배포.

## 참고

- 줄바꿈은 글자 단위(`word-break: break-all`)라서 영어 단어도 줄 끝에서 나뉠 수 있다. PNG 저장과 화면이 같은 결과를 내기 위한 선택.
- 장평은 글자를 가로로 눌러 담는 방식(`scaleX`)이라 획도 함께 가늘어진다.
