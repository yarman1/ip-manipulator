'use strict';

const NUMBER_CONSTANTS = {
  ipv4Length: 4,
};

const REG_EXPESSIONS = {
  ipv4Hex: /^(0x)?[a-f0-9]{1,2}$/i,
  ipv4Dec: /^25[0-5]$|^2[0-4][0-9]$|^[01]?[0-9][0-9]$|^[0-9]$/,
};

const ipv4 = {};

ipv4.isValid = function(ip) {
  const parts = ip.split('.');
  const { ipv4Length } = NUMBER_CONSTANTS;
  if (parts.length > ipv4Length || parts.length < 1) {
    return false;
  }
  const { ipv4Dec } = REG_EXPESSIONS;
  const { ipv4Hex } = REG_EXPESSIONS;
  const res = [];
  for (const part of parts) {
    if (!ipv4Dec.test(part) && !ipv4Hex.test(part)) {
      return false;
    }
  }
  return true;
};
