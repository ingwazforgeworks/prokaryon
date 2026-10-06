// Headless shim so client test scripts can load modules that construct Audio at import time.
globalThis.Audio = class {
  constructor() {
    this.volume = 1;
  }
  addEventListener() {}
  play() {
    return Promise.resolve();
  }
  pause() {}
};