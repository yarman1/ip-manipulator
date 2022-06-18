'use strict';

const NUMBER_CONSTANTS = {
  ipv4Length: 4,
  ipv6Length: 8,
  ipv4PartMax: 255,
  ipv4PartMin: 0,
  ipv6PartMax: 0xffff,
  ipv6PartMin: 0,
  allOctetsValues: 256,
};

const IP_PARTS = {
  v4Dec: '25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]|[0-9]',
  v4Hex: '(0x)?[a-f0-9]{1,2}',
  v6: '[0-9a-f]',
  v6ZoneId: '%[0-9a-z]{1,}',
};

const IP_FULL = {
  v4Dec: `((${IP_PARTS.v4Dec})\\.){3,3}(${IP_PARTS.v4Dec})`,
  v4Hex: `(${IP_PARTS.v4Hex}\\.){3,3}${IP_PARTS.v4Hex}`,
  v6Native: `(::)?(${IP_PARTS.v6}{1,4}::?){0,}(${IP_PARTS.v6}{1,4}){0,}:{0,2}`,
};

const IPV4_REG_EXPESSIONS = {
  v4Dec: `^${IP_FULL.v4Dec}$`,
  v4Hex: `^${IP_FULL.v4Hex}$`,
};

const IPV6_REG_EXPRESSIONS = {
  v6Native: `^${IP_FULL.v6Native}$`,
  v6LinkLoc: `^(fe80:((:(${IP_PARTS.v6}){1,4}){0,4}|:)(${IP_PARTS.v6ZoneId}))$`,
  v6Mapped: `^::ffff(:0{1,4}){0,1}:${IP_FULL.v4Dec}$`,
  v6Embedded: `^${IP_FULL.v6Native}${IP_FULL.v4Dec}$`,
};

const ipMain = {};

ipMain.IPv4 = (function() {
  class Ipv4 {
    constructor(parts) {
      const { ipv4PartMax, ipv4PartMin, ipv4Length } = NUMBER_CONSTANTS;
      if (parts.length !== ipv4Length) {
        throw new Error('ip-manipulator: invalid octets number');
      }
      for (const part of parts) {
        if (part < ipv4PartMin || part > ipv4PartMax) {
          throw new Error('ip-manipulator: invalid octet value');
        }
      }
      this.parts = parts;
      this.type = 'IPv4';
    }
    kind() {
      const mak = this.isValid('192.168.0.1');
      return mak;
    }
  }
  return Ipv4;
})();

ipMain.IPv4.isValid = function(ip) {
  if (!ip) return false;
  const { v4Dec, v4Hex } = IPV4_REG_EXPESSIONS;
  const ipv4Full = v4Dec + '|' + v4Hex;
  const ipv4RegExp = new RegExp(ipv4Full, 'i');
  return ipv4RegExp.test(ip);
};

ipMain.IPv4._parser = function(ip) {
  if (!this.isValid(ip)) {
    return null;
  }

  const { v4Hex } = IPV4_REG_EXPESSIONS;
  const hexRegExp = new RegExp(v4Hex, 'i');

  if (hexRegExp.test(ip)) {
    const parts = ip.split('.').map((part) => {
      if (part.includes('0x')) {
        return parseInt(part);
      } else {
        return parseInt('0x' + part);
      }
    });
    return parts;
  } else {
    const parts = ip.split('.').map((part) => parseInt(part));
    return parts;
  }
};

ipMain.IPv4._parse = function(ip) {
  const result = this._parser(ip);
  if (result) {
    return new this(result);
  }
  return null;
};

ipMain.IPv6 = (function() {
  class Ipv6 {
    constructor(parts, zoneId) {
      const { ipv6PartMax, ipv6PartMin, ipv6Length } = NUMBER_CONSTANTS;
      if (parts.length !== ipv6Length) {
        throw new Error('ip-manipulator: invalid parts number');
      }
      for (const part of parts) {
        if (part < ipv6PartMin || part > ipv6PartMax) {
          throw new Error('ip-manipulator: invalid part value');
        }
      }
      this.parts = parts;
      this.type = 'IPv6';
      if (zoneId) {
        this.zoneId = zoneId;
      }
    }
  }

  return Ipv6;
})();

ipMain.IPv6.isEmbedded = function(ip) {
  const lastPart = ip.split(':').pop();
  return lastPart !== lastPart.split('.')[0];
};

ipMain.IPv6.isValid = function(ip) {
  const { ipv6Length } = NUMBER_CONSTANTS;
  let ipLength = ip.split(':').length;
  if (this.isEmbedded(ip)) {
    ipLength += 1;
  }
  if (ipLength > ipv6Length) return false;
  if (ipLength < ipv6Length && ip.indexOf('::') === -1) {
    return false;
  }
  if (ip.indexOf('::') !== ip.lastIndexOf('::')) {
    return false;
  }
  const ipv6Full = Object.values(IPV6_REG_EXPRESSIONS);
  const ipv6RegExp = new RegExp(ipv6Full.join('|'), 'i');
  return ipv6RegExp.test(ip);
};

ipMain.IPv6._parser = function(ip) {
  if (!this.isValid(ip)) {
    return null;
  }
  const { ipv6Length, allOctetsValues } = NUMBER_CONSTANTS;
  const result = {
    parts: [],
    zoneId: null,
  };
  const embedded = this.isEmbedded(ip) ? 1 : 0;

  const parts = ip.split(':');
  if (parts.indexOf('') !== parts.lastIndexOf('')) {
    parts.splice(parts.indexOf(''), 1);
  }
  for (const part of parts) {
    if (!part) {
      for (let i = 0; i <= ipv6Length - parts.length - embedded; i++) {
        result.parts.push(0);
      }
    } else if (part.includes('%')) {
      const lastPart = part.split('%');
      if (lastPart[0]) {
        result.parts.push(parseInt('0x' + lastPart[0]));
      } else {
        result.parts.push(0);
      }
      result.zoneId = lastPart[1];
    } else if (this.isEmbedded(part)) {
      const lastPart = part.split('.').map((octet) => parseInt(octet));
      for (let i = 0; i < lastPart.length; i += 2) {
        const v6Part = lastPart[i] * allOctetsValues + lastPart[i + 1];
        result.parts.push(v6Part);
      }
    } else {
      result.parts.push(parseInt('0x' + part));
    }
  }

  return result;
};

ipMain.IPv6._parse = function(ip) {
  const result = this._parser(ip);
  if (result) {
    return new this(...Object.values(result));
  }
  return null;
};

ipMain.parse = function(ip) {
  const ipv4Result = this.IPv4._parse(ip);
  const ipv6Result = this.IPv6._parse(ip);

  if (ipv4Result) {
    return ipv4Result;
  } else if (ipv6Result) {
    return ipv6Result;
  }

  throw new Error('ip-manipulator: invalid ip address');
};

module.exports = ipMain;
