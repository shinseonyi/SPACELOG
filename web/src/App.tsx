import { useEffect } from "react";
import { AddRecord } from "./add/AddRecord.tsx";
import { ERROR_MESSAGES } from "@spacelog/shared/errors";
import { chat } from "./chat/chatStore.ts";
import { closeChat } from "./chat/controller.ts";
import { CosmicDust } from "./chat/CosmicDust.tsx";
import { ActionBar } from "./home/ActionBar.tsx";
import { Blackhole } from "./home/Blackhole.tsx";
import { ControlsHint } from "./home/ControlsHint.tsx";
import { EmptyState } from "./home/EmptyState.tsx";
import { HomeBanner } from "./home/HomeBanner.tsx";
import { NearPrompt } from "./home/NearPrompt.tsx";
import { LeftStack } from "./home/LeftStack.tsx";
import { SideWindow } from "./home/SideWindow.tsx";
import { TopBar } from "./home/TopBar.tsx";
import "./home/home.css";
import { PanelHost } from "./panel/PanelHost.tsx";
import { store, useStore } from "./state/store.ts";
import { ToastHost } from "./ui/Toast.tsx";
import { PerfMeter } from "./universe/PerfMeter.tsx";
import { UniverseCanvas } from "./universe/UniverseCanvas.tsx";
import { Depth25 } from "./view/Depth25.tsx";
import { Flat2D } from "./view/Flat2D.tsx";
import { Observatory } from "./observatory/Observatory.tsx";
import { ProbeModal } from "./probe/ProbeModal.tsx";

/**
 * 웹 껍데기. 화면 자리만 잡는다.
 * - 우주 홈: 개발 C, 이슈 #3. 재발견 카드 데이터·이벤트는 개발 A(#7)의 useRediscoveryCard()
 * - 행성 패널·기록 상세: 개발 B, 이슈 #5 → panel/ (2.5D 디자인 4단계)
 * - 탐사선: 개발 A, 이슈 #8
 */
export function App() {
  const auth = useStore((s) => s.auth);
  useEscape();

  if (auth === "required") return <AuthRequired />;
  return (
    <div className="app">
      <UniverseView />
      <TopBar />
      <ControlsHint />
      <SideWindow />
      <EmptyState />
      <NearPrompt />
      <LeftStack />
      <HomeBanner />
      <PerfMeter />
      <PanelHost />
      <ActionBar />
      <AddRecord />
      <Blackhole />
      <Observatory />
      <CosmicDust />
      <ProbeModal />
      <ToastHost />
    </div>
  );
}

/** 켜진 보기 하나만 그린다. 보기를 바꾸면 이전 보기는 내려가며 자기 비행 등록을 푼다 */
function UniverseView() {
  const view = useStore((s) => s.view);
  if (view === "3d") return <UniverseCanvas />;
  if (view === "2.5d") return <Depth25 />;
  return <Flat2D />;
}

function AuthRequired() {
  return (
    <div className="auth-required">
      <div className="card" role="alert">
        <h1>{ERROR_MESSAGES.UNAUTHORIZED}</h1>
        <p>이 창은 보안을 위해 수집 앱에서 열어야 볼 수 있어요.</p>
      </div>
    </div>
  );
}

/** Esc: 우주먼지 대화창 → 탐사선·관측소 → 상세 → 패널 → 조망 (SPEC 3-5, handoff 6-5). 입력 중이거나 대화상자가 열려 있으면 무시 */
function useEscape() {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape" || e.defaultPrevented) return;
      if (e.target instanceof Element && e.target.closest("input, textarea, select, [contenteditable='true']")) return;
      if (document.querySelector("dialog[open]")) return; // 대화상자는 스스로 닫힌다
      // 대화창이 보이는 동안은 그것만 닫는다. 관측소 뒤에 숨어 있을 때는 관측소가 먼저
      if (chat.getState().open && store.getState().route.name !== "observatory") return closeChat();
      store.getState().goBack();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
}
