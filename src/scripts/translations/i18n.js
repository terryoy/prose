import { cookie } from '../storage/cookie';
import { Locales } from './constants';

const DEFAULT_LOCALE = 'en';

const getLang = (loc) => loc.split('-')[0];

const LocalesMap = Locales.reduce((lmap, l) => {
  return {
    ...lmap,
    [l.code]: l
  }
}, {});

/**
 * Locale accepts two formats:
 * - "<lang>", example: 'zh'
 * - "<lang>-<location>", example: 'zh-CN'
 */
export const I18n = new class {
  current = DEFAULT_LOCALE;

  loadedLocales = {};

  // init current locale
  initLanguage = async () => {
    // Set locale as global variable
    // window.locale.en = en;
    await this.setLocale(DEFAULT_LOCALE);

    // Set up translations
    const cookieLanguage = cookie.get('lang');

    // Check if the browsers language is supported
    if (cookieLanguage) {
      await this.setLocale(cookieLanguage);
    }
  }

  // set current locale
  setLocale = async (localeName) => {

    if (LocalesMap[localeName] !== undefined) {
      this.current = localeName;
    } else if (LocalesMap[getLang(localeName)] !== undefined) {
      this.current = getLang(localeName);
    }

    const { current } = this;
    if (!this.loadedLocales[current]) {
      // load locale if possible
      let load = LocalesMap[current] && LocalesMap[current].load;
      load = load || LocalesMap[getLang(current)];
      if (load) {
        const messageObject = await load();
        this.loadedLocales[current] = messageObject;
      }
    }
  }

  /**
   * I18n translate method
   *
   * @param  {string} s   i18n key
   * @param  {object} o   options(object)
   * @param  {string} loc locale
   * @return {string}     translated message
   */
  t = (s, o, locale) => {
    const loc = locale || this.current;

    // log message missing in console
    function logMissing() {
      const missing = `Missing ${loc} translation: ${s}`;
      if (typeof console !== 'undefined') console.error(missing);
      return missing;
    }

    const path = s.split('.').reverse();
    let rep = this.loadedLocales[loc]; // messages of lang for locale(loc)

    while (rep !== undefined && path.length) rep = rep[path.pop()];

    if (rep !== undefined) {
      if (o) {
        Object.keys(o).forEach((k) => {
          rep = rep.replace(`{${k}}`, o[k]);
        });
      }
      return rep;
    }

    if (loc !== 'en') {
      logMissing();
      return this.t(s, o, 'en');
    }

    if (o && 'default' in o) {
      return o.default;
    }

    return logMissing();
  }

  /**
   * Is Right-to-Left locale
   */
  isRTL = () => {
    return this.current === 'he-IL';
  }
}();
