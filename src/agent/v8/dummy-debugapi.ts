/**
 * Copyright 2017 Google Inc. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import {Logger} from '../../types/common-types';
import * as stackdriver from '../../types/stackdriver';
import {DebugAgentConfig} from '../config';
import {ScanStats} from '../io/scanner';
import {SourceMapper} from '../io/sourcemapper';

import {DebugApi} from './debugapi';

export class DummyDebugApi implements DebugApi {
  constructor(
      logger: Logger, _config: DebugAgentConfig, _jsFiles: ScanStats,
      _sourcemapper: SourceMapper) {
    logger.error(
        'Debug agent cannot get node version. Cloud debugger is disabled.');
  }
  set(_breakpoint: stackdriver.Breakpoint,
      cb: (err: Error|null) => void): void {
    return setImmediate(() => {
      cb(new Error('no debugapi running.'));
    });
  }
  clear(_breakpoint: stackdriver.Breakpoint, cb: (err: Error|null) => void):
      void {
    return setImmediate(() => {
      cb(new Error('no debugapi running.'));
    });
  }
  wait(_breakpoint: stackdriver.Breakpoint, cb: (err?: Error) => void): void {
    return setImmediate(() => {
      cb(new Error('no debugapi running.'));
    });
  }
  log:
      (breakpoint: stackdriver.Breakpoint,
       print: (format: string, exps: string[]) => void,
       shouldStop: () => boolean) => void;
  disconnect: () => void;
  numBreakpoints_: () => number;
  numListeners_: () => number;
}
