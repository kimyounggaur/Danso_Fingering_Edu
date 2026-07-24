import assert from "node:assert/strict";
import test from "node:test";
import vm from "node:vm";
import {
  createDansoSynth,
  DANSO_SYNTH_VERSION,
} from "../03 모바일 웹앱/danso_synth.mjs";

class FakeAudioParam {
  constructor(name, value = 0) {
    this.name = name;
    this.value = value;
    this.events = [];
  }

  record(method, args) {
    this.events.push({ method, args: [...args] });
    if (method !== "cancelScheduledValues" && method !== "cancelAndHoldAtTime") {
      this.value = args[0];
    }
    return this;
  }

  setValueAtTime(...args) {
    return this.record("setValueAtTime", args);
  }

  linearRampToValueAtTime(...args) {
    return this.record("linearRampToValueAtTime", args);
  }

  exponentialRampToValueAtTime(...args) {
    return this.record("exponentialRampToValueAtTime", args);
  }

  cancelScheduledValues(...args) {
    return this.record("cancelScheduledValues", args);
  }

  cancelAndHoldAtTime(...args) {
    return this.record("cancelAndHoldAtTime", args);
  }

  setTargetAtTime(...args) {
    return this.record("setTargetAtTime", args);
  }
}

class FakeAudioNode {
  constructor(context, kind) {
    this.context = context;
    this.kind = kind;
    this.connections = [];
    this.disconnectCount = 0;
    context.nodes.push(this);
  }

  connect(target) {
    this.connections.push(target);
    return target;
  }

  disconnect() {
    this.disconnectCount += 1;
  }
}

class FakeAudioBuffer {
  constructor(numberOfChannels, length, sampleRate) {
    this.numberOfChannels = numberOfChannels;
    this.length = length;
    this.sampleRate = sampleRate;
    this.channels = Array.from(
      { length: numberOfChannels },
      () => new Float32Array(length),
    );
  }

  getChannelData(channel) {
    return this.channels[channel];
  }
}

class FakeAudioContext {
  constructor({ sampleRate = 48_000, currentTime = 1.25 } = {}) {
    this.sampleRate = sampleRate;
    this.currentTime = currentTime;
    this.destination = { kind: "destination" };
    this.nodes = [];
    this.buffers = [];
    this.periodicWaves = [];
  }

  node(kind, properties = {}) {
    return Object.assign(new FakeAudioNode(this, kind), properties);
  }

  param(name, value = 0) {
    return new FakeAudioParam(name, value);
  }

  createBuffer(numberOfChannels, length, sampleRate) {
    const buffer = new FakeAudioBuffer(numberOfChannels, length, sampleRate);
    this.buffers.push(buffer);
    return buffer;
  }

  createGain() {
    return this.node("gain", { gain: this.param("gain", 1) });
  }

  createBiquadFilter() {
    return this.node("biquad-filter", {
      type: "lowpass",
      frequency: this.param("frequency", 350),
      Q: this.param("Q", 1),
      gain: this.param("gain", 0),
    });
  }

  createDelay(maxDelayTime) {
    return this.node("delay", {
      maxDelayTime,
      delayTime: this.param("delayTime", 0),
    });
  }

  createConvolver() {
    return this.node("convolver", { buffer: null });
  }

  createDynamicsCompressor() {
    return this.node("dynamics-compressor", {
      threshold: this.param("threshold", -24),
      knee: this.param("knee", 30),
      ratio: this.param("ratio", 12),
      attack: this.param("attack", 0.003),
      release: this.param("release", 0.25),
    });
  }

  createPeriodicWave(real, imaginary, options) {
    const wave = { real, imaginary, options };
    this.periodicWaves.push(wave);
    return wave;
  }

  createStereoPanner() {
    return this.node("stereo-panner", { pan: this.param("pan", 0) });
  }

  createOscillator() {
    const node = this.node("oscillator", {
      type: "sine",
      frequency: this.param("frequency", 440),
      detune: this.param("detune", 0),
      periodicWave: null,
      starts: [],
      stops: [],
    });
    node.setPeriodicWave = (wave) => {
      node.periodicWave = wave;
    };
    node.start = (...args) => node.starts.push(args);
    node.stop = (...args) => node.stops.push(args);
    return node;
  }

  createWaveShaper() {
    return this.node("wave-shaper", {
      curve: null,
      oversample: "none",
    });
  }

  createBufferSource() {
    const node = this.node("buffer-source", {
      buffer: null,
      loop: false,
      starts: [],
      stops: [],
    });
    node.start = (...args) => node.starts.push(args);
    node.stop = (...args) => node.stops.push(args);
    return node;
  }
}

function nodesOf(context, kind) {
  return context.nodes.filter((node) => node.kind === kind);
}

function eventMethods(param) {
  return param.events.map((event) => event.method);
}

function runScheduledCallbacksImmediately(t) {
  t.mock.method(globalThis, "setTimeout", (callback) => {
    callback();
    return 0;
  });
}

const LOW_NOTE = { id: 1, freq: 261.63 };
const HIGH_NOTE = { id: 8, freq: 523.25 };
const SPEC = {
  attack: 0.064,
  level: 0.21,
  air: 0.034,
  brightness: 1.04,
  chiff: 0.086,
  vibratoRate: 5.2,
  vibratoDepth: 6.7,
};

test("constructs the filtered dry/room master chain and acoustic buffers", () => {
  const context = new FakeAudioContext();
  const synth = createDansoSynth(context);

  assert.equal(synth.version, DANSO_SYNTH_VERSION);
  assert.deepEqual(
    Object.keys(synth).sort(),
    ["destroy", "play", "release", "setEnabled", "version"],
  );

  assert.equal(nodesOf(context, "gain").length, 4);
  assert.equal(nodesOf(context, "biquad-filter").length, 2);
  assert.equal(nodesOf(context, "delay").length, 1);
  assert.equal(nodesOf(context, "convolver").length, 1);
  assert.equal(nodesOf(context, "dynamics-compressor").length, 1);

  const [rumbleCut, airCeiling] = nodesOf(context, "biquad-filter");
  assert.equal(rumbleCut.type, "highpass");
  assert.equal(rumbleCut.frequency.value, 115);
  assert.equal(airCeiling.type, "lowpass");
  assert.equal(airCeiling.frequency.value, 9_600);

  const [delay] = nodesOf(context, "delay");
  assert.equal(delay.maxDelayTime, 0.08);
  assert.equal(delay.delayTime.value, 0.018);

  const [compressor] = nodesOf(context, "dynamics-compressor");
  assert.equal(compressor.threshold.value, -20);
  assert.equal(compressor.ratio.value, 3.2);

  const master = nodesOf(context, "gain").find(
    (node) => node.gain.value === 0.7,
  );
  assert.ok(master, "master gain should be initialized");
  assert.ok(master.connections.includes(context.destination));
  assert.ok(compressor.connections.includes(master));

  assert.equal(context.buffers.length, 2);
  const [breathNoise, roomImpulse] = context.buffers;
  assert.equal(breathNoise.numberOfChannels, 1);
  assert.equal(breathNoise.length, 115_200);
  assert.equal(roomImpulse.numberOfChannels, 2);
  assert.equal(roomImpulse.length, 29_760);
  assert.ok(
    breathNoise.getChannelData(0).some((sample) => sample !== 0),
    "breath noise must contain generated samples",
  );
  assert.ok(
    roomImpulse.getChannelData(1).some((sample) => sample !== 0),
    "room impulse must contain generated samples",
  );
});

test("plays, releases, toggles, and destroys a procedural voice", (t) => {
  runScheduledCallbacksImmediately(t);
  const context = new FakeAudioContext();
  const synth = createDansoSynth(context);
  const master = nodesOf(context, "gain").find(
    (node) => node.gain.value === 0.7,
  );

  const lowVoice = synth.play(LOW_NOTE, SPEC);
  assert.ok(lowVoice);
  assert.equal(lowVoice.sources.length, 6);
  assert.equal(nodesOf(context, "oscillator").length, 3);
  assert.equal(nodesOf(context, "buffer-source").length, 3);
  assert.equal(nodesOf(context, "wave-shaper").length, 1);
  assert.equal(nodesOf(context, "stereo-panner").length, 1);

  const [bodyOscillator, coreOscillator, vibrato] =
    nodesOf(context, "oscillator");
  assert.equal(bodyOscillator.frequency.events[0].args[0], LOW_NOTE.freq);
  assert.deepEqual(eventMethods(bodyOscillator.detune), [
    "setValueAtTime",
    "linearRampToValueAtTime",
    "exponentialRampToValueAtTime",
  ]);
  assert.ok(bodyOscillator.periodicWave);
  assert.equal(coreOscillator.type, "sine");
  assert.equal(vibrato.type, "sine");
  assert.ok(
    [bodyOscillator, coreOscillator, vibrato].every(
      (oscillator) => oscillator.starts.length === 1,
    ),
  );

  assert.equal(context.periodicWaves.length, 1);
  assert.equal(context.periodicWaves[0].real.length, 12);
  assert.equal(context.periodicWaves[0].options.disableNormalization, false);
  const [waveShaper] = nodesOf(context, "wave-shaper");
  assert.equal(waveShaper.curve.length, 1_024);
  assert.equal(waveShaper.oversample, "2x");

  assert.deepEqual(eventMethods(lowVoice.bodyGain.gain), [
    "setValueAtTime",
    "linearRampToValueAtTime",
    "exponentialRampToValueAtTime",
  ]);
  assert.deepEqual(
    nodesOf(context, "biquad-filter").map((node) => node.type),
    [
      "highpass",
      "lowpass",
      "lowpass",
      "peaking",
      "peaking",
      "highpass",
      "bandpass",
      "bandpass",
      "lowpass",
    ],
  );
  assert.equal(nodesOf(context, "stereo-panner")[0].pan.value, -0.025);

  synth.setEnabled(false);
  assert.ok(
    lowVoice.sources.every((source) => source.stops.length === 1),
    "disabling should schedule every source to stop",
  );
  assert.ok(lowVoice.nodes.every((node) => node.disconnectCount === 1));
  assert.equal(synth.play(HIGH_NOTE, SPEC), null);
  assert.deepEqual(master.gain.events.at(-1), {
    method: "setTargetAtTime",
    args: [0.0001, context.currentTime, 0.01],
  });

  synth.setEnabled(true);
  const highVoice = synth.play(HIGH_NOTE, SPEC);
  assert.ok(highVoice);
  assert.equal(nodesOf(context, "stereo-panner").at(-1).pan.value, 0.025);
  assert.doesNotThrow(() => synth.release());
  assert.ok(
    eventMethods(highVoice.bodyGain.gain).includes("cancelAndHoldAtTime"),
  );
  assert.equal(
    highVoice.bodyGain.gain.events.at(-1).method,
    "exponentialRampToValueAtTime",
  );
  assert.ok(highVoice.sources.every((source) => source.stops.length === 1));

  assert.doesNotThrow(() => synth.destroy());
  assert.equal(master.disconnectCount, 1);
});

test("falls back cleanly when StereoPannerNode is unavailable", (t) => {
  runScheduledCallbacksImmediately(t);
  const context = new FakeAudioContext();
  context.createStereoPanner = undefined;
  const synth = createDansoSynth(context);

  const voice = synth.play(LOW_NOTE, SPEC);
  assert.ok(voice);
  assert.equal(nodesOf(context, "stereo-panner").length, 0);
  assert.equal(voice.nodes[0].connections[0].kind, "gain");
  assert.doesNotThrow(() => synth.destroy());
});

test("factory is self-contained and stringifiable for standalone embedding", () => {
  const source = createDansoSynth.toString();
  assert.doesNotMatch(source, /\bDANSO_SYNTH_VERSION\b/);

  const embeddedFactory = vm.runInNewContext(`(${source})`, {
    setTimeout(callback) {
      callback();
      return 0;
    },
  });
  const context = new FakeAudioContext();
  const synth = embeddedFactory(context);

  assert.equal(synth.version, DANSO_SYNTH_VERSION);
  assert.ok(synth.play(HIGH_NOTE, SPEC));
  assert.doesNotThrow(() => synth.release(true));
  assert.doesNotThrow(() => synth.destroy());
});
