// 시연용 데이터의 상태 저장소. 서버와 무관하게 웹 안에서만 산다 (README 4-1). 바뀔 때마다 브라우저에 저장한다.
// 화면은 useDemo(selector) 로, 화면 밖 코드는 demo.getState() 로 쓴다 (store.ts 와 같은 방식).
import { createStore, useStore } from "zustand";
import {
  addLinkStars, createLink, editLink, removeStarsFromLinks, setLinkStars, setLinkViz, unlink,
  type NewLink,
} from "./links.ts";
import { forgetPlanet, purgePlanet, restorePlanet, setPlanetOverride, trashPlanet } from "./planets.ts";
import { loadDemo, saveDemo, type KeyValue } from "./storage.ts";
import type { DemoData, LinkViz, PlanetOverride, TrashedPlanet } from "./types.ts";

export interface DemoStore extends DemoData {
  // 별자리
  addLink(input: Omit<NewLink, "id"> & { id?: string }): string | null;
  editLink(id: string, patch: { name?: string; memo?: string }): void;
  setLinkStars(id: string, starIds: string[]): void;
  addLinkStars(id: string, starIds: string[]): void;
  setLinkViz(id: string, viz: LinkViz): void;
  removeLink(id: string): void;
  /** 지워진 기록을 별자리에서 뺀다 (기록 삭제 · 행성 삭제 뒤에 부른다) */
  starsGone(ids: string[]): void;
  toggleLinkShown(id: string): void;
  // 행성 모습·위치
  setPlanet(id: string, patch: PlanetOverride): void;
  forgetPlanet(id: string): void;
  // 블랙홀
  sendToBlackHole(item: Omit<TrashedPlanet, "trashedAtUtc">): void;
  restoreFromBlackHole(planetId: string): TrashedPlanet | null;
  purgeFromBlackHole(planetId: string): void;
}

let seq = 0;
const newId = () => `link-${Date.now().toString(36)}-${(seq++).toString(36)}`;

export function createDemoStore(kv?: KeyValue | null) {
  const initial = loadDemo(kv);
  const store = createStore<DemoStore>()((set, get) => {
    const patch = (fn: (d: DemoData) => DemoData) => {
      const d = fn({ links: get().links, hiddenLinkIds: get().hiddenLinkIds, planets: get().planets, trash: get().trash });
      set(d);
    };
    return {
      ...initial,
      addLink(input) {
        const id = input.id ?? newId();
        const before = get().links;
        const after = createLink(before, { ...input, id });
        if (after === before) return null; // 기록이 없어 만들지 않았다
        set({ links: after });
        return id;
      },
      editLink: (id, p) => set({ links: editLink(get().links, id, p) }),
      setLinkStars: (id, starIds) => set({ links: setLinkStars(get().links, id, starIds) }),
      addLinkStars: (id, starIds) => set({ links: addLinkStars(get().links, id, starIds) }),
      setLinkViz: (id, viz) => set({ links: setLinkViz(get().links, id, viz) }),
      removeLink: (id) => set({ links: unlink(get().links, id), hiddenLinkIds: get().hiddenLinkIds.filter((x) => x !== id) }),
      starsGone(ids) {
        const links = removeStarsFromLinks(get().links, ids);
        const alive = new Set(links.map((l) => l.id));
        set({ links, hiddenLinkIds: get().hiddenLinkIds.filter((x) => alive.has(x)) });
      },
      toggleLinkShown(id) {
        const hidden = get().hiddenLinkIds;
        set({ hiddenLinkIds: hidden.includes(id) ? hidden.filter((x) => x !== id) : [...hidden, id] });
      },
      setPlanet: (id, p) => patch((d) => setPlanetOverride(d, id, p)),
      forgetPlanet: (id) => patch((d) => forgetPlanet(d, id)),
      sendToBlackHole: (item) => patch((d) => trashPlanet(d, item)),
      restoreFromBlackHole(planetId) {
        const r = restorePlanet({ links: get().links, hiddenLinkIds: get().hiddenLinkIds, planets: get().planets, trash: get().trash }, planetId);
        set(r.data);
        return r.item;
      },
      purgeFromBlackHole: (planetId) => patch((d) => purgePlanet(d, planetId)),
    };
  });
  // 데이터가 바뀔 때만 저장한다 (함수는 저장 대상이 아니다)
  store.subscribe((s, prev) => {
    if (s.links !== prev.links || s.hiddenLinkIds !== prev.hiddenLinkIds || s.planets !== prev.planets || s.trash !== prev.trash) {
      saveDemo({ links: s.links, hiddenLinkIds: s.hiddenLinkIds, planets: s.planets, trash: s.trash }, kv);
    }
  });
  return store;
}

export const demo = createDemoStore();

export function useDemo<T>(selector: (s: DemoStore) => T): T {
  return useStore(demo, selector);
}
