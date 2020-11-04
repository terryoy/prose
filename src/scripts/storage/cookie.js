function tryParse(obj) {
  try {
    return JSON.parse(obj);
  } catch(e) {
    // should be string, no need to parse
    // console.error(e);
  }

  return obj;
}

function tryStringify(obj) {
  if (typeof obj !== 'object' || !JSON.stringify) return obj;
  return JSON.stringify(obj);
}

export const cookie = {
  set: function(name, value, expires, path, domain) {
    var pair = escape(name) + '=' + escape(tryStringify(value));

    if (expires) {
      if (expires.constructor === Number) pair += ';max-age=' + expires;
      else if (expires.constructor === String) pair += ';expires=' + expires;
      else if (expires.constructor === Date)  pair += ';expires=' + expires.toUTCString();
    }

    pair += ';path=' + ((path) ? path : '/');
    if(domain) pair += ';domain=' + domain;

    document.cookie = pair;
    return this;
  },

  setObject: function(object, expires, path, domain) {
    for(var key in object) this.set(key, object[key], expires, path, domain);
    return this;
  },

  get: function(name) {
    var obj = this.getObject();
    return obj[name];
  },

  getObject: function() {
    var pairs = document.cookie.split(/;\s?/i);
    var object = {};
    var pair;

    for (var i in pairs) {
      if (typeof pairs[i] === 'string') {
        pair = pairs[i].split('=');
        if (pair.length <= 1) continue;
        object[unescape(pair[0])] = tryParse(unescape(pair[1]));
      }
    }

    return object;
  },

  unset: function(name) {
    var date = new Date(0);
    document.cookie = name + '=; expires=' + date.toUTCString();
    return cookie;
  },

  clear: function() {
    var obj = this.getObject();
    for(var key in obj) this.unset(key);
    return obj;
  }
};
