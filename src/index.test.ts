import { describe, expect, it } from 'vitest';

import { parseTitle } from './index';

describe('parseTitle', () => {
  it('normalizes title and keeps source', () => {
    const result = parseTitle('  Hello VidPulse  ');

    expect(result).toEqual({
      source: '  Hello VidPulse  ',
      title: 'Hello VidPulse',
      normalizedTitle: 'hello vidpulse'
    });
  });
});
