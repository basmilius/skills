/* The browser half: the modules a built report imports, and the hydration of the HTML the build rendered. */
import * as React from 'react';
import * as jsxRuntime from 'react/jsx-runtime';
import { hydrateRoot } from 'react-dom/client';
import { UIProvider } from '@adecore/ui';
import { registerIcons, staticIcon } from './icons.jsx';
import * as report from './report.jsx';

/* Before the report's module runs, so what it formats while creating its elements is in its language. */
report.i18n.changeLanguage(document.documentElement.lang || 'nl');

globalThis.HtmlReport = {
    modules: {
        'html-report': report,
        react: React,
        'react/jsx-runtime': jsxRuntime
    },
    registerIcons,
    staticIcon,
    hydrate(element) {
        hydrateRoot(
            document.getElementById('report'),
            <UIProvider i18n={report.i18n} formatSource={report.formatSource}>
                {element}
            </UIProvider>
        );
    }
};
