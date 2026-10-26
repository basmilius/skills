<?php
declare(strict_types=1);

namespace Example\Delivery;

use Attribute;
use InvalidArgumentException;

/**
 * Class CarrierTag
 *
 * Allows a delivery declaration to advertise more than one carrier capability.
 *
 * @author Bas Milius <bas@mili.us>
 * @package Example\Delivery
 * @since 2.5.0
 */
#[Attribute(Attribute::TARGET_CLASS | Attribute::TARGET_METHOD | Attribute::TARGET_PROPERTY | Attribute::TARGET_PARAMETER | Attribute::IS_REPEATABLE)]
final readonly class CarrierTag
{

    /**
     * Requires a nonempty capability name and a nonnegative routing priority.
     *
     * @param string $name
     * @param int $priority
     *
     * @throws InvalidArgumentException
     * @author Bas Milius <bas@mili.us>
     * @since 2.5.0
     */
    public function __construct(public string $name, public int $priority = 0)
    {
        if ($name === '' || $priority < 0) {
            throw new InvalidArgumentException('A carrier capability needs a name and a nonnegative priority.');
        }
    }

}
