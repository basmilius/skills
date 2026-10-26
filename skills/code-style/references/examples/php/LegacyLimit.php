<?php
declare(strict_types=1);

namespace Example\Delivery;

use InvalidArgumentException;
use function ctype_digit;
use function min;

/**
 * Class LegacyLimit
 *
 * Parses page-size input shared by existing API endpoints.
 *
 * @author Bas Milius <bas@mili.us>
 * @package Example\Delivery
 * @since 1.4.0
 */
final class LegacyLimit
{

    /**
     * Accepts positive decimal input without signs or surrounding whitespace.
     *
     * @param string $value
     *
     * @return int
     * @throws InvalidArgumentException
     * @author Bas Milius <bas@mili.us>
     * @since 1.4.2
     */
    public function parse(string $value): int
    {
        if (!ctype_digit($value) || (int)$value < 1) {
            throw new InvalidArgumentException('A page size must contain digits and be greater than zero.');
        }

        return (int)$value;
    }

    /**
     * Caps a valid page size at a positive endpoint-specific maximum.
     *
     * @param string $value
     * @param int $maximum
     *
     * @return int
     * @throws InvalidArgumentException
     * @author Bas Milius <bas@mili.us>
     * @since 2.5.0
     */
    public function parseCapped(string $value, int $maximum = 100): int
    {
        if ($maximum < 1) {
            throw new InvalidArgumentException('A page-size maximum must be positive.');
        }

        return min($this->parse($value), $maximum);
    }

}
