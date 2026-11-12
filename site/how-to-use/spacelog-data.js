(function () {
  // 한 번만 실행: 테스트로 넣은 기록과 별자리를 비웁니다. 지우기 전 내용은 spacelog_backup_1112에 보관합니다.
  try {
    if (!localStorage.getItem('spacelog_reset_1112')) {
      const keys = ['spacelog_inbox_v1', 'spacelog_links_v1', 'spacelog_obs_v1', 'spacelog_collector_last_v1'], bak = {};
      keys.forEach(k => { const v = localStorage.getItem(k); if (v !== null) bak[k] = v; });
      if (Object.keys(bak).length) localStorage.setItem('spacelog_backup_1112', JSON.stringify(bak));
      keys.forEach(k => localStorage.removeItem(k));
      localStorage.setItem('spacelog_reset_1112', '1');
    }
  } catch (e) {}
  const SEED_LINK = { id: 'seed-csv', name: 'cvs 활용 데이터 대시보드', memo: '운동 기록을 활용한 cvs 활용 데이터 대시보드 만들기 프로젝트', titles: ['workouts.csv', 'PRD 2차 의견'] }, SEED_LINK_OFF = 'spacelog_seedlink_off_v1';
  const IMG = 'assets/planet-hero.png';
  const planets = [
    { id: 'p1', name: '제품 기획',       x: -250, y: -30,  accent: '#8fb4ff', base: '#2f6fe0', filter: 'none' },
    { id: 'p2', name: '읽은 것들',       x: 230,  y: -170, accent: '#ffb07a', base: '#c2561f', filter: 'hue-rotate(175deg) saturate(1.3)' },
    { id: 'p3', name: '생각 조각',       x: 280,  y: 170,  accent: '#c4a8ff', base: '#7a4fd6', filter: 'hue-rotate(55deg) saturate(1.2)' },
    { id: 'p4', name: '디자인 레퍼런스', x: -40,  y: 250,  accent: '#ff8fcf', base: '#b8327f', filter: 'hue-rotate(115deg) saturate(1.2)' },
    { id: 'p5', name: '회의록',         x: -520, y: 220,  accent: '#6fdcaa', base: '#1f7a55', filter: 'hue-rotate(-75deg) saturate(1.2)' },
    { id: 'p6', name: 'CSV 데이터',     x: -560, y: -150, accent: '#7fe3ff', base: '#0d7490', filter: 'hue-rotate(-20deg) saturate(1.4)' }
  ];
  const EXTRA = [
    { accent: '#ff8f7a', base: '#c2402a', filter: 'hue-rotate(150deg) saturate(1.6)' },
    { accent: '#7fe3ff', base: '#0d7490', filter: 'hue-rotate(-20deg) saturate(1.4)' }
  ];
  // [planet, kind, title, meta, memo, daysAgo, hour]
  const raw = [
    ['p1','image','스프린트 회의 캡처.png','PNG · 1.8MB','다음 스프린트 우선순위 근거',7,10],
    ['p1','text','온보딩 리서치 메모','텍스트 · 412자','사용자 5명 인터뷰 요약. 첫 화면에서 이탈이 가장 많음.',7,15],
    ['p1','link','경쟁사 온보딩 링크','notion.so','가입 단계가 3개뿐',1,11],
    ['p1','file','요구사항 초안.pdf','PDF · 640KB','',2,14],
    ['p1','file','로드맵 v3.key','Keynote · 12MB','',9,9],
    ['p1','file','가격 정책 비교표.xlsx','Excel · 88KB','',5,16],
    ['p1','image','사용자 여정 스케치.jpg','JPG · 2.2MB','화이트보드에서 옮김',3,13],
    ['p1','link','NPS 설문 결과','forms.google.com','',4,10],
    ['p1','text','알림 정책 초안','텍스트 · 230자','하루 1회 이하',0,9],
    ['p1','text','릴리스 체크리스트','텍스트 · 180자','',6,18],
    ['p1','image','우선순위 보드 캡처.png','PNG · 940KB','',10,11],
    ['p1','link','피드백 모음 시트','sheets.google.com','',12,15],
    ['p1','link','지표 대시보드','metabase.local','',8,10],
    ['p1','text','PRD 2차 의견','텍스트 · 520자','개발 A 의견 반영 필요',0,11],
    ['p2','text','「좋은 화면의 조건」 3장 메모','텍스트 · 300자','빈 상태도 화면이다',1,21],
    ['p2','link','디자인 시스템 운영기','medium.com','',2,22],
    ['p2','link','접근성 체크리스트','a11yproject.com','',4,20],
    ['p2','file','리서치 질문 설계법.pdf','PDF · 2.1MB','',5,23],
    ['p2','link','스크롤 깊이 분석 글','uxdesign.cc','',6,8],
    ['p2','link','로컬 퍼스트 소프트웨어 에세이','inkandswitch.com','우리 서비스 원칙과 같음',8,21],
    ['p2','link','회고 템플릿 모음','notion.so','',9,19],
    ['p2','text','타이포그래피 기초 노트','텍스트 · 640자','',11,22],
    ['p2','image','마이크로카피 사례 캡처.png','PNG · 760KB','',3,20],
    ['p2','link','데이터 시각화 원칙','observablehq.com','',13,21],
    ['p2','text','「AI와 일하는 법」 밑줄','텍스트 · 150자','',0,8],
    ['p3','text','탐사선 아이콘 아이디어','텍스트 · 90자','',0,13],
    ['p3','text','별 크기 = 기록 수?','텍스트 · 60자','행성 크기만 바꾸는 게 나을 수도',2,17],
    ['p3','text','재발견 알림 문구 후보','텍스트 · 210자','',3,12],
    ['p3','image','화이트보드 사진.jpg','JPG · 3.4MB','',5,15],
    ['p3','text','주말 프로젝트 목록','텍스트 · 120자','',6,10],
    ['p3','text','회의 중 떠오른 질문','텍스트 · 80자','',8,14],
    ['p3','text','단축키 충돌 메모','텍스트 · 140자','Ctrl+Shift+S는 스크린샷과 겹침',10,16],
    ['p3','file','산책 중 음성 메모.m4a','오디오 · 4.8MB','',12,18],
    ['p3','text','이름 후보 목록','텍스트 · 70자','',8,22],
    ['p4','image','다크 대시보드 레퍼런스.png','PNG · 1.2MB','카드 밀도 참고',1,15],
    ['p4','link','행성 일러스트 무드보드','are.na','',4,16],
    ['p4','file','모션 레퍼런스.mp4','MP4 · 18MB','',6,11],
    ['p4','image','카드 레이아웃 캡처.png','PNG · 820KB','',9,14],
    ['p4','link','아이콘 세트 후보','lucide.dev','',11,13],
    ['p5','text','11월 주간회의','텍스트 · 1,240자','결정: W-04는 복사만',2,10],
    ['p5','text','디자인 리뷰 메모','텍스트 · 860자','',5,17],
    ['p5','file','킥오프 회의록.docx','Word · 64KB','',13,10]
  ];
  const dayStart = d => { const x = new Date(d); x.setHours(0, 0, 0, 0); return x; };
  const now = new Date();
  const stars = raw.map((r, i) => {
    const d = dayStart(now); d.setDate(d.getDate() - r[5]); d.setHours(r[6], (i * 7) % 60);
    return { id: 's' + (i + 1), planet: r[0], kind: r[1], title: r[2], meta: r[3], memo: r[4], addedAt: d.toISOString(), ...(r[1] === 'text' && r[4] ? { body: r[4] } : {}) };
  });

  // 예시 CSV 기록: 파일 내용(열과 행)까지 저장돼 관측소에서 대시보드로 볼 수 있습니다.
  const CSVS = [
    ['p6', "books.csv", 0, ["id","제목","저자","분야","난이도","쪽수","추천직군","한줄소개"], [["1","처음 만나는 파이썬","박지우","디자인","중급","160","디자인","캠프생이 추천한 책 (가상)"],["2","데이터로 말하기","정우진","기획","심화","310","마케팅","캠프생이 추천한 책 (가상)"],["3","디자인의 첫 문장","김도현","마케팅","입문","350","디자인","캠프생이 추천한 책 (가상)"],["4","질문하는 기획자","이서진","커리어","중급","319","디자인","캠프생이 추천한 책 (가상)"],["5","마케팅은 숫자다","정우진","개발","심화","389","PO","캠프생이 추천한 책 (가상)"],["6","웹은 어떻게 도나","김도현","디자인","입문","310","개발","캠프생이 추천한 책 (가상)"],["7","좋은 화면의 조건","이서진","기획","중급","236","마케팅","캠프생이 추천한 책 (가상)"],["8","작게 시작하는 서비스","최하린","마케팅","심화","","디자인","캠프생이 추천한 책 (가상)"],["9","글쓰기의 기술","정우진","커리어","입문","236","PO","캠프생이 추천한 책 (가상)"],["10","AI와 일하는 법","김도현","개발","중급","271","마케팅","캠프생이 추천한 책 (가상)"],["11","검산하는 습관","이서진","디자인","심화","161","마케팅","캠프생이 추천한 책 (가상)"],["12","사용자 인터뷰 입문","정우진","기획","입문","240","디자인","캠프생이 추천한 책 (가상)"],["13","색과 글꼴 이야기","김도현","마케팅","중급","388","PO","캠프생이 추천한 책 (가상)"],["14","리더 없는 팀","정우진","커리어","심화","192","디자인","캠프생이 추천한 책 (가상)"],["15","SQL 한 그릇","이서진","개발","입문","226","디자인","캠프생이 추천한 책 (가상)"],["16","포트폴리오 만들기","정우진","디자인","중급","245","PO","캠프생이 추천한 책 (가상)"],["17","실패에서 배운 것들","이서진","기획","심화","296","PO","캠프생이 추천한 책 (가상)"],["18","한 장으로 정리하기","박지우","마케팅","입문","204","디자인","캠프생이 추천한 책 (가상)"],["19","프롬프트 노트","이서진","커리어","중급","357","디자인","캠프생이 추천한 책 (가상)"],["20","테스트의 기쁨","박지우","개발","심화","275","PO","캠프생이 추천한 책 (가상)"],["21","브랜드의 목소리","정우진","디자인","입문","","PO","캠프생이 추천한 책 (가상)"],["22","숫자 읽는 기획","박지우","기획","중급","329","마케팅","캠프생이 추천한 책 (가상)"],["23","접근성 첫걸음","박지우","마케팅","심화","229","PO","캠프생이 추천한 책 (가상)"],["24","플라스크 산책","정우진","커리어","입문","303","PO","캠프생이 추천한 책 (가상)"]]],
    ['p6', "cafes.csv", 0, ["id","이름","지역","대표메뉴","가격","콘센트","여는시간","닫는시간","평점"], [["1","모퉁이 커피","합정","크로플","4000","있음","10:00","23:00","4.5"],["2","오늘의 원두","강남","크로플","6500","있음","10:00","22:00","4.7"],["3","창가 자리","해운대","라떼","6500","있음","11:00","21:00","4.2"],["4","빵굽는 오후","둔산","소금빵","7000","","11:00","20:00","4.9"],["5","느린 하루","동성로","크로플","4000","있음","11:00","23:00","4.1"],["6","초록 잔","성수","소금빵","5000","있음","10:00","22:00",""],["7","골목 다방","합정","핸드드립","5500","있음","09:00","20:00","3.5"],["8","라떼 연구소","강남","라떼","7000","없음","10:00","23:00","3.3"],["9","바닐라 숲","해운대","소금빵","","없음","08:00","22:00","3.9"],["10","책 읽는 카페","둔산","라떼","4000","있음","11:00","21:00","4.7"],["11","작은 정원","동성로","말차라떼","4500","있음","11:00","20:00","3.9"],["12","새벽 로스터리","성수","아메리카노","4500","있음","08:00","20:00","3.7"],["13","달 카페","합정","소금빵","6000","","10:00","20:00","4.6"],["14","한 잔의 쉼표","강남","아메리카노","6000","있음","10:00","23:00","4.7"],["15","파란 지붕","해운대","크로플","4000","없음","08:00","20:00","4.2"],["16","구름 베이커리","둔산","말차라떼","6000","없음","11:00","21:00","4.9"],["17","말차 하우스","동성로","아메리카노","","있음","09:00","23:00","3.9"],["18","따뜻한 머그","성수","핸드드립","6500","있음","11:00","23:00","3.5"],["19","노을 테라스","합정","아메리카노","6500","없음","08:00","20:00","4.8"],["20","별빛 다방","강남","크로플","5500","","11:00","22:00","4.1"],["21","소금 빵집","해운대","크로플","4000","없음","08:00","20:00","4.0"],["22","카페 도서관","둔산","크로플","6500","있음","08:00","23:00","3.9"],["23","흰 고양이 커피","동성로","크로플","6000","있음","09:00","20:00",""],["24","둥근 테이블","성수","핸드드립","4500","있음","08:00","21:00","3.8"]]],
    ['p6', "classes.csv", 0, ["id","카테고리","지역","클래스명","상세링크","정가","할인가","평점","리뷰수","NEW"], [["1","음악","서울 강남","2시간 완성 보컬 원포인트","http://127.0.0.1:8000/class/1","25000.0","","3.9","121","False"],["2","공예","서울 성수","라탄 바구니","http://127.0.0.1:8000/class/2","39000.0","31200.0","4.4","213","False"],["3","공예","부산 해운대","캔들 만들기","http://127.0.0.1:8000/class/3","25000.0","20000.0","4.7","174","False"],["4","디지털","대전 둔산","커플 AI로 영상 만들기","http://127.0.0.1:8000/class/4","79000.0","","4.7","103","False"],["5","운동","광주 상무","소규모 필라테스 원데이","http://127.0.0.1:8000/class/5","45000.0","","4.7","166","False"],["6","운동","서울 강남","커플 클라이밍 체험","http://127.0.0.1:8000/class/6","30000.0","","4.3","190","False"],["7","공예","대전 둔산","처음 만드는 도자기 머그","http://127.0.0.1:8000/class/7","35000.0","","3.9","143","False"],["8","공예","서울 강남","주말 매듭 팔찌","http://127.0.0.1:8000/class/8","30000.0","","4.8","115","False"],["9","음악","온라인","작곡 맛보기","http://127.0.0.1:8000/class/9","45000.0","","4.0","132","False"],["10","요리","서울 마포","처음 만드는 수제 마카롱","http://127.0.0.1:8000/class/10","35000.0","","4.1","150","False"],["11","운동","부산 해운대","커플 클라이밍 체험","http://127.0.0.1:8000/class/11","65000.0","52000.0","","0","False"],["12","운동","대전 둔산","2시간 완성 필라테스 원데이","http://127.0.0.1:8000/class/12","65000.0","","5.0","232","False"],["13","디지털","서울 마포","노션 정리법","http://127.0.0.1:8000/class/13","","","3.8","142","False"],["14","드로잉","대구 동성로","주말 캘리그라피","http://127.0.0.1:8000/class/14","39000.0","31200.0","4.4","190","False"],["15","요리","서울 성수","2시간 완성 파스타 원데이","http://127.0.0.1:8000/class/15","30000.0","","4.6","11","False"],["16","음악","부산 해운대","작곡 맛보기","http://127.0.0.1:8000/class/16","45000.0","","4.7","182","False"],["17","공예","서울 성수","처음 만드는 자개 키링","http://127.0.0.1:8000/class/17","39000.0","","4.4","18","False"],["18","드로잉","서울 강남","소규모 수채화 엽서","http://127.0.0.1:8000/class/18","45000.0","","4.5","133","False"],["19","디지털","서울 성수","스마트폰 사진","http://127.0.0.1:8000/class/19","65000.0","58500.0","4.7","92","False"],["20","운동","서울 강남","러닝 크루 입문","http://127.0.0.1:8000/class/20","45000.0","","4.4","81","False"],["21","공예","광주 상무","주말 매듭 팔찌","http://127.0.0.1:8000/class/21","25000.0","20000.0","3.7","45","False"],["22","공예","대전 둔산","자개 키링","http://127.0.0.1:8000/class/22","45000.0","","","0","False"],["23","드로잉","대구 동성로","소규모 캘리그라피","http://127.0.0.1:8000/class/23","25000.0","21200.0","3.6","127","False"],["24","운동","서울 성수","직장인 클라이밍 체험","http://127.0.0.1:8000/class/24","39000.0","31200.0","4.7","107","False"],["25","음악","부산 해운대","소규모 작곡 맛보기","http://127.0.0.1:8000/class/25","120000.0","102000.0","3.7","233","False"],["26","드로잉","서울 강남","주말 캘리그라피","http://127.0.0.1:8000/class/26","","","4.1","20","False"],["27","공예","대구 동성로","커플 가죽 카드지갑","http://127.0.0.1:8000/class/27","35000.0","","4.5","217","False"],["28","드로잉","부산 해운대","직장인 아이패드 드로잉","http://127.0.0.1:8000/class/28","120000.0","","4.6","205","False"],["29","음악","대구 동성로","2시간 완성 작곡 맛보기","http://127.0.0.1:8000/class/29","65000.0","55200.0","4.2","4","False"],["30","음악","온라인","커플 작곡 맛보기","http://127.0.0.1:8000/class/30","49000.0","","4.1","112","False"],["31","디지털","서울 성수","2시간 완성 노션 정리법","http://127.0.0.1:8000/class/31","35000.0","","4.2","163","False"],["32","음악","광주 상무","처음 만드는 우쿨렐레 입문","http://127.0.0.1:8000/class/32","55000.0","44000.0","4.3","125","False"],["33","디지털","서울 강남","커플 노션 정리법","http://127.0.0.1:8000/class/33","25000.0","","","0","False"],["34","음악","서울 강남","보컬 원포인트","http://127.0.0.1:8000/class/34","25000.0","20000.0","5.0","114","False"],["35","드로잉","온라인","인물 크로키","http://127.0.0.1:8000/class/35","120000.0","","4.8","66","False"],["36","음악","온라인","보컬 원포인트","http://127.0.0.1:8000/class/36","79000.0","","3.8","154","False"],["37","운동","부산 해운대","2시간 완성 필라테스 원데이","http://127.0.0.1:8000/class/37","79000.0","","3.9","137","False"],["38","요리","대구 동성로","직장인 비건 베이킹","http://127.0.0.1:8000/class/38","25000.0","20000.0","4.4","91","False"],["39","요리","대전 둔산","주말 한식 밑반찬","http://127.0.0.1:8000/class/39","","","3.7","106","False"],["40","디지털","대구 동성로","소규모 스마트폰 사진","http://127.0.0.1:8000/class/40","55000.0","49500.0","4.2","198","False"],["41","운동","서울 성수","주말 클라이밍 체험","http://127.0.0.1:8000/class/41","49000.0","41600.0","3.9","200","False"],["42","디지털","서울 강남","2시간 완성 노션 정리법","http://127.0.0.1:8000/class/42","120000.0","","3.9","218","False"],["43","드로잉","부산 해운대","주말 아이패드 드로잉","http://127.0.0.1:8000/class/43","25000.0","22500.0","5.0","99","False"],["44","디지털","부산 해운대","스마트폰 사진","http://127.0.0.1:8000/class/44","79000.0","","","0","False"],["45","공예","서울 마포","소규모 자개 키링","http://127.0.0.1:8000/class/45","79000.0","","4.8","196","False"],["46","공예","부산 해운대","커플 자개 키링","http://127.0.0.1:8000/class/46","79000.0","","3.6","114","False"],["47","요리","대구 동성로","2시간 완성 한식 밑반찬","http://127.0.0.1:8000/class/47","55000.0","","4.5","190","False"],["48","운동","광주 상무","2시간 완성 러닝 크루 입문","http://127.0.0.1:8000/class/48","35000.0","","3.8","31","False"],["49","운동","대전 둔산","클라이밍 체험","http://127.0.0.1:8000/class/49","25000.0","","4.3","11","False"],["50","음악","대전 둔산","커플 우쿨렐레 입문","http://127.0.0.1:8000/class/50","65000.0","","4.7","22","False"],["51","디지털","서울 성수","직장인 노션 정리법","http://127.0.0.1:8000/class/51","120000.0","","4.0","67","False"],["52","공예","부산 해운대","소규모 캔들 만들기","http://127.0.0.1:8000/class/52","","","4.4","47","False"],["53","음악","광주 상무","주말 보컬 원포인트","http://127.0.0.1:8000/class/53","49000.0","44100.0","3.8","218","False"],["54","디지털","서울 성수","직장인 노션 정리법","http://127.0.0.1:8000/class/54","35000.0","","4.9","71","False"],["55","디지털","서울 성수","처음 만드는 AI로 영상 만들기","http://127.0.0.1:8000/class/55","30000.0","","","0","True"],["56","디지털","서울 마포","처음 만드는 스마트폰 사진","http://127.0.0.1:8000/class/56","79000.0","","3.7","114","True"],["57","드로잉","서울 마포","커플 수채화 엽서","http://127.0.0.1:8000/class/57","30000.0","","3.6","42","True"],["58","운동","서울 강남","클라이밍 체험","http://127.0.0.1:8000/class/58","79000.0","","3.9","144","True"],["59","요리","부산 해운대","주말 전통주 빚기","http://127.0.0.1:8000/class/59","79000.0","","5.0","58","True"],["60","디지털","대전 둔산","처음 만드는 스마트폰 사진","http://127.0.0.1:8000/class/60","65000.0","","4.3","208","True"]]],
    ['p6', "movies.csv", 0, ["id","제목","연도","장르","감독","러닝타임_분","평점","한줄평"], [["1","별빛 정류장","2022","다큐멘터리","김하늘","111","4.1","보고 나서 한참 생각났어요"],["2","마지막 여름 편지","2026","SF","정민호","135","3.4","아이와 보기 좋아요"],["3","도시의 고양이들","2016","애니메이션","정민호","142","3.3","아이와 보기 좋아요"],["4","13번째 문","2026","스릴러","정민호","99","4.0","영상이 아름다워요"],["5","바다로 가는 버스","2021","코미디","최유나","140","4.4","끝까지 긴장돼요"],["6","겨울 도서관","2017","드라마","이도윤","148","2.8","끝까지 긴장돼요"],["7","로봇과 소년","2016","다큐멘터리","최유나","94","","영상이 아름다워요"],["8","붉은 우산","2015","SF","한서연","129","3.5","음악이 오래 남아요"],["9","시간을 파는 가게","2019","애니메이션","김하늘","98","4.9","아이와 보기 좋아요"],["10","달리는 할머니","2025","스릴러","박서준","129","3.5","끝까지 긴장돼요"],["11","조용한 탐정","2023","코미디","정민호","","4.8","음악이 오래 남아요"],["12","우주 택배","2023","드라마","김하늘","138","3.9","보고 나서 한참 생각났어요"],["13","골목 식당 일기","2022","다큐멘터리","최유나","123","4.8","보고 나서 한참 생각났어요"],["14","두 번째 무대","2021","SF","정민호","107","4.3","아이와 보기 좋아요"],["15","안개 속 섬","2017","애니메이션","한서연","97","","영상이 아름다워요"],["16","작은 영웅들","2021","스릴러","박서준","141","3.6","아이와 보기 좋아요"],["17","밤의 라디오","2016","코미디","정민호","148","3.4","음악이 오래 남아요"],["18","너의 이름은 민트","2017","드라마","정민호","123","4.7","보고 나서 한참 생각났어요"],["19","초록 자전거","2022","다큐멘터리","김하늘","","4.5","가볍게 웃기 좋아요"],["20","거꾸로 가는 시계","2022","SF","김하늘","90","4.8","아이와 보기 좋아요"],["21","마지막 버스킹","2020","애니메이션","박서준","109","3.3","영상이 아름다워요"],["22","숲속 수업","2019","스릴러","김하늘","121","","가볍게 웃기 좋아요"],["23","비밀 정원 사건","2023","코미디","이도윤","117","3.1","아이와 보기 좋아요"],["24","해변의 체스","2023","드라마","최유나","125","3.8","영상이 아름다워요"]]],
    ['p6', "songs.csv", 0, ["id","제목","아티스트","장르","분위기","길이_초","추천조","BPM"], [["1","새벽 세 시의 커피","듀오 민트","인디","위로","198","5조","90"],["2","너에게 가는 길","프로젝트 파도","댄스","집중","194","1조","127"],["3","파란 신호등","트리오 숲","힙합","신남","238","1조","76"],["4","주말의 끝","듀오 민트","재즈","잔잔","216","1조",""],["5","별이 쏟아지는 밤","트리오 숲","발라드","위로","213","2조","126"],["6","출근길 플레이","듀오 민트","인디","집중","172","5조","70"],["7","작은 방의 우주","듀오 민트","댄스","신남","195","6조","113"],["8","여름 소나기","듀오 민트","힙합","잔잔","239","3조","101"],["9","춤추는 고양이","솔로 하늘","재즈","위로","201","1조","79"],["10","마지막 정류장","프로젝트 파도","발라드","집중","179","6조","135"],["11","햇살 한 조각","듀오 민트","인디","신남","233","5조",""],["12","도시의 불빛","듀오 민트","댄스","잔잔","207","2조","104"],["13","다시 봄","듀오 민트","힙합","위로","208","6조","95"],["14","느린 오후","솔로 하늘","재즈","집중","228","2조","90"],["15","월요일 탈출","듀오 민트","발라드","신남","176","4조","130"],["16","바람의 노래","밴드 노을","인디","잔잔","212","3조","80"],["17","코딩하는 밤","트리오 숲","댄스","위로","259","3조","112"],["18","손편지","듀오 민트","힙합","집중","251","5조",""],["19","한강 산책","듀오 민트","재즈","신남","201","5조","122"],["20","오늘도 수고했어","밴드 노을","발라드","잔잔","245","6조","140"]]],
    ['p6', "workouts.csv", 0, ["id","날짜","종목","시간_분","칼로리","강도","메모"], [["1","2026-10-13","수영","90","442","쉬움",""],["2","2026-10-13","요가","45","","힘듦",""],["3","2026-10-13","근력","20","162","보통",""],["4","2026-10-13","요가","50","387","보통",""],["5","2026-10-14","근력","30","","쉬움",""],["6","2026-10-16","근력","45","207","힘듦",""],["7","2026-10-16","자전거","40","184","힘듦",""],["8","2026-10-17","자전거","50","441","쉬움",""],["9","2026-10-18","근력","20","154","힘듦",""],["10","2026-10-18","자전거","45","","힘듦",""],["11","2026-10-21","요가","60","347","보통",""],["12","2026-10-22","달리기","40","304","보통",""],["13","2026-10-22","달리기","40","","쉬움",""],["14","2026-10-23","자전거","20","190","쉬움",""],["15","2026-10-23","요가","45","222","힘듦",""],["16","2026-10-24","수영","50","229","보통",""],["17","2026-10-24","걷기","40","170","힘듦",""],["18","2026-10-25","근력","40","236","힘듦",""],["19","2026-10-26","자전거","40","390","힘듦",""],["20","2026-10-29","요가","45","309","보통",""],["21","2026-10-29","자전거","30","138","보통",""],["22","2026-10-31","수영","45","262","쉬움",""],["23","2026-11-01","달리기","40","366","쉬움",""],["24","2026-11-02","수영","90","600","보통",""],["25","2026-11-02","달리기","30","150","힘듦",""],["26","2026-11-04","걷기","45","317","보통",""],["27","2026-11-04","수영","40","232","쉬움",""],["28","2026-11-04","요가","90","474","보통",""],["29","2026-11-06","자전거","60","562","힘듦",""],["30","2026-11-06","수영","30","271","힘듦",""]]]
  ];
  CSVS.forEach((c, i) => { const d = dayStart(now); d.setDate(d.getDate() - c[2]); d.setHours(9 + i, 20);
    stars.push({ id: 'c' + (i + 1), planet: c[0], kind: 'file', title: c[1], meta: 'CSV · ' + c[4].length + '행', memo: '', addedAt: d.toISOString(), csv: { cols: c[3], rows: c[4] } }); });

  // 데모 시드: 원본 예시를 되풀이해 n개로 늘립니다. SEED_N은 DEMO 1장(행성 4개 · 이번 주 별 20개), STAR_CAP은 DEMO AC-우주-8 잠정 수치입니다.
  const SEED_N = 20, OVER_N = 2400, STAR_CAP = 2000, SEED_DAYS = 30;
  function seeded(n) {
    if (n === SEED_N) {
      const q = { p1: 7, p2: 6, p3: 4, p4: 3 }, t7 = dayStart(now); t7.setDate(t7.getDate() - 7);
      const wk = stars.filter(s => inPeriod(s, 'week') && q[s.planet]-- > 0);
      const old = stars.filter(s => s.planet in q && dayStart(s.addedAt).getTime() === t7.getTime());
      return clone({ planets: planets.slice(0, 4), stars: wk.concat(old) });
    }
    let seed = 11; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    const extra = [];
    for (let i = stars.length; i < n; i++) {
      const r = raw[i % raw.length], d = dayStart(now); d.setDate(d.getDate() - Math.floor(rnd() * SEED_DAYS)); d.setHours(8 + Math.floor(rnd() * 14), Math.floor(rnd() * 60));
      extra.push({ id: 'd' + i, planet: r[0], kind: r[1], title: r[2] + ' · ' + (Math.floor(i / raw.length) + 1), meta: r[3], memo: '', addedAt: d.toISOString() });
    }
    return clone({ planets, stars: stars.concat(extra) });
  }

  const KIND = { image: '이미지', file: '파일', link: '링크', text: '텍스트' };
  const ICON = { image: 'image', file: 'file-text', link: 'link', text: 'type' };
  const iconUrl = n => 'https://unpkg.com/lucide-static@0.469.0/icons/' + n + '.svg';
  const PERIODS = [
    { key: 'today', label: '오늘' }, { key: 'week', label: '이번 주' }, { key: 'month', label: '이번 달' },
    { key: 'all', label: '전체' }, { key: 'custom', label: '직접 지정' }
  ];
  function range(period, custom) {
    const t = dayStart(new Date()), end = new Date(t); end.setDate(end.getDate() + 1);
    if (period === 'today') return [t, end];
    if (period === 'week') { const s = new Date(t); s.setDate(s.getDate() - 6); return [s, end]; }
    if (period === 'month') { const s = new Date(t); s.setDate(s.getDate() - 29); return [s, end]; }
    if (period === 'custom' && custom && custom.from && custom.to) { const s = dayStart(custom.from), e = dayStart(custom.to); e.setDate(e.getDate() + 1); return [s, e]; }
    return [new Date(0), new Date(8640000000000000)];
  }
  function inPeriod(star, period, custom) { const [s, e] = range(period, custom); const d = new Date(star.addedAt); return d >= s && d < e; }
  function fmtDate(iso, withTime) {
    const d = new Date(iso);
    const s = (d.getMonth() + 1) + '월 ' + d.getDate() + '일';
    return withTime ? s + ' ' + String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0') : s;
  }
  function relDate(iso) {
    const days = Math.round((dayStart(new Date()) - dayStart(iso)) / 86400000);
    return days === 0 ? '오늘' : days === 1 ? '어제' : days + '일 전';
  }
  function rediscovery(db) {
    const t = dayStart(new Date()); t.setDate(t.getDate() - 7);
    const e = new Date(t); e.setDate(e.getDate() + 1);
    return db.stars.filter(s => { const d = new Date(s.addedAt); return d >= t && d < e; }).sort((a, b) => a.addedAt < b.addedAt ? 1 : -1)[0] || null;
  }
  function clone(db) { return { planets: db.planets.map(p => ({ ...p })), stars: db.stars.map(s => ({ ...s })), links: (db.links || []).map(l => ({ ...l, ids: [...l.ids] })), trash: (db.trash || []).slice() }; }
  function reduce(db, a) {
    const n = clone(db);
    switch (a.type) {
      case 'editPlanet': n.planets.forEach(p => { if (p.id === a.id) { p.name = a.name; p.accent = a.accent; p.base = a.base; p.filter = a.filter; p.shape = a.shape || ''; } }); break;
      case 'setGroups': n.planets.forEach(p => { if (a.map && p.id in a.map) p.group = a.map[p.id]; }); break;
      case 'setGroup': n.planets.forEach(p => { if (p.id === a.id) p.group = a.group || ''; }); break;
      case 'renameGroup': n.planets.forEach(p => { if (p.group === a.from) p.group = a.to; }); break;
      case 'rename': n.planets.forEach(p => { if (p.id === a.id) p.name = a.name; }); break;
      case 'createPlanet': {
        const i = n.planets.length, ex = EXTRA[i % EXTRA.length], c = n.planets.length || 1;
        const sp = freeSpot(n.planets, Math.round(n.planets.reduce((s, p) => s + p.x, 0) / c), Math.round(n.planets.reduce((s, p) => s + p.y, 0) / c));
        n.planets.push({ id: a.id, name: a.name, x: sp.x, y: sp.y, ...ex }); break;
      }
      // 블랙홀: 행성과 그 안의 기록을 함께 지웁니다.
      case 'destroyPlanet': { const dp = n.planets.find(p => p.id === a.id); if (!dp) break; const gone = n.stars.filter(s => s.planet === a.id).map(s => s.id);
        n.trash = n.trash.concat([{ id: dp.id, planet: { ...dp }, stars: n.stars.filter(s => s.planet === a.id).map(s => ({ ...s })), at: new Date().toISOString() }]); saveInbox(inbox().filter(s => s.planet !== a.id)); n.stars = n.stars.filter(s => s.planet !== a.id); n.planets = n.planets.filter(p => p.id !== a.id);
        n.links = n.links.map(l => ({ ...l, ids: l.ids.filter(i => !gone.includes(i)) })).filter(l => l.ids.length > 0); break; }
      // 블랙홀에서 꺼내기: 행성과 기록을 되살립니다 (별자리 연결은 되살리지 않습니다).
      case 'restorePlanet': { const t = n.trash.find(x => x.id === a.id); if (!t || n.planets.some(p => p.id === t.id)) break; const sp = freeSpot(n.planets, t.planet.x, t.planet.y);
        n.planets.push({ ...t.planet, x: sp.x, y: sp.y }); n.stars = n.stars.concat(t.stars.filter(s => !n.stars.some(x => x.id === s.id))); saveInbox(inbox().concat(t.stars.filter(s => /^in/.test(s.id) && !inbox().some(x => x.id === s.id)))); n.trash = n.trash.filter(x => x.id !== a.id); break; }
      case 'purgePlanet': n.trash = n.trash.filter(x => x.id !== a.id); break;
      case 'movePlanet': { const sp = freeSpot(n.planets, Math.round(a.x), Math.round(a.y), a.id); n.planets.forEach(p => { if (p.id === a.id) { p.x = sp.x; p.y = sp.y; } }); break; }
      case 'merge': saveInbox(inbox().map(s => s.planet === a.from ? { ...s, planet: a.to } : s)); n.stars.forEach(s => { if (s.planet === a.from) s.planet = a.to; }); n.planets = n.planets.filter(p => p.id !== a.from); break;
      case 'deletePlanet': if (!n.stars.some(s => s.planet === a.id)) n.planets = n.planets.filter(p => p.id !== a.id); break;
      case 'moveStar': patchInbox([a.id], { planet: a.planet }); n.stars.forEach(s => { if (s.id === a.id) s.planet = a.planet; }); break;
      case 'deleteStar': saveInbox(inbox().filter(s => s.id !== a.id)); n.stars = n.stars.filter(s => s.id !== a.id); n.links = n.links.map(l => ({ ...l, ids: l.ids.filter(i => i !== a.id) })).filter(l => l.ids.length > 0); break;
      // 별자리: 기록에 관측 목적(memo)과 보는 방식(viz)을 붙인 묶음입니다.
      case 'link': n.links.push({ id: a.id, name: a.name, memo: a.memo || '', viz: a.viz || null, ids: [...new Set(a.ids)], createdAt: new Date().toISOString() }); break;
      case 'linkAdd': n.links.forEach(l => { if (l.id === a.id) l.ids = [...new Set(l.ids.concat(a.ids))]; }); break;
      case 'unlink': { const gone = n.links.find(l => l.id === a.id); if (gone && (gone.id === SEED_LINK.id || gone.name === SEED_LINK.name)) { try { localStorage.setItem(SEED_LINK_OFF, '1'); } catch (e) {} } n.links = n.links.filter(l => l.id !== a.id); break; }
      case 'linkEdit': n.links.forEach(l => { if (l.id === a.id) { l.name = a.name; l.memo = a.memo || ''; } }); break;
      case 'linkSet': n.links.forEach(l => { if (l.id === a.id) l.ids = [...new Set(a.ids)]; }); break;
      case 'linkViz': n.links.forEach(l => { if (l.id === a.id) l.viz = a.viz; }); break;
      case 'memo': patchInbox([a.id], { memo: a.memo }); n.stars.forEach(s => { if (s.id === a.id) s.memo = a.memo; }); break;
    }
    if (/editPlanet|rename|movePlanet|createPlanet/.test(a.type)) n.planets.forEach(p => { if (p.id === a.id) p.editedAt = new Date().toISOString(); });
    if (/link|deleteStar|destroyPlanet/.test(a.type)) saveLinks(n.links, n.stars);
    if (/createPlanet|movePlanet|deletePlanet|destroyPlanet|restorePlanet|rename|editPlanet|merge|setGroup/.test(a.type)) savePlanets(n.planets, /deletePlanet|destroyPlanet/.test(a.type) && !n.planets.some(p => p.id === a.id) ? a.id : null, a.type === 'restorePlanet' ? a.id : null);
    if (/destroyPlanet|restorePlanet|purgePlanet/.test(a.type)) saveTrash(n.trash);
    return n;
  }
  function buildExport(db, ids, format) {
    const list = ids.map(id => db.stars.find(s => s.id === id)).filter(Boolean);
    const pName = id => (db.planets.find(p => p.id === id) || {}).name || '행성 없음';
    const today = new Date(); const ds = today.getFullYear() + '-' + String(today.getMonth() + 1).padStart(2, '0') + '-' + String(today.getDate()).padStart(2, '0');
    if (format === 'mcp') {
      return JSON.stringify({ collection: '내 기록 묶음', date: ds, count: list.length, resources: list.map(s => ({
        uri: 'spacelog://star/' + s.id, name: s.title, planet: pName(s.planet), kind: s.kind, source: s.meta, addedAt: s.addedAt.slice(0, 10), memo: s.memo || null })) }, null, 2);
    }
    const groups = {};
    list.forEach(s => { (groups[s.planet] = groups[s.planet] || []).push(s); });
    let out = '## 내 기록 묶음 (' + ds + ', ' + list.length + '개)\n';
    Object.keys(groups).forEach(pid => {
      out += '\n### ' + pName(pid) + '\n';
      groups[pid].forEach(s => {
        const kindPart = s.kind === 'link' ? '링크: ' + s.meta : s.kind === 'text' ? '텍스트' : KIND[s.kind] + ' (' + s.meta + ', 원본은 내 PC 보관함)';
        out += '- ' + s.title + ' — ' + kindPart + (s.memo ? ' — 메모: ' + s.memo : '') + '\n';
      });
    });
    return out.trim();
  }
  const INBOX = 'spacelog_inbox_v1', LINKS = 'spacelog_links_v1', PKEY = 'spacelog_planets_v1', TKEY = 'spacelog_blackhole_v1', GAP = 320;
  function loadTrash() { try { return JSON.parse(localStorage.getItem(TKEY) || '[]'); } catch (e) { return []; } }
  function saveTrash(l) { try { localStorage.setItem(TKEY, JSON.stringify(l)); } catch (e) {} }
  // 행성끼리 겹치지 않게: (x, y)가 다른 행성과 GAP보다 가까우면 가장 가까운 빈자리를 찾습니다.
  function freeSpot(list, x, y, selfId) {
    const ok = (px, py) => list.every(p => p.id === selfId || Math.hypot(p.x - px, p.y - py) >= GAP);
    if (ok(x, y)) return { x, y };
    for (let r = 40; r < 4000; r += 40) for (let k = 0; k < 24; k++) { const a = k / 24 * Math.PI * 2, px = Math.round(x + Math.cos(a) * r), py = Math.round(y + Math.sin(a) * r); if (ok(px, py)) return { x: px, y: py }; }
    return { x, y };
  }
  // 행성 위치와 새로 만든 행성을 기억합니다.
  function loadPlanets() { let sp = {}; try { sp = JSON.parse(localStorage.getItem(PKEY) || '{}'); } catch (e) {} const list = planets.filter(p => !(sp.gone || []).includes(p.id)).map(p => sp.pos && sp.pos[p.id] ? { ...p, ...sp.pos[p.id] } : p).concat((sp.extra || []).filter(e => !planets.some(p => p.id === e.id)).map(e => { const ex = EXTRA.find(x => x.filter === e.filter); return ex ? { ...e, accent: ex.accent, base: ex.base } : e; }));
    const gone = sp.gone || [], held = loadTrash().map(x => x.id), lost = [...new Set(inbox().map(s => s.planet))].filter(id => id && !list.some(p => p.id === id) && !gone.includes(id) && !held.includes(id));
    lost.forEach((id, k) => { const c = list.length || 1, at = freeSpot(list, Math.round(list.reduce((a, p) => a + p.x, 0) / c), Math.round(list.reduce((a, p) => a + p.y, 0) / c)); list.push({ id, name: '복구된 행성' + (k ? ' ' + (k + 1) : ''), x: at.x, y: at.y, ...EXTRA[list.length % EXTRA.length] }); });
    if (lost.length) savePlanets(list);
    return list; }
  function savePlanets(list, goneId, backId) { const base = new Set(planets.map(p => p.id)), pos = {}; list.forEach(p => { pos[p.id] = { x: p.x, y: p.y, editedAt: p.editedAt || '', group: p.group || '', name: p.name, accent: p.accent, base: p.base, filter: p.filter, shape: p.shape || '' }; }); let gone = []; try { gone = (JSON.parse(localStorage.getItem(PKEY) || '{}').gone) || []; } catch (e) {} if (goneId && base.has(goneId) && !gone.includes(goneId)) gone.push(goneId); if (backId) gone = gone.filter(g => g !== backId);
    try { localStorage.setItem(PKEY, JSON.stringify({ pos, gone, extra: list.filter(p => !base.has(p.id)) })); } catch (e) {} }
  function loadLinks() { try { return JSON.parse(localStorage.getItem(LINKS) || '[]'); } catch (e) { return []; } }
  function saveLinks(l, stars) { let keep = []; if (stars) { const known = new Set(stars.map(s => s.id)); keep = loadLinks().filter(o => !l.some(x => x.id === o.id) && o.ids.every(i => !known.has(i))); } try { localStorage.setItem(LINKS, JSON.stringify(keep.concat(l))); } catch (e) {} }
  // 체험 가이드가 만든 별자리(지금 이름과 예전 이름 모두)는 체험이 끝나면 지웁니다.
  const TOUR_LINKS = [SEED_LINK.name, '체험 별자리'], isTourLink = x => !!x && TOUR_LINKS.includes(x.name);
  function clearTourLink() { try { const l = loadLinks(), k = l.filter(x => !isTourLink(x)); if (k.length !== l.length) localStorage.setItem(LINKS, JSON.stringify(k)); } catch (e) {} }
  function inbox() { try { return JSON.parse(localStorage.getItem(INBOX) || '[]'); } catch (e) { return []; } }
  function saveInbox(l) { try { localStorage.setItem(INBOX, JSON.stringify(l)); } catch (e) {} }
  function addInbox(items, planet) {
    const out = items.map((it, n) => ({ id: 'in' + Date.now() + '_' + n, planet, kind: it.kind, title: it.title, meta: it.meta, memo: it.memo || '', addedAt: new Date().toISOString(), ...(it.thumb ? { thumb: it.thumb } : {}), ...(it.csv ? { csv: it.csv } : {}), ...(it.body ? { body: it.body } : {}) }));
    saveInbox(inbox().concat(out)); return out.map(s => s.id);
  }
  function patchInbox(ids, patch) { saveInbox(inbox().map(s => ids.includes(s.id) ? { ...s, ...patch } : s)); }
  function removeInbox(ids) { saveInbox(inbox().filter(s => !ids.includes(s.id))); }
  function assign(kind) { return { image: 'p4', link: 'p2', text: 'p3', file: 'p1' }[kind] || 'p1'; }
  // CSV 글자를 열과 행으로 풉니다 (따옴표 안의 쉼표·줄바꿈 처리, 최대 12열 · 300행).
  function parseCsv(text) {
    const out = []; let row = [], cell = '', q = false; text = String(text || '').replace(/^\ufeff/, '');
    for (let i = 0; i < text.length; i++) { const ch = text[i];
      if (q) { if (ch === '"') { if (text[i + 1] === '"') { cell += '"'; i++; } else q = false; } else cell += ch; }
      else if (ch === '"') q = true;
      else if (ch === ',') { row.push(cell); cell = ''; }
      else if (ch === '\n' || ch === '\r') { if (ch === '\r' && text[i + 1] === '\n') i++; row.push(cell); cell = ''; if (row.some(v => v.trim() !== '')) out.push(row); row = []; }
      else cell += ch; }
    row.push(cell); if (row.some(v => v.trim() !== '')) out.push(row);
    if (out.length < 2) return null;
    const cols = out[0].slice(0, 12).map((c, i) => c.trim() || '열 ' + (i + 1));
    return { cols, rows: out.slice(1, 301).map(r => cols.map((_, i) => (r[i] || '').trim())) };
  }
  // 목록에 보여 줄 한 줄 설명: 텍스트 기록은 글자 수 대신 실제 내용의 앞부분을 씁니다.
  function descOf(x) { const b = x.kind === 'text' ? (x.body || x.memo || '') : ''; return b ? b.replace(/\s+/g, ' ').trim().slice(0, 90) : x.meta; }
  function fmtSize(b) { return b >= 1048576 ? (b / 1048576).toFixed(1) + 'MB' : Math.max(1, Math.round(b / 1024)) + 'KB'; }
  function fromText(t) {
    t = (t || '').trim(); if (!t) return [];
    if (/^https?:\/\/\S+$/.test(t)) { let h = t; try { h = new URL(t).hostname.replace(/^www\./, ''); } catch (e) {} return [{ kind: 'link', title: t.replace(/^https?:\/\/(www\.)?/, '').slice(0, 40), meta: h }]; }
    return [{ kind: 'text', title: t.split('\n')[0].slice(0, 28), meta: '텍스트 · ' + t.length + '자', body: t.slice(0, 20000) }];
  }
  function fromTransfer(dt) {
    if (!dt) return [];
    const c = dt.getData('application/x-spacelog');
    if (c) { try { return [JSON.parse(c)]; } catch (e) {} }
    if (dt.files && dt.files.length) return Array.from(dt.files).map(f => { const ext = (f.name.split('.').pop() || '').toUpperCase(); const img = /^image\//.test(f.type), isCsv = ext === 'CSV' || f.type === 'text/csv', it = { kind: img ? 'image' : 'file', title: f.name, meta: (ext || '파일') + ' · ' + fmtSize(f.size) }; if (img || isCsv) Object.defineProperty(it, '_file', { value: f, enumerable: false, writable: true }); if (isCsv) Object.defineProperty(it, '_csv', { value: true, enumerable: false }); return it; });
    return fromText(dt.getData('text/uri-list') || dt.getData('text/plain'));
  }
  // 이미지 파일은 미리보기용 축소본(긴 변 640px JPEG)을 만들어 기록에 붙입니다.
  function thumbs(items) {
    return Promise.all(items.map(it => it._file && it._csv ? it._file.text().then(tx => { const c = parseCsv(tx); if (c) { it.csv = c; it.meta = 'CSV · ' + c.rows.length + '행'; } it._file = null; return it; }, () => { it._file = null; return it; }) : !it._file ? it : new Promise(res => {
      const f = it._file, url = URL.createObjectURL(f), im = new Image(), done = t => { URL.revokeObjectURL(url); it._file = null; if (t) it.thumb = t; res(it); };
      im.onload = () => { try { const k = Math.min(1, 640 / Math.max(im.naturalWidth, im.naturalHeight)), c = document.createElement('canvas'); c.width = Math.max(1, Math.round(im.naturalWidth * k)); c.height = Math.max(1, Math.round(im.naturalHeight * k)); const g = c.getContext('2d'); g.fillStyle = '#fff'; g.fillRect(0, 0, c.width, c.height); g.drawImage(im, 0, 0, c.width, c.height); done(c.toDataURL('image/jpeg', 0.72)); } catch (e) { done(null); } };
      im.onerror = () => done(null); im.src = url;
    })));
  }
  function combo(e) {
    const k = e.key; if (['Control', 'Shift', 'Alt', 'Meta'].includes(k)) return '';
    return (e.ctrlKey ? 'Ctrl+' : '') + (e.metaKey ? '⌘+' : '') + (e.altKey ? 'Alt+' : '') + (e.shiftKey ? 'Shift+' : '') + (k.length === 1 ? k.toUpperCase() : k);
  }
  window.SPACELOG = { SEED_N, OVER_N, STAR_CAP, SEED_DAYS, seeded, IMG, planets, stars, KIND, ICON, iconUrl, PERIODS, range, inPeriod, fmtDate, relDate, rediscovery, clone, reduce, buildExport,
    addInbox, patchInbox, removeInbox, thumbs, parseCsv, descOf, clearTourLink, isTourLink, TOUR_SEED: SEED_LINK,
    LOOKS: [['파랑', 0], ['주황', 1], ['보라', 2], ['분홍', 3], ['초록', 4]].map(([label, i]) => ({ label, accent: planets[i].accent, base: planets[i].base, filter: planets[i].filter })).concat([{ label: '빨강', ...EXTRA[0] }, { label: '하늘', ...EXTRA[1] }]), assign, fromText, fromTransfer, combo,
    initial: () => { const pl = loadPlanets(), db = clone({ planets: pl, stars: stars.concat(inbox()).filter(s => pl.some(p => p.id === s.planet)) }), ok = new Set(db.stars.map(s => s.id));
      db.links = loadLinks().map(l => ({ ...l, ids: l.ids.filter(i => ok.has(i)) })).filter(l => l.ids.length > 0);
      // 체험 중(6단계 이후)이 아니면 남아 있는 체험 별자리를 지웁니다.
      let step = 0; try { step = parseInt(String(localStorage.getItem('spacelog_tour_v1') || '').replace(/[^0-9]/g, ''), 10) || 0; } catch (e) {}
      if (!/(^|[#&])tour(&|=|$)/.test(location.hash)) step = 0; // 새로 열면 체험이 1단계부터 다시 시작합니다.
      if (step < 6 && db.links.some(isTourLink)) { clearTourLink(); db.links = db.links.filter(l => !isTourLink(l)); }
      let seedOff = false; try { seedOff = !!localStorage.getItem(SEED_LINK_OFF); } catch (e) {}
      if (false && !seedOff && !db.links.some(l => l.id === SEED_LINK.id || l.name === SEED_LINK.name)) { const ids = SEED_LINK.titles.map(t => (db.stars.find(s => s.title === t) || {}).id).filter(Boolean);
        if (ids.length) db.links.unshift({ id: SEED_LINK.id, name: SEED_LINK.name, memo: SEED_LINK.memo, viz: { mode: 'dash', chart: 'bar' }, ids, createdAt: new Date().toISOString() }); } db.trash = loadTrash().filter(t => !db.planets.some(p => p.id === t.id)); return db; } };
})();
