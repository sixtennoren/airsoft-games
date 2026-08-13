// audio.ts
let audioContext: AudioContext | null = null;
let streamDestination: MediaStreamAudioDestinationNode | null = null;
let outputElement: HTMLAudioElement | null = null;
const bufferCache = new Map<string, AudioBuffer>();

function getContext(): AudioContext {
  if (!audioContext) {
    audioContext = new AudioContext();

    // Route the graph through a real <audio> element (via a MediaStream)
    // instead of straight to context.destination. iOS suspends plain
    // AudioContext output once the screen locks, but keeps playing a
    // genuine media element, so this keeps sounds audible in the background.
    streamDestination = audioContext.createMediaStreamDestination();
    outputElement = new Audio();
    outputElement.srcObject = streamDestination.stream;
  }
  return audioContext;
}

// Call this from a user gesture (e.g. a button click) to satisfy
// autoplay/unlock policies, especially on iOS Safari.
export async function unlockAudio() {
  const context = getContext();
  if (context.state === "suspended") {
    await context.resume();
  }
  if (outputElement && outputElement.paused) {
    await outputElement.play();
  }
}

async function loadBuffer(path: string): Promise<AudioBuffer> {
  const cached = bufferCache.get(path);
  if (cached) return cached;

  const context = getContext();
  const response = await fetch(path);
  const arrayBuffer = await response.arrayBuffer();
  const buffer = await context.decodeAudioData(arrayBuffer);
  bufferCache.set(path, buffer);
  return buffer;
}

// Fetch and decode a sound ahead of time so playSound() has no latency.
export async function preloadSound(path: string) {
  await loadBuffer(path);
}

export type SoundHandle = {
  stop: () => void;
  setVolume: (volume: number) => void;
};

// Plays via a GainNode instead of HTMLMediaElement.volume, since iOS Safari
// ignores volume changes made through the latter.
export async function playSound(path: string, volume = 1): Promise<SoundHandle> {
  const context = getContext();
  const buffer = await loadBuffer(path);

  const source = context.createBufferSource();
  source.buffer = buffer;

  const gainNode = context.createGain();
  gainNode.gain.value = volume;

  source.connect(gainNode);
  gainNode.connect(streamDestination!);
  source.start();

  return {
    stop: () => source.stop(),
    setVolume: (v: number) => {
      gainNode.gain.value = v;
    },
  };
}
