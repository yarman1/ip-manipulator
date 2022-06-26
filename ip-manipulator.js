'use strict';

const NUMBER_CONSTANTS = {
  ipv4Length: 4,
  ipv6Length: 8,
  ipv4PartMax: 255,
  ipv4PartMin: 0,
  ipv6PartMax: 0xffff,
  ipv6PartMin: 0,
  allOctetsValues: 256,
  decBase: 10,
  hexBase: 16,
  binBase: 2,
  ipv6PartBitLength: 16,
  ipv4PartBitLength: 8,
  ipv6PartNormalLength: 4,
};

const ERROR_MESSAGES = {
  prefix: 'ip-manipulator:',
  partsNum: ' invalid parts number',
  partValue: ' invalid part value',
  linkLocEmbed: ' can\'t serialize embedded version of this address',
  invalidIp: ' invalid ip address',
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

ipMain.IPv4 = class {
  constructor(parts) {
    const { ipv4PartMax, ipv4PartMin, ipv4Length } = NUMBER_CONSTANTS;
    if (parts.length !== ipv4Length) {
      const { prefix, partsNum } = ERROR_MESSAGES;
      throw new Error(prefix + partsNum);
    }
    for (const part of parts) {
      if (part < ipv4PartMin || part > ipv4PartMax) {
        const { prefix, partValue } = ERROR_MESSAGES;
        throw new Error(prefix + partValue);
      }
    }
    this.parts = parts;
    this.type = 'IPv4';
  }

  _normalize(length, normalLength, string) {
    for (let i = 0; i < normalLength - length; i++) {
      string = '0' + string;
    }
    return string;
  }

  kind() {
    return this.type;
  }

  prefixFromMask() {
    const { binBase, ipv4PartBitLength } = NUMBER_CONSTANTS;
    const maskBin = this.parts.map((part) => {
      part = part.toString(binBase);
      if (part.length < ipv4PartBitLength) {
        part = this._normalize(part.length, ipv4PartBitLength, part);
      }
      return part;
    }).join('');

    let counter = 0;
    if (!maskBin.includes('1')) {
      return counter;
    }

    if (maskBin[0] !== '1') {
      return null;
    }

    const maskBinArray = maskBin.split('0').filter((element) => !!element);
    if (maskBinArray.length > 1) {
      return null;
    }

    for (const char of maskBinArray[0]) {
      if (char !== '1') break;
      counter++;
    }
    return counter;
  }

  _serializator(base) {
    const res = [];
    for (const part of this.parts) {
      res.push(part.toString(base));
    }
    return res.join('.');
  }

  toString() {
    const { decBase } = NUMBER_CONSTANTS;
    return this._serializator(decBase);
  }

  toHexString() {
    const { hexBase } = NUMBER_CONSTANTS;
    return this._serializator(hexBase);
  }
};

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

ipMain.IPv6 = class {
  constructor(parts, zoneId) {
    const { ipv6PartMax, ipv6PartMin, ipv6Length } = NUMBER_CONSTANTS;
    if (parts.length !== ipv6Length) {
      const { prefix, partsNum } = ERROR_MESSAGES;
      throw new Error(prefix + partsNum);
    }
    for (const part of parts) {
      if (part < ipv6PartMin || part > ipv6PartMax) {
        const { prefix, partValue } = ERROR_MESSAGES;
        throw new Error(prefix + partValue);
      }
    }
    this.parts = parts;
    this.type = 'IPv6';
    if (zoneId) {
      this.zoneId = zoneId;
    }
  }

  kind() {
    return this.type;
  }

  _modifyShorteningState(state) {
    if (state.length > state.cacheMax[0]) {
      const { firstIndex, length } = state;
      state.cacheMax = [length, firstIndex];
    }
  }

  _serializator(nativePartsLength) {
    const { hexBase, ipv6Length } = NUMBER_CONSTANTS;
    if (!nativePartsLength) {
      nativePartsLength = ipv6Length;
    }
    let parts = [];
    if (nativePartsLength < ipv6Length) {
      parts = this.parts.slice(0, nativePartsLength);
    } else {
      parts = this.parts;
    }

    const shorteningState = {
      firstIndex: 0,
      length: 0,
      process: false,
      cacheMax: [0, 0],
    };

    const stringArr = parts.map((part, index) => {
      if (part === 0) {
        if (!shorteningState.process) {
          shorteningState.process = true;
          shorteningState.firstIndex = index;
          shorteningState.length = 1;
        } else {
          shorteningState.length++;
        }
        if (index === nativePartsLength - 1) {
          this._modifyShorteningState(shorteningState);
        }
      } else if (shorteningState.process) {
        shorteningState.process = false;
        this._modifyShorteningState(shorteningState);
      }
      return part.toString(hexBase);
    });

    const [length, firstIndex] = shorteningState.cacheMax;
    if (firstIndex + length === stringArr.length || firstIndex === 0) {
      stringArr.splice(firstIndex, length, ':');
    } else {
      stringArr.splice(firstIndex, length, '');
    }

    let res = stringArr.join(':');

    if (this.zoneId) res += `%${this.zoneId}`;

    return res;
  }

  _normalize(length, normalLength, string) {
    for (let i = 0; i < normalLength - length; i++) {
      string = '0' + string;
    }
    return string;
  }

  toString() {
    const res = this._serializator();
    return res;
  }

  toNormalizedString() {
    const { hexBase, ipv6PartNormalLength } = NUMBER_CONSTANTS;

    const stringArr = this.parts.map((part) => {
      let result = part.toString(hexBase);
      const partLength = result.length;
      if (partLength < ipv6PartNormalLength) {
        result = this._normalize(partLength, ipv6PartNormalLength, result);
      }
      return result;
    });

    let res = stringArr.join(':');
    if (this.zoneId) res += `%${this.zoneId}`;

    return res;
  }

  toEmbeddedString() {
    if (this.zoneId) {
      const { prefix, linkLocEmbed } = ERROR_MESSAGES;
      throw new Error(prefix + linkLocEmbed);
    }
    const { binBase, ipv6PartBitLength, ipv6Length } = NUMBER_CONSTANTS;
    const nativeSegment = this._serializator(ipv6Length - 2);

    const ipv4SegmentArray = this.parts.slice(-2).map((part) => {
      part = part.toString(binBase);
      const partBinLength = part.length;
      if (partBinLength < ipv6PartBitLength) {
        part = this._normalize(partBinLength, ipv6PartBitLength, part);
      }

      const bitArray = part.split('');
      const half = bitArray.length / 2;

      const firstHalf = bitArray.splice(0, half).join('');
      const secondHalf = bitArray.splice(-half).join('');

      return [firstHalf, secondHalf];
    });

    const ipv4Segment = ipv4SegmentArray.flat()
      .map((part) => parseInt(part, binBase))
      .join('.');

    let res = nativeSegment;

    if (nativeSegment[nativeSegment.length - 1] !== ':') {
      res += ':' + ipv4Segment;
    } else {
      res += ipv4Segment;
    }

    return res;
  }
};

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
  if (!this.isValid(ip)) return null;

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
  }
  if (ipv6Result) {
    return ipv6Result;
  }

  const { prefix, invalidIp } = ERROR_MESSAGES;
  throw new Error(prefix + invalidIp);
};


module.exports = ipMain;
