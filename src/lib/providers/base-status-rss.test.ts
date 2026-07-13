import assert from 'node:assert/strict';
import test from 'node:test';
import { plainText, statusFromText } from './base-status-rss';
import { sanitizeStripeDates } from './stripe';

test('plainText normalizes common feed HTML', () => {
  assert.equal(
    plainText('<p><b>Resolved</b> - API errors are back to normal.&nbsp;</p>'),
    'Resolved - API errors are back to normal.',
  );
});

test('statusFromText uses the most recent lifecycle update', () => {
  assert.equal(
    statusFromText('Investigating - errors observed. Monitoring - fix deployed. Resolved - recovered.'),
    'resolved',
  );
  assert.equal(statusFromText('Identified - deploying a fix'), 'investigating');
  assert.equal(statusFromText('Scheduled maintenance tomorrow'), 'active');
});

test('sanitizeStripeDates repairs malformed far-future maintenance dates', () => {
  const xml = '<entry><published>58266-02-28T00:00:00Z</published><updated>2026-05-15T13:30:30Z</updated></entry>';
  assert.equal(
    sanitizeStripeDates(xml),
    '<entry><published>2026-05-15T13:30:30Z</published><updated>2026-05-15T13:30:30Z</updated></entry>',
  );
});
