// 체험 가이드: 수집 앱(c)과 웹 우주(w) 두 프로토타입이 같은 단계 번호를 localStorage로 이어 씁니다.
window.SPACELOG_TOUR = {
  KEY: 'spacelog_tour_v1',
  steps: [
    { page: 'c', title: '예시 카드를 수집 앱에 끌어다 놓으세요', desc: '왼쪽 예시 카드 하나를 오른쪽 수집 앱 창으로 끌어다 놓으면 기록이 저장됩니다.', cta: '대신 놓아 보기' },
    { page: 'c', title: '저장됐어요. 기록이 하나 생겼습니다', desc: '확인 화면에서 행성을 바꾸거나 메모를 남길 수 있어요. 이제 웹 우주에서 방금 넣은 기록을 확인합니다.', cta: '웹 우주로 이동' },
    { page: 'w', title: '행성을 눌러 착륙하세요', desc: '여기가 웹 우주예요. 수집한 기록은 행성 둘레에 떠 있습니다. 행성 하나를 누르면 그 행성으로 내려갑니다.', cta: '대신 착륙하기' },
    { page: 'w', title: '목록에서 기록 하나를 누르세요', desc: '행성 패널이에요. 이 행성에 모인 기록이 목록으로 보입니다.', cta: '대신 열어 보기' },
    { page: 'w', title: 'Esc로 목록에 돌아가세요', desc: '기록 상세예요. 메모를 남기거나 다른 행성으로 옮길 수 있습니다. Esc를 누르면 한 단계씩 돌아갑니다.', cta: '목록으로 돌아가기' },
    { page: 'w', title: '기록을 체크하고 별자리를 만들어 보세요', desc: '별자리는 기록에 관측 목적을 붙이는 기능이에요. 기록을 체크하고 "별자리 만들기"를 누른 뒤, 무엇을 보고 싶은지와 어떻게 볼지를 정합니다.', cta: '대신 만들어 보기' },
    { page: 'w', title: '별자리를 관측소에서 열어 보세요', desc: '별자리는 만들면 관측소에 바로 저장돼 언제든 다시 볼 수 있어요. 목록 맨 위 별자리를 펼치고 "관측소에서 보기"를 누르세요.', cta: '대신 열어 보기 ' },
    { page: 'w', title: '보기 방식 4가지를 차례로 눌러 보세요', desc: '관측소예요. 파란 테두리가 있는 보기 방식을 차례로 눌러 보세요.', cta: '대신 눌러 보기' },
    { page: 'w', title: '다음으로 재발견 알림을 확인합니다', desc: '수집 앱은 7일 전에 넣은 기록을 하루 한 번 다시 알려 줍니다. 수집 앱으로 돌아가서 확인해요.', cta: '수집 앱으로 이동' },
    { page: 'c', title: '재발견 알림을 눌러 보세요', desc: '수집 앱 창 아래 "우주 보기" 옆의 "재발견 알림 보기"를 누르면 오른쪽 위에 알림이 뜹니다. 그 알림을 누르면 웹 우주에서 그 기록이 있는 행성으로 이동한 뒤 기록 상세가 열립니다.', cta: '대신 눌러 보기' },
    { page: 'w', title: '재발견한 기록이 열렸어요', desc: '알림에서 7일 전 기록이 있는 행성으로 내려와 기록 상세가 열렸습니다. 지난 기록은 관측소에서도 모아 볼 수 있어요.', cta: '관측소에서 모아 보기' },
    { page: 'w', title: '체험이 끝났어요', desc: '관측소의 재발견 혜성 관측이에요. 넣은 지 7일이 넘은 기록이 모여 있습니다. 수집부터 별자리, 관측소, 재발견까지 한 바퀴를 돌았어요.', cta: '처음부터 다시' }
  ],
  get() { try { const v = localStorage.getItem(this.KEY); return v === null ? null : (v === 'off' ? 0 : (+v || 0)); } catch (e) { return null; } },
  set(n) { try { localStorage.setItem(this.KEY, n ? String(n) : 'off'); } catch (e) {} },
  // 다른 화면에서 넘어온 경우(#tour)에만 이어 가고, 새로 열면 1단계부터 시작합니다.
  handoff() { return /(^|[#&])tour(&|=|$)/.test(location.hash); },
  boot() { const v = this.get(); if (v === null) { this.set(1); return 1; } if (!v) return 0; if (this.handoff()) return v; this.set(1); return 1; },
  url(u) { return u + (u.indexOf('#') < 0 ? '#' : '&') + 'tour'; },
  view(n, page) {
    const st = this.steps[n - 1]; if (!st) return { on: false, h: 0 };
    const here = st.page === page;
    return { on: true, h: 76, no: n + ' / ' + this.steps.length, pct: (n / this.steps.length * 100) + '%', here,
      title: here ? st.title : (st.page === 'w' ? '이 단계는 웹 우주에서 이어집니다' : '이 단계는 수집 앱에서 이어집니다'),
      desc: here ? st.desc : st.title + '.',
      cta: here ? st.cta : (st.page === 'w' ? '웹 우주로 이동' : '수집 앱으로 이동'),
      skip: n === this.steps.length ? '닫기' : '체험 끝내기' };
  }
};
