<?php
declare(strict_types=1);

namespace Example\Delivery;

use DateTimeImmutable;

/**
 * Class DeliveryRequest
 *
 * Keeps the supplied destination intact for the carrier's own address validation.
 *
 * @author Bas Milius <bas@mili.us>
 * @package Example\Delivery
 * @since 2.5.0
 */
#[CarrierTag('parcel')]
#[CarrierTag('priority', priority: 2)]
final readonly class DeliveryRequest
{

    /**
     * A null dispatch date lets the carrier select its next available collection.
     *
     * @param string $reference
     * @param string $carrier
     * @param array{street: string, city: string, postalCode: string, country: string} $destination
     * @param DateTimeImmutable|null $dispatchAt
     *
     * @author Bas Milius <bas@mili.us>
     * @since 2.5.0
     */
    public function __construct(
        public string $reference,
        #[CarrierTag('routing')] public string $carrier,
        public array $destination,
        public DateTimeImmutable|null $dispatchAt = null
    ) {}

    /**
     * Leaves the dispatch date null until a collection has been selected.
     *
     * @return array{reference: string, carrier: string, destination: array{street: string, city: string, postalCode: string, country: string}, dispatchAt: string|null}
     * @author Bas Milius <bas@mili.us>
     * @since 2.5.0
     */
    #[CarrierTag('manifest')]
    #[CarrierTag('audit')]
    public function manifest(): array
    {
        return ['reference' => $this->reference, 'carrier' => $this->carrier, 'destination' => $this->destination, 'dispatchAt' => $this->dispatchAt?->format('Y-m-d')];
    }

}
