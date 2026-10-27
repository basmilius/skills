/* The build half: the same modules for Bun, the render of a report to the HTML the browser hydrates, and the markup of Lucide icons. */
import * as React from 'react';
import * as jsxRuntime from 'react/jsx-runtime';
import { renderToStaticMarkup, renderToString } from 'react-dom/server';
import { UIProvider } from '@adecore/ui';
import * as lucide from 'lucide-react';
import { registerIcons, staticIcon } from './icons.jsx';
import * as report from './report.jsx';

export { registerIcons, staticIcon };

export const modules = {
    'html-report': report,
    react: React,
    'react/jsx-runtime': jsxRuntime,
    /* Bun compiles the report's JSX for development; the production React has no `jsxDEV`, so it maps onto `jsx`. */
    'react/jsx-dev-runtime': { Fragment: jsxRuntime.Fragment, jsxDEV: (type, props, key) => jsxRuntime.jsx(type, props, key) }
};

/** The inside of a Lucide icon's `<svg>`, or null when no icon has that name. */
export function iconMarkup(name) {
    const Icon = lucide[name];

    if (Icon === undefined || name === 'createLucideIcon' || name === 'icons') {
        return null;
    }

    return renderToStaticMarkup(<Icon />).replace(/^<svg[^>]*>|<\/svg>$/g, '');
}

/** Sets the language before the report's module runs, so what it formats while creating its elements is in its language. */
export function setLanguage(lang) {
    report.i18n.changeLanguage(lang);
}

export function render(element) {
    return renderToString(
        <UIProvider i18n={report.i18n} formatSource={report.formatSource}>
            {element}
        </UIProvider>
    );
}
