import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fabLift } from './fabLift.mjs';

test('the footer below the window lifts nothing', () => assert.equal(fabLift(900, 740), 0));
test('the footer in the window lifts by its visible height', () => assert.equal(fabLift(587, 740), 153));
test('no footer lifts nothing', () => assert.equal(fabLift(undefined, 740), 0));
