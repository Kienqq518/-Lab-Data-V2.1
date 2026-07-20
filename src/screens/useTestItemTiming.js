import React from 'react';
import { MOCK } from '../mock.js';
import { nowISO } from './collect-model.js';

/**
 * L4 试验项级开始/结束时间（三种 L4 页共用）
 * @param {object} ctx - collect context
 * @param {{ uploadedCount: number, allUploaded: boolean, flowLocked: boolean, isAutoDirect?: boolean }} options
 */
export function useTestItemTiming(ctx, { uploadedCount, allUploaded, flowLocked, isAutoDirect = false }) {
  const [timing, setTiming] = React.useState(() => MOCK.resolveTestItemTiming(ctx));
  const [recording, setRecording] = React.useState(false);
  const [confirmOverwrite, setConfirmOverwrite] = React.useState(false);
  const [toast, setToast] = React.useState(null);
  const endRecordedRef = React.useRef(!!MOCK.resolveTestItemTiming(ctx).endedAt);

  const canRecordStart = !flowLocked && uploadedCount === 0 && !isAutoDirect;
  const requireStartBeforeCollect = !isAutoDirect && !timing.startedAt && !flowLocked;

  React.useEffect(() => {
    if (!toast) return undefined;
    const timer = setTimeout(() => setToast(null), 2600);
    return () => clearTimeout(timer);
  }, [toast]);

  React.useEffect(() => {
    if (!isAutoDirect || timing.startedAt) return undefined;
    let cancelled = false;
    MOCK.fetchAutoTestStartTime(ctx).then((startedAt) => {
      if (!cancelled && startedAt) {
        setTiming((prev) => ({ ...prev, startedAt, startedBy: 'host' }));
      }
    });
    return () => { cancelled = true; };
  }, [isAutoDirect, timing.startedAt, ctx]);

  React.useEffect(() => {
    if (!allUploaded || !timing.startedAt || timing.endedAt || endRecordedRef.current) return;
    endRecordedRef.current = true;
    const endedAt = nowISO();
    setTiming((prev) => ({ ...prev, endedAt }));
    MOCK.recordTestTimingEnd(ctx, endedAt);
  }, [allUploaded, timing.startedAt, timing.endedAt, ctx]);

  function guardStartForUpload() {
    if (requireStartBeforeCollect) {
      setToast('请先记录试验开始时间后再上传数据');
      return false;
    }
    return true;
  }

  function guardStartForOcr() {
    if (requireStartBeforeCollect) {
      setToast('请先记录试验开始时间');
      return false;
    }
    return true;
  }

  function guardStartForManual() {
    if (requireStartBeforeCollect) {
      setToast('请先记录试验开始时间');
      return false;
    }
    return true;
  }

  function handleRecordStartClick() {
    if (!canRecordStart || recording) return;
    if (timing.startedAt) setConfirmOverwrite(true);
    else recordStart();
  }

  function recordStart() {
    if (!canRecordStart) return;
    setRecording(true);
    setConfirmOverwrite(false);
    MOCK.recordTestTimingStart(ctx, { overwrite: !!timing.startedAt })
      .then((next) => setTiming(next))
      .finally(() => setRecording(false));
  }

  function clearEndedOnReset() {
    endRecordedRef.current = false;
    setTiming((prev) => (prev.endedAt ? { ...prev, endedAt: undefined } : prev));
    MOCK.clearTestTimingEnd(ctx);
  }

  function syncAutoStartFromHost(startedAt) {
    if (!isAutoDirect || !startedAt) return;
    setTiming((prev) => (prev.startedAt ? prev : { ...prev, startedAt, startedBy: 'host' }));
  }

  return {
    timing,
    recording,
    confirmOverwrite,
    toast,
    canRecordStart,
    requireStartBeforeCollect,
    isAutoDirect,
    handleRecordStartClick,
    recordStart,
    cancelOverwrite: () => setConfirmOverwrite(false),
    guardStartForUpload,
    guardStartForOcr,
    guardStartForManual,
    clearEndedOnReset,
    syncAutoStartFromHost,
  };
}
