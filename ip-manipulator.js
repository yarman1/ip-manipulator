'use strict';

const NUMBER_CONSTANTS = {
  ipv4Length: 4,
};

const REG_EXPESSIONS = {
  ipv4Hex: '^((0x)?[a-f0-9]{1,2}\\.){3,3}((0x)?[a-f0-9]{1,2})$|',
  ipv4DecPart: '25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]|[0-9]',
  ipv6: /^[0-9a-f]{1,4}$/i,
};

const ipv4 = {};
const ipv6 = {};

ipv4.isValid = function(ip) {
  if (!ip) return false;
  const { ipv4DecPart, ipv4Hex } = REG_EXPESSIONS;
  const ipv4Dec = '^((' + ipv4DecPart + ')\\.){3,3}(' + ipv4DecPart + ')$';
  const regExp = new RegExp(ipv4Hex + ipv4Dec, 'i');
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
