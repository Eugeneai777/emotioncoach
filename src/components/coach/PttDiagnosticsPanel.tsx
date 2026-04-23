import { CheckCircle2, Circle, AlertTriangle } from 'lucide-react';
import type { PttDiagnostics } from '@/utils/MiniProgramAudio';

interface Props {
  diag: PttDiagnostics | null;
}

type RowState = 'ok' | 'pending' | 'fail';

function Row({ state, label, hint }: { state: RowState; label: string; hint?: string }) {
  const Icon = state === 'ok' ? CheckCircle2 : state === 'fail' ? AlertTriangle : Circle;
  const color =
    state === 'ok' ? 'text-emerald-400' : state === 'fail' ? 'text-red-400' : 'text-white/40';
  return (
    <div className="flex items-start gap-2 text-[12px] leading-snug">
      <Icon className={`w-3.5 h-3.5 mt-0.5 shrink-0 ${color}`} />
      <div className="flex-1">
        <div className={state === 'fail' ? 'text-red-300' : 'text-white/85'}>{label}</div>
        {hint && <div className="text-[11px] text-white/50">{hint}</div>}
      </div>
    </div>
  );
}

export function PttDiagnosticsPanel({ diag }: Props) {
  if (!diag) {
    return (
      <div className="mx-4 mb-2 rounded-xl bg-black/40 border border-white/10 px-3 py-2 text-[12px] text-white/60">
        诊断面板等待数据…
      </div>
    );
  }

  // 1. 通道
  const channel: RowState = diag.wsOpen ? 'ok' : 'pending';

  // 2. 服务端 PTT 已生效
  const serverPtt: RowState = diag.pttConfigApplied
    ? diag.serverTurnDetectionNull
      ? 'ok'
      : 'fail'
    : 'pending';

  // 3. 麦克风采到声音
  let mic: RowState = 'pending';
  let micHint: string | undefined;
  if (diag.isPressing) {
    mic = diag.micEnergyDetected ? 'ok' : 'pending';
  } else if (diag.outboundChunks > 0 || diag.micEnergyDetected) {
    mic = 'ok';
  } else if (diag.lastError === 'mic_silent') {
    mic = 'fail';
    micHint = '按住了，但没采到声音';
  }

  // 4. 声音已发送
  let sent: RowState = diag.outboundChunks > 0 ? 'ok' : 'pending';
  if (!diag.isPressing && diag.lastCommitAt && diag.outboundChunks === 0) {
    sent = 'fail';
  }

  // 5. 已收到回复
  const replied: RowState = diag.firstAiReplyAt || diag.firstUserTranscriptAt ? 'ok' : 'pending';

  return (
    <div className="mx-4 mb-2 rounded-xl bg-black/45 border border-white/10 px-3 py-2.5 space-y-1.5 backdrop-blur">
      <div className="text-[11px] text-white/50 mb-1 flex items-center justify-between">
        <span>PTT 健康状态（仅小程序调试）</span>
        <span className="font-mono">
          {diag.recorderSource === 'web_audio'
            ? 'WebAudio'
            : diag.recorderSource === 'wx_recorder'
            ? 'wx录音'
            : '—'}{' '}
          · 帧 {diag.outboundChunks}
        </span>
      </div>
      <Row state={channel} label="通道已连接" />
      <Row
        state={serverPtt}
        label="服务端 PTT 已生效"
        hint={
          diag.pttConfigApplied && !diag.serverTurnDetectionNull
            ? '服务端仍在自动监听模式（turn_detection 未关闭）'
            : undefined
        }
      />
      <Row state={mic} label="麦克风已采到声音" hint={micHint} />
      <Row state={sent} label={`声音已发送（${diag.outboundChunks} 帧）`} />
      <Row state={replied} label="已收到回复" />
      {diag.lastError && (
        <div className="text-[11px] text-red-300/90 pt-1 border-t border-white/10">
          最近错误：{diag.lastError}
        </div>
      )}
    </div>
  );
}
