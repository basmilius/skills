<?php
declare(strict_types=1);

namespace Example\Delivery;

use Closure;
use Countable;
use Stringable;
use function array_map;
use function count;
use function implode;
use function str_replace;
use function trim;
use const PHP_EOL;

/**
 * Class DeliveryCallbacks
 *
 * Supplies callbacks that can be passed to carrier adapters without retaining an adapter instance.
 *
 * @author Bas Milius <bas@mili.us>
 * @package Example\Delivery
 * @since 2.5.0
 */
final class DeliveryCallbacks
{

    /**
     * Replaces line breaks before a label is included in a single-line carrier export.
     *
     * @param string $replacement
     *
     * @return Closure(string): string
     * @author Bas Milius <bas@mili.us>
     * @since 2.5.0
     */
    public static function labelNormalizer(string $replacement = ' '): Closure
    {
        return static function (string $label) use ($replacement): string {
            $label = str_replace(["\r\n", "\r", "\n"], $replacement, $label);

            return trim($label);
        };
    }

    /**
     * Retains input order while adding the carrier's required reference prefix.
     *
     * @param list<DeliveryRequest> $requests
     * @param string $prefix
     *
     * @return list<string>
     * @author Bas Milius <bas@mili.us>
     * @since 2.5.0
     */
    public static function references(array $requests, string $prefix): array
    {
        return array_map(static fn(DeliveryRequest $request): string => $prefix . $request->reference, $requests);
    }

    /**
     * Freezes the supplied lines for logging while exposing the number of recorded events.
     *
     * @param list<string> $events
     *
     * @return Countable&Stringable
     * @author Bas Milius <bas@mili.us>
     * @since 2.5.0
     */
    public static function auditSnapshot(array $events): Countable&Stringable
    {
        return new class($events) implements Countable, Stringable {

            /**
             * Retains the event order used by the carrier's log.
             *
             * @param list<string> $events
             *
             * @author Bas Milius <bas@mili.us>
             * @since 2.5.0
             */
            public function __construct(private readonly array $events) {}

            /**
             * {@inheritdoc}
             *
             * @return int
             * @author Bas Milius <bas@mili.us>
             * @since 2.5.0
             */
            public function count(): int
            {
                return count($this->events);
            }

            /**
             * Joins event lines without adding a trailing line break.
             *
             * @return string
             * @author Bas Milius <bas@mili.us>
             * @since 2.5.0
             */
            public function __toString(): string
            {
                return implode(PHP_EOL, $this->events);
            }

        };
    }

}
