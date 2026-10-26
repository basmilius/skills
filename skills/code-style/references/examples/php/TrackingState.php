<?php
declare(strict_types=1);

namespace Example\Delivery;

use DateTimeImmutable;
use InvalidArgumentException;
use LogicException;
use function trim;

/**
 * Class TrackingState
 *
 * Prevents retries and label changes after a delivery has been acknowledged.
 *
 * @author Bas Milius <bas@mili.us>
 * @package Example\Delivery
 * @since 2.5.0
 */
final class TrackingState
{

    /**
     * Changes only when an attempt is accepted by this state.
     *
     * @var non-negative-int
     * @author Bas Milius <bas@mili.us>
     * @since 2.5.0
     */
    public private(set) int $attempts = 0;

    /**
     * Acknowledgment time comes from the carrier rather than the local clock.
     *
     * @var DateTimeImmutable|null
     * @author Bas Milius <bas@mili.us>
     * @since 2.5.0
     */
    public private(set) DateTimeImmutable|null $deliveredAt = null;

    /**
     * Surrounding whitespace is discarded before the label reaches the carrier.
     *
     * @var non-empty-string
     * @author Bas Milius <bas@mili.us>
     * @since 2.5.0
     */
    public string $label {
        get {
            return $this->label;
        }
        set {
            if ($this->deliveredAt !== null) {
                throw new LogicException('A delivered parcel cannot be relabeled.');
            }

            $label = trim($value);

            if ($label === '') {
                throw new InvalidArgumentException('A delivery label cannot be empty.');
            }

            $this->label = $label;
        }
    }

    /**
     * Cannot be lowered below the number of attempts already made.
     *
     * @var positive-int
     * @author Bas Milius <bas@mili.us>
     * @since 2.5.0
     */
    public int $retryLimit {
        get => $this->retryLimit;
        set {
            if ($value < 1 || $value < $this->attempts) {
                throw new InvalidArgumentException('The retry limit must cover all existing attempts.');
            }

            $this->retryLimit = $value;
        }
    }

    /**
     * Derived from acknowledgment and attempts, so it cannot drift from them.
     *
     * @var 'pending'|'attempted'|'delivered'
     * @author Bas Milius <bas@mili.us>
     * @since 2.5.0
     */
    public string $status {
        get => $this->deliveredAt !== null ? 'delivered' : ($this->attempts > 0 ? 'attempted' : 'pending');
    }

    /**
     * Requires a nonempty label and a positive retry limit.
     *
     * @param string $label
     * @param int $retryLimit
     *
     * @throws InvalidArgumentException
     * @author Bas Milius <bas@mili.us>
     * @since 2.5.0
     */
    public function __construct(string $label, int $retryLimit = 3)
    {
        $this->label = $label;
        $this->retryLimit = $retryLimit;
    }

    /**
     * Refuses further attempts once the limit is reached or delivery is acknowledged.
     *
     * @return void
     * @throws LogicException
     * @author Bas Milius <bas@mili.us>
     * @since 2.5.0
     */
    public function recordAttempt(): void
    {
        if ($this->deliveredAt !== null || $this->attempts >= $this->retryLimit) {
            throw new LogicException('This delivery cannot accept another attempt.');
        }

        $this->attempts++;
    }

    /**
     * Keeps the first acknowledgment when the carrier repeats its callback.
     *
     * @param DateTimeImmutable $acknowledgedAt
     *
     * @return void
     * @author Bas Milius <bas@mili.us>
     * @since 2.5.0
     */
    public function acknowledge(DateTimeImmutable $acknowledgedAt): void
    {
        $this->deliveredAt ??= $acknowledgedAt;
    }

}
