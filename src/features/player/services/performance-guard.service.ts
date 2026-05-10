let currentFps = 60;
let isMonitoring = false;
let lastTime = 0;
let frameCount = 0;

export const performanceGuardService = {
  start() {
    if (isMonitoring) {
      return;
    }

    isMonitoring = true;
    lastTime = Date.now();
    frameCount = 0;

    const loop = () => {
      if (!isMonitoring) {
        return;
      }

      frameCount += 1;

      const now = Date.now();
      const diff = now - lastTime;

      if (diff >= 1000) {
        currentFps = Math.round((frameCount * 1000) / diff);
        frameCount = 0;
        lastTime = now;
      }

      requestAnimationFrame(loop);
    };

    requestAnimationFrame(loop);
  },

  stop() {
    isMonitoring = false;
  },

  getCurrentFps() {
    return currentFps;
  },

  shouldThrottleDownloads() {
    return currentFps < 45;
  },

  getRecommendedConcurrentDownloads() {
    if (currentFps < 35) {
      return 1;
    }

    if (currentFps < 45) {
      return 2;
    }

    return 3;
  },
};
