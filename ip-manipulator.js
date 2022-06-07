'use strict';

const NUMBER_CONSTANTS = {
  ipv4Length: 4,
};

const IP_PARTS = {
  v4HexPart: '((0x)?[a-f0-9]{1,2}',
  v4DecPart: '25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]|[0-9]',
  v4DecFull: `((${this.v4DecPart})\\.){3,3}(${this.v4DecPart})`,
  v6Part: '[0-9a-fA-F]',
  v6ZoneId: '%[0-9a-z]{1,}',
};

// v6Native - must be reviewed

const IP_REG_EXPESSIONS = {
  v4Dec: `^${IP_PARTS.v4DecFull}$`,
  v4Hex: `^${IP_PARTS.v4HexPart}\\.){3,3}${IP_PARTS.v4HexPart})$`,
  v6Native: `^(::)?(${IP_PARTS.v6Part}{1,4}::?){0,}(${IP_PARTS.v6Part}{1,4})){0,}(::)?$`,
  v6LinkLocal: `^fe80:((${IP_PARTS.v6Part}{0,4}){0,4})${IP_PARTS.v6ZoneId}$`,
  v6Mapped: `^::ffff(:0{1,4}){0,1}:${IP_PARTS.v4DecFull}$`,
  v6Embed: `^(${IP_PARTS.v6Part}:){1,4}:${IP_PARTS.v4DecFull}$`,
};

const ipv4 = {};
const ipv6 = {};

ipv4.isValid = function(ip) {
  if (!ip) return false;
  const { ipv4DecPart, ipv4Hex } = REG_EXPESSIONS;
  const ipv4Dec = '^((' + ipv4DecPart + ')\\.){3,3}(' + ipv4DecPart + ')$';
  const regExp = new RegExp(ipv4Hex + '|' + ipv4Dec, 'i');
  return regExp.test(ip);
};

ipv6.isValid = function(ip) {
  const parts = ip.split(':');
  const { ipv6 } = REG_EXPESSIONS;
  for (const part of parts) {
    if (!part) continue;
    if (!ipv6.test(part)) return false;
  }
  return true;
};
