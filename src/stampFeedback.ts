// スタンプを押した瞬間の体感フィードバック(ハプティクス + ポンという効果音)
// どちらも対応していない環境では黙って何もしない
export function playStampFeedback() {
  try {
    navigator.vibrate?.(60);
  } catch {
    // vibrate が使えない環境は無視
  }

  try {
    const ctx = new AudioContext();
    const t = ctx.currentTime;

    // 低い正弦波を短く落として、スタンプ台に「ポン」と当たる音を合成する
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(190, t);
    osc.frequency.exponentialRampToValueAtTime(50, t + 0.12);
    gain.gain.setValueAtTime(0.25, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
    osc.connect(gain).connect(ctx.destination);
    osc.start(t);
    osc.stop(t + 0.2);
    osc.onended = () => {
      ctx.close().catch(() => {});
    };
  } catch {
    // 音が出せない環境は無視
  }
}
