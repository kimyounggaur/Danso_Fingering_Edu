export const DANSO_SYNTH_VERSION = '2.0.0';

/**
 * 단소의 관 공명, 취구 잡음, 배음 변화를 절차적으로 합성한다.
 * 이 함수는 build_app.mjs에서 문자열로 직렬화되어 오프라인 HTML에 포함되므로
 * 함수 바깥의 값에 의존하지 않아야 한다.
 */
export function createDansoSynth(context) {
  const VERSION = '2.0.0';
  const ctx = context;
  const voices = new Set();
  let activeVoice = null;
  let enabled = true;
  let randomState = 0x6d2b79f5;

  function random() {
    randomState ^= randomState << 13;
    randomState ^= randomState >>> 17;
    randomState ^= randomState << 5;
    return (randomState >>> 0) / 4294967296;
  }

  function setValue(param, value) {
    if (param) param.value = value;
  }

  function makeNoiseBuffer(seconds) {
    const length = Math.max(1, Math.floor(ctx.sampleRate * seconds));
    const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    let pink = 0;
    for (let index = 0; index < length; index += 1) {
      const white = random() * 2 - 1;
      pink = pink * 0.965 + white * 0.035;
      data[index] = white * 0.68 + pink * 1.4;
    }
    return buffer;
  }

  function makeRoomImpulse() {
    const duration = 0.62;
    const length = Math.max(1, Math.floor(ctx.sampleRate * duration));
    const impulse = ctx.createBuffer(2, length, ctx.sampleRate);
    const earlyReflections = [
      [0.017, 0.42],
      [0.031, -0.3],
      [0.047, 0.22],
      [0.071, -0.14],
    ];

    for (let channel = 0; channel < 2; channel += 1) {
      const data = impulse.getChannelData(channel);
      for (let index = 0; index < length; index += 1) {
        const progress = index / length;
        const fadeIn = Math.min(1, index / Math.max(1, ctx.sampleRate * 0.008));
        const decay = Math.pow(1 - progress, 3.4);
        data[index] = (random() * 2 - 1) * decay * fadeIn * 0.34;
      }
      for (const reflection of earlyReflections) {
        const spread = channel === 0 ? 0 : 0.0017;
        const sample = Math.floor((reflection[0] + spread) * ctx.sampleRate);
        if (sample < length) data[sample] += reflection[1] * (channel === 0 ? 1 : 0.88);
      }
    }
    return impulse;
  }

  function makeSaturationCurve() {
    const length = 1024;
    const curve = new Float32Array(length);
    const drive = 1.18;
    const normalizer = Math.tanh(drive);
    for (let index = 0; index < length; index += 1) {
      const input = (index / (length - 1)) * 2 - 1;
      curve[index] = Math.tanh(input * drive) / normalizer;
    }
    return curve;
  }

  const noiseBuffer = makeNoiseBuffer(2.4);
  const saturationCurve = makeSaturationCurve();

  const input = ctx.createGain();
  const rumbleCut = ctx.createBiquadFilter();
  const airCeiling = ctx.createBiquadFilter();
  const dryGain = ctx.createGain();
  const preDelay = ctx.createDelay(0.08);
  const room = ctx.createConvolver();
  const roomGain = ctx.createGain();
  const compressor = ctx.createDynamicsCompressor();
  const master = ctx.createGain();

  rumbleCut.type = 'highpass';
  setValue(rumbleCut.frequency, 115);
  setValue(rumbleCut.Q, 0.62);
  airCeiling.type = 'lowpass';
  setValue(airCeiling.frequency, 9600);
  setValue(airCeiling.Q, 0.48);
  setValue(dryGain.gain, 0.92);
  setValue(preDelay.delayTime, 0.018);
  room.buffer = makeRoomImpulse();
  setValue(roomGain.gain, 0.085);
  setValue(compressor.threshold, -20);
  setValue(compressor.knee, 14);
  setValue(compressor.ratio, 3.2);
  setValue(compressor.attack, 0.006);
  setValue(compressor.release, 0.18);
  setValue(master.gain, 0.7);

  input.connect(rumbleCut);
  rumbleCut.connect(airCeiling);
  airCeiling.connect(dryGain);
  dryGain.connect(compressor);
  airCeiling.connect(preDelay);
  preDelay.connect(room);
  room.connect(roomGain);
  roomGain.connect(compressor);
  compressor.connect(master);
  master.connect(ctx.destination);

  function makePeriodicWave(note, spec) {
    const lowRegister = [0, 1, 0.31, 0.135, 0.072, 0.042, 0.026, 0.017, 0.011, 0.007, 0.0045, 0.003];
    const highRegister = [0, 1, 0.44, 0.235, 0.14, 0.088, 0.058, 0.04, 0.028, 0.019, 0.013, 0.009];
    const profile = note.id >= 8 ? highRegister : lowRegister;
    const real = new Float32Array(profile.length);
    const imaginary = new Float32Array(profile.length);
    const pressure = Math.max(0.72, Math.min(1.22, spec.brightness || 1));
    const phasePattern = [0, 0, 0.19, -0.27, 0.34, -0.41, 0.22, -0.16, 0.37, -0.31, 0.14, -0.24];
    const nyquistGuard = ctx.sampleRate * 0.44;

    for (let harmonic = 1; harmonic < profile.length; harmonic += 1) {
      if (note.freq * harmonic >= nyquistGuard) continue;
      const tilt = Math.pow(pressure, Math.min(3.2, (harmonic - 1) * 0.34));
      const amplitude = profile[harmonic] * tilt;
      const phase = phasePattern[harmonic];
      real[harmonic] = amplitude * Math.sin(phase);
      imaginary[harmonic] = amplitude * Math.cos(phase);
    }
    try {
      return ctx.createPeriodicWave(real, imaginary, { disableNormalization: false });
    } catch {
      return ctx.createPeriodicWave(real, imaginary);
    }
  }

  function connectWithPan(node, panValue) {
    if (typeof ctx.createStereoPanner !== 'function') {
      node.connect(input);
      return null;
    }
    const panner = ctx.createStereoPanner();
    setValue(panner.pan, panValue);
    node.connect(panner);
    panner.connect(input);
    return panner;
  }

  function envelopeValue(time, envelope) {
    if (time <= envelope.start) return 0.0001;
    const attackEnd = envelope.start + envelope.attack;
    const settleEnd = attackEnd + envelope.settle;
    if (time < attackEnd) {
      const progress = (time - envelope.start) / envelope.attack;
      return 0.0001 + (envelope.peak - 0.0001) * progress;
    }
    if (time < settleEnd) {
      const progress = (time - attackEnd) / envelope.settle;
      return envelope.peak + (envelope.sustain - envelope.peak) * progress;
    }
    return envelope.sustain;
  }

  function holdAt(param, time, fallbackValue) {
    if (typeof param.cancelAndHoldAtTime === 'function') {
      param.cancelAndHoldAtTime(time);
      return;
    }
    param.cancelScheduledValues(time);
    param.setValueAtTime(Math.max(0.0001, fallbackValue), time);
  }

  function releaseParam(param, releaseAt, end, fallbackValue) {
    holdAt(param, releaseAt, fallbackValue);
    param.exponentialRampToValueAtTime(0.0001, end);
  }

  function cleanupVoice(voice, end) {
    const delay = Math.max(0, (end - ctx.currentTime + 0.12) * 1000);
    globalThis.setTimeout(() => {
      for (const node of voice.nodes) {
        try {
          node.disconnect();
        } catch {
          // 이미 정리된 노드는 무시한다.
        }
      }
      voices.delete(voice);
    }, delay);
  }

  function release(immediate = false) {
    const voice = activeVoice;
    if (!voice || voice.released) return;
    activeVoice = null;
    voice.released = true;

    const now = Math.max(ctx.currentTime, voice.startedAt);
    const releaseAt = immediate ? now + 0.004 : Math.max(now, voice.startedAt + 0.42);
    const bodyEnd = releaseAt + (immediate ? 0.055 : 0.25);
    const airEnd = releaseAt + (immediate ? 0.04 : 0.17);
    const end = Math.max(bodyEnd, airEnd);
    const bodyValue = envelopeValue(releaseAt, voice.bodyEnvelope);
    const airValue = envelopeValue(releaseAt, voice.airEnvelope);

    try {
      releaseParam(voice.bodyGain.gain, releaseAt, bodyEnd, bodyValue);
      releaseParam(voice.coreGain.gain, releaseAt, bodyEnd, bodyValue * 0.14);
      releaseParam(voice.airGain.gain, releaseAt, airEnd, airValue);
      voice.bodyFilter.frequency.cancelScheduledValues(releaseAt);
      voice.bodyFilter.frequency.setTargetAtTime(2200, releaseAt, immediate ? 0.018 : 0.07);
      for (const source of voice.sources) {
        try {
          source.stop(end + 0.07);
        } catch {
          // 한 번 정지된 AudioScheduledSourceNode는 다시 정지하지 않는다.
        }
      }
    } catch {
      // 브라우저가 종료 중이면 예약 실패를 무시하고 다음 음을 허용한다.
    }
    cleanupVoice(voice, end);
  }

  function play(note, spec) {
    if (!enabled) return null;
    release(true);

    const now = ctx.currentTime + 0.006;
    const toneStart = now + 0.012;
    const attack = Math.max(0.028, spec.attack || 0.065);
    const level = Math.max(0.11, spec.level || spec.peak || 0.2);
    const airLevel = Math.max(0.012, spec.air || 0.032);
    const brightness = Math.max(0.72, Math.min(1.22, spec.brightness || 1));
    const register = note.id >= 8 ? 1 : 0;

    const voiceBus = ctx.createGain();
    const bodyOscillator = ctx.createOscillator();
    const coreOscillator = ctx.createOscillator();
    const saturation = ctx.createWaveShaper();
    const bodyFilter = ctx.createBiquadFilter();
    const woodResonance = ctx.createBiquadFilter();
    const edgeResonance = ctx.createBiquadFilter();
    const bodyGain = ctx.createGain();
    const coreGain = ctx.createGain();

    const airSource = ctx.createBufferSource();
    const airHighpass = ctx.createBiquadFilter();
    const airBandpass = ctx.createBiquadFilter();
    const airGain = ctx.createGain();

    const chiffSource = ctx.createBufferSource();
    const chiffFilter = ctx.createBiquadFilter();
    const chiffGain = ctx.createGain();

    const vibrato = ctx.createOscillator();
    const vibratoDepth = ctx.createGain();
    const driftSource = ctx.createBufferSource();
    const driftFilter = ctx.createBiquadFilter();
    const driftPitchDepth = ctx.createGain();
    const driftLevelDepth = ctx.createGain();

    bodyOscillator.setPeriodicWave(makePeriodicWave(note, spec));
    bodyOscillator.frequency.setValueAtTime(note.freq, toneStart);
    coreOscillator.type = 'sine';
    coreOscillator.frequency.setValueAtTime(note.freq, toneStart);
    coreOscillator.detune.setValueAtTime(-0.9, toneStart);

    const pitchScoop = register ? -15 : -9;
    bodyOscillator.detune.setValueAtTime(pitchScoop, toneStart);
    bodyOscillator.detune.linearRampToValueAtTime(1.8, toneStart + attack * 0.58);
    bodyOscillator.detune.exponentialRampToValueAtTime(0.001, toneStart + attack + 0.075);

    saturation.curve = saturationCurve;
    saturation.oversample = '2x';
    bodyFilter.type = 'lowpass';
    setValue(bodyFilter.Q, 0.72);
    const settledCutoff = Math.min(10500, 4200 + note.freq * 2.15 + brightness * 900);
    bodyFilter.frequency.setValueAtTime(Math.min(11800, settledCutoff * 1.22), toneStart);
    bodyFilter.frequency.exponentialRampToValueAtTime(settledCutoff, toneStart + attack + 0.09);

    woodResonance.type = 'peaking';
    setValue(woodResonance.frequency, 1180 + register * 140);
    setValue(woodResonance.Q, 1.05);
    setValue(woodResonance.gain, 2.2);
    edgeResonance.type = 'peaking';
    setValue(edgeResonance.frequency, 2850 + register * 420);
    setValue(edgeResonance.Q, 0.78);
    setValue(edgeResonance.gain, 1.3 + brightness * 1.2);

    const sustain = level * (register ? 0.82 : 0.86);
    const bodyEnvelope = {
      start: toneStart,
      attack,
      settle: 0.11,
      peak: level * 1.06,
      sustain,
    };
    bodyGain.gain.setValueAtTime(0.0001, toneStart);
    bodyGain.gain.linearRampToValueAtTime(bodyEnvelope.peak, toneStart + attack);
    bodyGain.gain.exponentialRampToValueAtTime(sustain, toneStart + attack + bodyEnvelope.settle);

    const coreSustain = sustain * (register ? 0.1 : 0.15);
    coreGain.gain.setValueAtTime(0.0001, toneStart);
    coreGain.gain.linearRampToValueAtTime(level * 0.16, toneStart + attack * 1.08);
    coreGain.gain.exponentialRampToValueAtTime(coreSustain, toneStart + attack + 0.13);

    airSource.buffer = noiseBuffer;
    airSource.loop = true;
    airHighpass.type = 'highpass';
    setValue(airHighpass.frequency, 620 + note.freq * 0.28);
    setValue(airHighpass.Q, 0.45);
    airBandpass.type = 'bandpass';
    setValue(airBandpass.frequency, Math.min(5900, 2050 + note.freq * 1.45));
    setValue(airBandpass.Q, 0.62);
    const airSustain = airLevel * (register ? 1.14 : 1);
    const airEnvelope = {
      start: now,
      attack: attack * 0.72,
      settle: 0.15,
      peak: airSustain * 1.2,
      sustain: airSustain,
    };
    airGain.gain.setValueAtTime(0.0001, now);
    airGain.gain.linearRampToValueAtTime(airEnvelope.peak, now + airEnvelope.attack);
    airGain.gain.exponentialRampToValueAtTime(airSustain, now + airEnvelope.attack + airEnvelope.settle);

    chiffSource.buffer = noiseBuffer;
    chiffFilter.type = 'bandpass';
    setValue(chiffFilter.frequency, Math.min(7100, 2650 + note.freq * 1.9));
    setValue(chiffFilter.Q, 0.74);
    chiffGain.gain.setValueAtTime(0.0001, now);
    chiffGain.gain.linearRampToValueAtTime((spec.chiff || 0.085) * (register ? 1.15 : 1), now + 0.007);
    chiffGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.072);

    vibrato.type = 'sine';
    setValue(vibrato.frequency, spec.vibratoRate || (register ? 5.45 : 5.15));
    vibratoDepth.gain.setValueAtTime(0.001, toneStart);
    vibratoDepth.gain.setValueAtTime(0.001, toneStart + 0.28);
    vibratoDepth.gain.linearRampToValueAtTime(spec.vibratoDepth || (register ? 8.5 : 6.5), toneStart + 0.72);

    driftSource.buffer = noiseBuffer;
    driftSource.loop = true;
    driftFilter.type = 'lowpass';
    setValue(driftFilter.frequency, 2.4);
    setValue(driftFilter.Q, 0.56);
    setValue(driftPitchDepth.gain, register ? 3.1 : 2.4);
    setValue(driftLevelDepth.gain, level * 0.028);

    bodyOscillator.connect(saturation);
    saturation.connect(bodyFilter);
    bodyFilter.connect(woodResonance);
    woodResonance.connect(edgeResonance);
    edgeResonance.connect(bodyGain);
    bodyGain.connect(voiceBus);
    coreOscillator.connect(coreGain);
    coreGain.connect(voiceBus);

    airSource.connect(airHighpass);
    airHighpass.connect(airBandpass);
    airBandpass.connect(airGain);
    airGain.connect(voiceBus);
    chiffSource.connect(chiffFilter);
    chiffFilter.connect(chiffGain);
    chiffGain.connect(voiceBus);

    vibrato.connect(vibratoDepth);
    vibratoDepth.connect(bodyOscillator.detune);
    vibratoDepth.connect(coreOscillator.detune);
    driftSource.connect(driftFilter);
    driftFilter.connect(driftPitchDepth);
    driftPitchDepth.connect(bodyOscillator.detune);
    driftPitchDepth.connect(coreOscillator.detune);
    driftFilter.connect(driftLevelDepth);
    driftLevelDepth.connect(bodyGain.gain);

    const panner = connectWithPan(voiceBus, register ? 0.025 : -0.025);
    const sourceOffset = (note.id * 0.173) % 1.9;
    airSource.start(now, sourceOffset);
    chiffSource.start(now, (sourceOffset + 0.37) % 1.9, 0.11);
    bodyOscillator.start(toneStart);
    coreOscillator.start(toneStart);
    vibrato.start(toneStart);
    driftSource.start(toneStart, (sourceOffset + 0.91) % 1.9);

    const sources = [bodyOscillator, coreOscillator, airSource, chiffSource, vibrato, driftSource];
    const nodes = [
      voiceBus,
      bodyOscillator,
      coreOscillator,
      saturation,
      bodyFilter,
      woodResonance,
      edgeResonance,
      bodyGain,
      coreGain,
      airSource,
      airHighpass,
      airBandpass,
      airGain,
      chiffSource,
      chiffFilter,
      chiffGain,
      vibrato,
      vibratoDepth,
      driftSource,
      driftFilter,
      driftPitchDepth,
      driftLevelDepth,
    ];
    if (panner) nodes.push(panner);

    const voice = {
      sources,
      nodes,
      bodyGain,
      coreGain,
      airGain,
      bodyFilter,
      bodyEnvelope,
      airEnvelope,
      startedAt: toneStart,
      released: false,
    };
    voices.add(voice);
    activeVoice = voice;
    return voice;
  }

  function setEnabled(nextEnabled) {
    enabled = Boolean(nextEnabled);
    const now = ctx.currentTime;
    if (!enabled) release(true);
    master.gain.cancelScheduledValues(now);
    master.gain.setTargetAtTime(enabled ? 0.7 : 0.0001, now, enabled ? 0.018 : 0.01);
  }

  function destroy() {
    release(true);
    for (const voice of voices) {
      for (const source of voice.sources) {
        try {
          source.stop();
        } catch {
          // 이미 정지된 소스는 무시한다.
        }
      }
    }
    globalThis.setTimeout(() => {
      try {
        input.disconnect();
        master.disconnect();
      } catch {
        // 문서가 닫히는 중의 해제 오류는 무시한다.
      }
      voices.clear();
    }, 90);
  }

  return {
    version: VERSION,
    play,
    release,
    setEnabled,
    destroy,
  };
}
