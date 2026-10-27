/*
 * The Lucide icons a report uses, as SVG markup the build looks up and registers. The runtime carries no icon set of
 * its own; server and browser draw the same `<svg>`, so hydration matches.
 */
const ICONS = new Map();

export function registerIcons(entries) {
    for (const [name, inner] of Object.entries(entries)) {
        ICONS.set(name, inner);
    }
}

export const hasIcon = (name) => ICONS.has(name);

export const pascalCase = (name) => name.replace(/(^|-)([a-z0-9])/g, (_, __, letter) => letter.toUpperCase());

/** A component with the props of a Lucide icon that matter in a report. */
export function staticIcon(name) {
    function StaticIcon({ size = 24, strokeWidth = 2, color = 'currentColor', className, style, 'aria-label': label }) {
        return (
            <svg
                xmlns="http://www.w3.org/2000/svg"
                width={size}
                height={size}
                viewBox="0 0 24 24"
                fill="none"
                stroke={color}
                strokeWidth={strokeWidth}
                strokeLinecap="round"
                strokeLinejoin="round"
                className={className === undefined ? 'lucide' : `lucide ${className}`}
                style={style}
                role={label === undefined ? undefined : 'img'}
                aria-label={label}
                aria-hidden={label === undefined ? 'true' : undefined}
                dangerouslySetInnerHTML={{ __html: ICONS.get(name) ?? '' }}
            />
        );
    }

    StaticIcon.displayName = name;

    return StaticIcon;
}
