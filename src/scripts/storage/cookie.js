// parse JSON string to object, without exception
const tryParse = (obj) => {
  try {
    return JSON.parse(obj);
  } catch (e) {
    // should be string, no need to parse
    // console.error(e);
  }
  return obj;
};

// stringify object to JSON, without exception
function tryStringify(obj) {
  if (typeof obj !== 'object' || !JSON.stringify) return obj;
  return JSON.stringify(obj);
}

/**
 * Wrapper for browser cookies
 */
export const cookie = new class {
  // set cookie
  set(name, value, expires, path, domain) {
    let pair = `${escape(name)}=${escape(tryStringify(value))}`;

    if (expires) {
      if (expires.constructor === Number) pair += `;max-age=${expires}`;
      else if (expires.constructor === String) pair += `;expires=${expires}`;
      else if (expires.constructor === Date) pair += `;expires=${expires.toUTCString()}`;
    }

    pair += `;path=${(path) || '/'}`;
    if (domain) pair += `;domain=${domain}`;

    document.cookie = pair;
    return this;
  }

  // set cookies with key/attr object
  setObject(object, expires, path, domain) {
    // for (const key in object) this.set(key, object[key], expires, path, domain);
    Object.keys(object).forEach((key) => {
      this.set(key, object[key], expires, path, domain);
    });
    return this;
  }

  // get cookie value
  get(name) {
    const obj = this.getObject();
    return obj[name];
  }

  // get cookie as an object
  getObject() {
    const pairs = document.cookie.split(/;\s?/i);
    const object = {};
    let pair;
    // eslint-disable-next-line no-restricted-syntax
    for (const i in pairs) {
      if (typeof pairs[i] === 'string') {
        pair = pairs[i].split('=');
        if (pair.length <= 1) {
          continue; // eslint-disable-line
        }
        object[unescape(pair[0])] = tryParse(unescape(pair[1]));
      }
    }

    return object;
  }

  // unset a cookie key
  unset(name) {
    const date = new Date(0);
    document.cookie = `${name}=; expires=${date.toUTCString()}`;
    return cookie;
  }

  // clear the cookie object
  clear() {
    const obj = this.getObject();
    // for (const key in obj) this.unset(key);
    Object.keys(obj).forEach((key) => {
      this.unset(key);
    });

    return obj;
  }
}();
