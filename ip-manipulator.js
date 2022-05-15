'use strict';

const REG_EXPESSIONS = {
  ipv4Hex: /^(0x)?[a-f0-9]{1,2}$/i,
  ipv4Dec: /^25[0-5]$|^2[0-4][0-9]$|^[01]?[0-9][0-9]$|^[0-9]$/,
};

const ipv4 = {};

ipv4.isValid = function(ip) {
  const parts = ip.split('.');
  const ipv4Dec = REG_EXPESSIONS.ipv4Dec;
  const ipv4Hex = REG_EXPESSIONS.ipv4Hex;
  const res = [];
  for (const part of parts) {
    if (!ipv4Dec.test(part) && !ipv4Hex.test(part)) {
      return false;
    }
  }
  return true;
};
