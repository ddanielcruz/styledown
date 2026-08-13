import type { CodeTheme } from '@/lib/styles';

import atomOneDark from 'highlight.js/styles/atom-one-dark.min.css?inline';
import atomOneLight from 'highlight.js/styles/atom-one-light.min.css?inline';
import githubDark from 'highlight.js/styles/github-dark.min.css?inline';
import githubLight from 'highlight.js/styles/github.min.css?inline';
import nightOwl from 'highlight.js/styles/night-owl.min.css?inline';
import nord from 'highlight.js/styles/nord.min.css?inline';

/**
 * The six themes as text, not as six stylesheets.
 *
 * Every one of them defines `.hljs`, so only one may be in the document at a time — which
 * rules out the obvious approach of linking the chosen one. React keys hoisted stylesheets
 * by `href` and never takes them out again, so nord → github-dark → nord would leave the
 * first nord element sitting earlier in the head, losing to github-dark for the rest of
 * the session. A string swapped into a single `<style>` has no order to get wrong.
 *
 * All six minify to 8.4KB together, so carrying them in the bundle costs less than the
 * request that would otherwise fetch one — and nothing has to be waited for before a
 * print. The HTML exporter inlines the same string.
 */
export const CODE_THEME_CSS: Record<CodeTheme, string> = {
  'github-light': githubLight,
  'github-dark': githubDark,
  'atom-one-light': atomOneLight,
  'atom-one-dark': atomOneDark,
  nord,
  'night-owl': nightOwl,
};
