/**
 * @license
 * Copyright 2017 The Bazel Authors. All rights reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 *
 * You may obtain a copy of the License at
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * perf_trace records traces in the Chrome Trace format (which is actually used
 * for more than just Chrome).  See:
 * https://github.com/catapult-project/catapult/blob/master/tracing/README.md
 */

// the following code is based on the perf-trace.ts file from the Bazel project

import * as fs from 'fs';
import * as path from 'path';
import * as util from 'util';
const MODULE = require('module');

type Microseconds = number;

/**
 * The type of entries in the Chrome Trace format:
 * https://docs.google.com/document/d/1CvAClvFfyA5R-PhYUmn5OOQtYMH4h6I0nSsKchNAySU/edit
 * Field names are chosen to match the JSON format.
 */
declare interface Event {
  name: string;
  ph: 'B'|'E'|'X'|'C';
  pid: number;  // Required field in the trace viewer, but we don't use it.
  ts: Microseconds;
  dur?: Microseconds;
  args?: {};
}

const OUTPUT_PATH = path.join('.', 'perf.json');
const TIMEOUT_MS = 10*1000;

const timeMap: Map<string, Microseconds[]> = new Map();
const events: Event[] = [];
let scheduled = false;

const orig = MODULE._load;
MODULE._load = function(request: string, parent: {}, isMain: boolean) {
  const args = arguments;
  let exports;
  wrap(`require ${request}`, () => {
    exports = orig.apply(this, args);
  });
  return exports;
};

/** @return a high-res timestamp of the current time. */
function now(): Microseconds {
  const [sec, nsec] = process.hrtime();
  return (sec * 1e6) + (nsec / 1e3);
}

function addEvent(name: string, start: Microseconds, end: Microseconds) {
  events.push({name, ph: 'X', pid: 1, ts: start, dur: (end - start)});
  if (!scheduled) {
    scheduled = true;
    setTimeout(() => {
      fs.writeFile(OUTPUT_PATH, JSON.stringify(events), {encoding: 'utf8'}, (err) => {
        scheduled = false;
        if (err) {
          console.error(err);
        }
        else {
          console.log(`Wrote the performance data to ${OUTPUT_PATH}`);
        }
      });
    }, TIMEOUT_MS);
  }
}

/** wrap wraps enter()/leave() calls around a block of code. */
export function wrap<T>(name: string, f: () => T): T {
  const start = now();
  try {
    return f();
  } finally {
    const end = now();
    addEvent(name, start, end);
  }
}

export function start(name: string): void {
  const startTime = now();
  if (!timeMap.has(name)) {
    timeMap.set(name, []);
  }
  timeMap.get(name)!.push(startTime);
}

export function end(name: string): void {
  const endTime = now();
  const stack = timeMap.get(name);
  if (!stack || stack.length === 0) {
    throw new Error(`Cannot end ${name} because it ` +
                    `does not have a matching start`);
  }
  const startTime = stack.pop();
  addEvent(name, startTime!, endTime);
}

function wrapObject<T>(obj: T, name: string): T {
  for (const prop of Object.getOwnPropertyNames(obj)) {
    const original = (obj as any)[prop];
    if (typeof original === 'function') {
      (obj as any)[prop] = function() {
        let finished = false;
        const start = now();

        function finish() {
          if (finished) {
            return;
          }
          finished = true;
          const end = now();
          const args: string[] = [];
          for (const a of Array.prototype.slice.call(arguments)) {
            args.push(util.inspect(a));
          }
          addEvent(`${name}:${prop}(${args})`, start, end);
        }

        const result = original.apply(this, arguments);
        if (result && result.then) {
          return result.then((value: any) => {
            finish();
            return result;
          });
        }
        else {
          finish();
          return result;
        }
      }
    }
  }
  return obj;
}

export function wrapClass<T extends Function>(obj: T): T {
  if (obj) {
    const name = obj.name;

    // wrap static methods
    wrapObject(obj, name);

    if (obj.prototype) {
      // wrap regular methods
      wrapObject(obj.prototype, name);
    }
  }

  return obj;
}
