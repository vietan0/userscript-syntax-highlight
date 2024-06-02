// ==UserScript==
// @name         Syntax Highlight
// @namespace    https://github.com/vietan0/userscript-syntax-highlight
// @version      2024-05-17
// @description  Change/add code blocks' syntax highlight theme
// @author       vietan0
// @match        https://*.stackoverflow.com/*
// @match        https://*.stackexchange.com/*
// @match        https://*.reddit.com/r/*
// @icon         https://shiki.style/logo.svg
// @grant        GM.addElement
// @run-at       document-start
// ==/UserScript==

async function main() {
  'use strict';
  console.info('main() start');

  const { codeToHtml, bundledLanguages } = await import(
    'https://esm.sh/shiki@1.0.0'
  );

  GM.addElement('script', {
    src: 'https://cdn.jsdelivr.net/npm/guesslang-js@latest/dist/lib/guesslang.min.js',
    type: 'text/javascript',
  });

  window.addEventListener('load', async () => {
    console.info('window load event');
    const guessLang = new GuessLang();

    /**
     * Change `<pre>`'s html to be syntax highlighted by Shiki
     * @param {string} lang The language (specified or guessed) of the code block
     * @param {HTMLElement} pre
     * @returns {undefined}
     */
    async function modifyHtml(lang, pre) {
      if (!(lang in bundledLanguages)) {
        console.log(`Shiki doesn't recognize: ${lang}, fallback to 'plain'`);
      }

      const url = window.location.href;

      const html = await codeToHtml(pre.innerText, {
        lang: lang in bundledLanguages ? lang : 'plain',
        theme: /stackexchange/.test(url) ? 'github-light' : 'dark-plus',
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
      if (guesses.length === 0) return false;

      const guessedLang = guesses[0].languageId;
      modifyHtml(guessedLang, pre);
      return true;
    }

    for (const pre of document.querySelectorAll('pre')) {
      if (pre.classList.length === 0) guessAndModify(pre);
      else {
        for (const className of pre.classList.values()) {
          const regex = /(?<=lang-)[\w-]+/g; // find js, cpp, html in lang-js, lang-cpp, lang-html
          const langExists = className.match(regex);

          if (langExists) {
            const [lang] = langExists;
            if (lang === 'none') guessAndModify(pre);
            else modifyHtml(lang, pre);
          } else {
            // no "lang-xxx" class but maybe it has "default" class
            guessAndModify(pre);
          }
        }
      }
    }
  });
}

main();
