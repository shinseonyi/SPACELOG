// 체험 가이드: 수집 앱 프로토타입(c) 위에서 진행합니다. 웹 우주는 실제 제품(web/, 예시 데이터)을 새 탭에 열어 직접 써 봅니다.
window.SPACELOG_TOUR = {
  KEY: 'spacelog_tour_v2',
  steps: [
    { page: 'c', title: '예시 카드를 수집 앱에 끌어다 놓으세요', desc: '왼쪽 예시 카드 하나를 오른쪽 수집 앱 창으로 끌어다 놓으면 기록이 저장됩니다. 실제 앱에서는 파일·글·링크를 끌어다 놓거나 단축키로 클립보드를 넣습니다.', cta: '대신 놓아 보기' },
    { page: 'c', title: '저장됐어요. 기록이 하나 생겼습니다', desc: '확인 화면에서 행성을 바꾸거나 메모를 남길 수 있어요. 이제 웹 우주를 열어 봅니다. 새 탭에 실제 웹 우주가 예시 기록으로 열립니다.', cta: '웹 우주 열기' },
    { page: 'c', title: '웹 우주를 둘러보세요', desc: '새 탭의 웹 우주에서 행성을 눌러 보고, 2D · 2.5D · 3D 를 바꿔 보세요. 길을 모르겠으면 오른쪽 아래 우주먼지에게 물어보면 그 자리로 안내해요. 별자리 · 관측소 · 블랙홀도 거기서 직접 써 볼 수 있어요.', cta: '다음: 재발견 알림' },
    { page: 'c', title: '재발견 알림을 눌러 보세요', desc: '수집 앱은 7일 전에 넣은 기록을 하루 한 번 다시 알려 줍니다. "우주 보기" 옆의 "재발견 알림 보기"를 누르면 오른쪽 위에 알림이 뜹니다. 알림을 누르면 웹 우주가 그 기록이 있는 행성으로 날아가 기록 상세를 엽니다.', cta: '대신 눌러 보기' },
    { page: 'c', title: '체험이 끝났어요', desc: '넣은 지 7일이 넘은 기록은 웹 우주의 관측소 "재발견 혜성"에도 모입니다. 수집부터 웹 우주, 재발견까지 한 바퀴를 돌았어요. 마음에 들면 PC앱을 받아 내 기록으로 시작해 보세요.', cta: '처음부터 다시' }
  ],
  get() { try { const v = localStorage.getItem(this.KEY); return v === null ? null : (v === 'off' ? 0 : (+v || 0)); } catch (e) { return null; } },
  set(n) { try { localStorage.setItem(this.KEY, n ? String(n) : 'off'); } catch (e) {} },
  // 같은 화면을 #tour 로 다시 열면 이어 가고, 새로 열면 1단계부터 시작합니다.
  handoff() { return /(^|[#&])tour(&|=|$)/.test(location.hash); },
  boot() { const v = this.get(); if (v === null) { this.set(1); return 1; } if (!v) return 0; if (this.handoff()) return v; this.set(1); return 1; },
  url(u) { return u + (u.indexOf('#') < 0 ? '#' : '&') + 'tour'; },
  view(n, page) {
    const st = this.steps[n - 1]; if (!st) return { on: false, h: 0 };
    const here = st.page === page;
    return { on: true, h: 76, no: n + ' / ' + this.steps.length, pct: (n / this.steps.length * 100) + '%', here,
      title: st.title, desc: st.desc, cta: st.cta,
      skip: n === this.steps.length ? '닫기' : '체험 끝내기' };
  }
};
