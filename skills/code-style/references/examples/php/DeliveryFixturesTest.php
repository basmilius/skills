<?php
declare(strict_types=1);

namespace Example\Delivery\Tests;

use DateTimeImmutable;
use Example\Delivery\{DeliveryRequest, LegacyLimit, TrackingState};
use InvalidArgumentException;
use function dataset;
use function expect;
use function test;

dataset('valid delivery limits', ['one item' => ['1', 1], 'leading zeroes' => ['0025', 25], 'page of one hundred' => ['100', 100]]);

dataset('invalid delivery limits', ['empty' => [''], 'whitespace' => [' 25'], 'decimal' => ['2.5'], 'signed positive' => ['+25'], 'zero' => ['0'], 'negative' => ['-25'], 'word' => ['many']]);

test('preserves valid legacy page sizes', function (string $value, int $expected): void {
    expect((new LegacyLimit())->parse($value))->toBe($expected);
})->with('valid delivery limits');

test('rejects invalid legacy page sizes', function (string $value): void {
    expect(static fn(): int => (new LegacyLimit())->parse($value))->toThrow(InvalidArgumentException::class);
})->with('invalid delivery limits');

test('exports a carrier-ready dispatch date', function (): void {
    $request = new DeliveryRequest(
        reference: 'parcel-18',
        carrier: 'example-carrier',
        destination: ['street' => 'Canal Street 18', 'city' => 'Amsterdam', 'postalCode' => '1011 AA', 'country' => 'NL'],
        dispatchAt: new DateTimeImmutable('2026-10-05')
    );

    expect($request->manifest()['dispatchAt'])->toBe('2026-10-05');
});

test('keeps the first carrier acknowledgment', function (): void {
    $state = new TrackingState('  parcel-18  ', retryLimit: 2);
    $first = new DateTimeImmutable('2026-10-05T10:00:00+02:00');
    $state->recordAttempt();
    $state->acknowledge($first);
    $state->acknowledge(new DateTimeImmutable('2026-10-05T10:01:00+02:00'));

    expect($state->label)->toBe('parcel-18');
    expect($state->attempts)->toBe(1);
    expect($state->deliveredAt)->toBe($first);
    expect($state->status)->toBe('delivered');
});
