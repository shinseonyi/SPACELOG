import { useCallback, useState } from "react";
import { isNotSupported, NOT_SUPPORTED_MESSAGE, RequestError } from "../api/client.ts";
import { store } from "../state/store.ts";

/**
 * 저장·삭제 같은 쓰기 호출을 감싼다. 진행 중 표시, 실패 안내를 한곳에서 맡는다 (SPEC 3-4).
 * 서버가 아직 그 API를 만들지 않았으면(404) 그렇다고 알려 준다. 성공하면 true.
 */
export function useSave() {
  const [busy, setBusy] = useState(false);
  const run = useCallback(async (job: () => Promise<unknown>, okMessage?: string): Promise<boolean> => {
    setBusy(true);
    try {
      await job();
      if (okMessage) store.getState().showToast(okMessage, "success");
      return true;
    } catch (e) {
      if (!(e instanceof RequestError)) throw e;
      store.getState().showToast(isNotSupported(e) ? NOT_SUPPORTED_MESSAGE : e.message, "error");
      return false;
    } finally {
      setBusy(false);
    }
  }, []);
  return { busy, run };
}
