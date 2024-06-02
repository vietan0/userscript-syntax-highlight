// ==UserScript==
// @name         GitHub Fill Syntax Highlight
// @namespace    https://github.com/vietan0/userscript-syntax-highlight
// @version      2024-05-17
// @description  Add syntax highlight to code blocks without one
// @author       vietan0
// @match        https://*.github.com/*
// @icon         https://shiki.style/logo.svg
// @grant        GM.addElement
// @run-at       document-start
// ==/UserScript==

async function main() {
  'use strict';
  console.log('main() start');

  const { codeToHtml, bundledLanguages } = await import(
    'https://esm.sh/shiki@1.0.0'
  );

  GM.addElement('script', {
    src: 'https://cdn.jsdelivr.net/npm/guesslang-js@latest/dist/lib/guesslang.min.js',
    type: 'text/javascript',
  });

  window.addEventListener('load', async () => {
    console.log('window load event');
    const guessLang = new GuessLang();

    /**
     * Change `<pre>`'s html to be syntax highlighted by Shiki
     * @param {string} lang The language (specified or guessed) of the code block
     * @param {HTMLElement} pre
     * @returns {undefined}
     */
    async function modifyHtml(lang, pre) {
      if (!(lang in bundledLanguages)) {
        console.log(
          `Shiki doesn't recognize: ${lang} in ${pre}, fallback to 'plain'`
        );
      }

      const html = await codeToHtml(pre.innerText, {
        lang: lang in bundledLanguages ? lang : 'plain',
        theme: 'github-dark',
      });

      pre.outerHTML = html;
    }

    /**
     * If it has a guess, pass that guess to `modifyHtml` and return true.
     *
     * If there's no guess, return false.
     * @param {HTMLElement} pre
     * @returns {boolean}
     */
    async function guessAndModify(pre) {
      const guesses = await guessLang.runModel(pre.innerText);
      if (guesses.length === 0) {
        console.log("Don't have a good guess for", pre);
        return false;
      }

      const guessedLang = guesses[0].languageId;
      modifyHtml(guessedLang, pre);
      return true;
    }

    // find <pre> whose parent is a <div> without class "highlight"
    for (const div of document.querySelectorAll('div:has(> pre)')) {
      if (!div.classList.contains('highlight')) {
        guessAndModify(div.querySelector('pre'));
      }
    }
  });
}

main();
