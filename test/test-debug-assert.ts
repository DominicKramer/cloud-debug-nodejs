// Copyright 2017 Google LLC
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import * as realAssert from 'assert';
import {debugAssert} from '../src/agent/util/debug-assert';
import {describe, it} from 'mocha';

describe('debug-assert', () => {
  it('should fire assertions when enabled', () => {
    realAssert.throws(() => {
      const assert = debugAssert(true);
      assert.strictEqual(1, 2);
    });
  });

  describe('disabled', () => {
    const assert = debugAssert(false);

    it('should not fire assertions when disabled', () => {
      assert.strictEqual(1, 2);
    });

    it('should cover the full assert API', () => {
      Object.keys(realAssert).forEach(key => {
        realAssert.strictEqual(
          typeof ((assert as {}) as {[key: string]: Function})[key],
          'function',
          `${key} does not exist on the debug assert library`
        );
      });
    });
  });
});
