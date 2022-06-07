'use strict';

const NUMBER_CONSTANTS = {
  ipv4Length: 4,
  ipv6Length: 8,
};

const V4_DEC_PART = '25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]|[0-9]';
const V6_PART = '[0-9a-fA-F]';

const IP_PARTS = {
  v4HexPart: '((0x)?[a-f0-9]{1,2}',
  v4DecFull: `((${V4_DEC_PART})\\.){3,3}(${V4_DEC_PART})`,
  v6Part: '[0-9a-fA-F]',
  v6ZoneId: '%[0-9a-z]{1,}',
  v6Native: `(::)?(${V6_PART}{1,4}::?){0,}(${V6_PART}{1,4}){0,}:{0,2}`,
};

const IPV4_REG_EXPESSIONS = {
  v4Dec: `^${IP_PARTS.v4DecFull}$`,
  v4Hex: `^${IP_PARTS.v4HexPart}\\.){3,3}${IP_PARTS.v4HexPart})$`,
};

const IPV6_REG_EXPRESSIONS = {
  v6NativeFull: `^${IP_PARTS.v6Native}$`,
  v6LinkLoc: `^fe80:((:${IP_PARTS.v6Part}){1,4}){0,4}|(:)${IP_PARTS.v6ZoneId}$`,
  v6Mapped: `^::ffff(:0{1,4}){0,1}:${IP_PARTS.v4DecFull}$`,
  v6Embedded: `^${IP_PARTS.v6Native}${IP_PARTS.v4DecFull}$`,
};

const ipv4 = {};
const ipv6 = {};

ipv4.isValid = function(ip) {
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
  const ipv6Full = [];
  const keys = Object.keys(IPV6_REG_EXPRESSIONS);
  for (const key of keys) {
    ipv6Full.push(IPV6_REG_EXPRESSIONS[key]);
  }
  const ipv6RegExp = new RegExp(ipv6Full.join('|'), 'i');
  return ipv6RegExp.test(ip);
};
