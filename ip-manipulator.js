'use strict';

const NUMBER_CONSTANTS = {
  ipv4Length: 4,
  ipv6Length: 8,
  ipv4PartMax: 255,
  ipv4PartMin: 0,
};

const IP_PARTS = {
  v4Dec: '25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]|[0-9]',
  v4Hex: '(0x)?[a-f0-9]{1,2}',
  v6: '[0-9a-fA-F]',
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
  v6LinkLoc: `^fe80:((:${IP_PARTS.v6}){1,4}){0,4}|(:)${IP_PARTS.v6ZoneId}$`,
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

const ipv6 = {};

ipMain.IPv4.isValid = function(ip) {
  if (!ip) return false;
  const { v4Dec, v4Hex } = IPV4_REG_EXPESSIONS;
  const ipv4Full = v4Dec + '|' + v4Hex;
  const ipv4RegExp = new RegExp(ipv4Full, 'i');
  return ipv4RegExp.test(ip);
};

ipv6.isEmbedded = function(ip) {
  const lastPart = ip.split(':').pop();
  return lastPart !== lastPart.split('.')[0];
};

ipv6.isValid = function(ip) {
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

module.exports = ipMain;
