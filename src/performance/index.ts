
import * as semver from 'semver';
import * as perfTrace from './perf-trace';

export interface PerfManager {
  start(name: string): void;
  end(name: string): void;
  timed<T>(name: string, fn: () => T): T;
  timedClass<T extends Function>(obj: T): T;
}

class PerfTraceManager implements PerfManager {
  start(name: string): void {
    perfTrace.start(name);
  }

  end(name: string): void {
    perfTrace.end(name);
  }

  timed<T>(name: string, fn: () => T): T {
    return perfTrace.wrap<T>(name, fn);
  }

  timedClass<T extends Function>(obj: T): T {
    return perfTrace.wrapClass<T>(obj);
  }
}

export const perf: PerfManager = new PerfTraceManager();
