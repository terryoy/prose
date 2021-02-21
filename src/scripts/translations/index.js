import bn from './locales/bn.json';
import ca from './locales/ca.json';
import da from './locales/da.json';
import de from './locales/de.json';
import en from './locales/en.json';
import es from './locales/es.json';
import eu from './locales/eu.json';
import fr from './locales/fr.json';
import he_IL from './locales/he-IL.json';
import it from './locales/it.json';
import ja from './locales/ja.json';
import ko from './locales/ko.json';
import nl from './locales/nl.json';
import pl from './locales/pl.json';
import pt_BR from './locales/pt-BR.json';
import ro from './locales/ro.json';
import ru from './locales/ru.json';
import sv from './locales/sv.json';
import tr from './locales/tr.json';
import vi from './locales/vi.json';
import zh_CN from './locales/zh-CN.json';
import zh from './locales/zh.json';

// all lang entries presented
const I18nMessages = {
  bn,
  ca,
  da,
  de,
  en,
  es,
  eu,
  fr,
  "he-IL": he_IL,
  it,
  ja,
  ko,
  nl,
  pl,
  "pt-BR": pt_BR,
  ro,
  ru,
  sv,
  tr,
  vi,
  "zh-CN": zh_CN,
  zh
};


export const locale = {
  _current: 'en',
  ...I18nMessages
};


locale.current = function(_) {
  if (!arguments.length) return locale._current;
  if (locale[_] !== undefined) locale._current = _;
  else if (locale[_.split('-')[0]]) locale._current = _.split('-')[0];
  return locale;
};

/**
 * I18n translate method.
 *
 * @param  {[type]} s   string key
 * @param  {[type]} o   options(object)
 * @param  {[type]} loc locale
 * @return {[type]}     [description]
 */
export const t = (s, o, loc) => {
  if (!arguments.length) return;
  loc = loc || locale._current;

  function missing() {
    var missing = 'Missing ' + loc + ' translation: ' + s;
    if (typeof console !== 'undefined') console.error(missing);
    return missing;
  }

  var path = s.split('.').reverse(),
    rep = locale[loc]; // messages of lang for locale(loc)

  while (rep !== undefined && path.length) rep = rep[path.pop()];

  if (rep !== undefined) {
    if (o) for (var k in o) rep = rep.replace('{' + k + '}', o[k]);
    return rep;
  } else {

    if (loc !== 'en') {
      missing();
      return t(s, o, 'en');
    }

    if (o && 'default' in o) {
      return o['default'];
    }

    return missing();
  }
};

window.locale = locale;
window.t = t;
