'use strict';

const ipMain = require('../ip-manipulator');
const assert = require('assert').strict;

// Tests of validation system.
// It can validate: decimal and hexadecimal(isn't case sensitive) IPv4 addresses
// IPv6: native, link local, mapped, IPv4 embedded variants

const tester = function(data, testOp, resultArray, obj, funcName, property) {
  for (const test of data) {
    const [par, expected, name] = test;
    let result = null;
    if (typeof obj[funcName](par)[property] === 'function') {
      result = obj[funcName](par)[property]();
    } else {
      result = property ? obj[funcName](par)[property] : obj[funcName](par);
    }

    try {
      assert[testOp](result, expected, `Error in test "${name}"`);
    } catch (err) {
      const { message, operator } = err;
      resultArray.push({ message, par, expected, result, operator });
    }
  }
};

{
  console.log('Validation tests');
  const results = [];

  const validationIpv4Tests = [
    ['192.168.0.1', true, 'Valid decimal IPv4 address'],
    ['256.255.255.255', false, 'Invalid decimal IPv4 address'],
    ['c0.A8.0.1', true, 'Valid hexadecimal IPv4 address'],
    ['0xc0.0xA8.0x0.0x1', true, 'Another example of valid hex IPv4 address'],
    ['ac.10.8e.fff', false, 'Invalid hexadecimal IPv4 address'],
  ];

  tester(validationIpv4Tests, 'strictEqual', results, ipMain.IPv4, 'isValid');

  const validationIpv6Tests = [
    ['2001:0db8::8A2e:07a0:765d', true, 'Valid IPv6 native address'],
    ['fd3f::c126:9e70:532f::', false, 'Invalid IPv6 native address'],
    ['fddf:ebc3:cfcff::65ce:f32a', false, 'Another bad IPv6 native address'],
    ['fe80::ce80:ff88%eth2', true, 'Link local IPv6 address'],
    ['::ffff:192.168.0.1', true, 'Mapped IPv6 address'],
    ['64:ff96:1:a345:c70:2cfa:192.168.0.1', true, 'IPv4 embedded IPv6 address'],
  ];

  tester(validationIpv6Tests, 'strictEqual', results, ipMain.IPv6, 'isValid');

  console.table(results);

}

// Tests of parsing system
// It correctly parses IPv4 addresses as well as various IPv6 addresses

{
  console.log(' ');
  console.log('Parsing tests');

  const results = [];

  const parsingTests = [
    ['192.168.0.1',
      [192, 168, 0, 1],
      'Decimal IPv4 address'],
    ['c0.A8.0.1',
      [192, 168, 0, 1],
      'Hexadecimal IPv4 address'],
    ['0xc0.0xA8.0x0.0x1',
      [192, 168, 0, 1],
      'Another hex IPv4 address'],
    ['2001:0db8::8A2e:07a0:765d',
      [8193, 3512, 0, 0, 0, 35374, 1952, 30301],
      'IPv6 native address'],
    ['fe80::ce80:ff88%eth2',
      [65152, 0, 0, 0, 0, 0, 52864, 65416],
      'Link local IPv6 address'],
    ['::ffff:192.168.0.1',
      [0, 0, 0, 0, 0, 65535, 49320, 1],
      'Mapped IPv6 address'],
    ['64:ff96:1:a345:c70:2cfa:192.168.0.1',
      [100, 65430, 1, 41797, 3184, 11514, 49320, 1],
      'IPv4 embedded IPv6 address'],
  ];

  tester(parsingTests, 'deepEqual', results, ipMain, 'parse', 'parts');

  console.table(results);
}

// Tests of serialization system
// It correctly serializes ip addresses into string
// IPv4 methods: toString(), toHexString()
// IPv6 methods: toString(), toNormalizedString(), toEmbeddedString()
// Pay attention that toEmbeddedString() won't work with link local addresses


{
  console.log(' ');
  console.log('Serialization tests');

  const results = [];

  const ipv4DecTests = [
    ['192.168.0.1',
      '192.168.0.1',
      'Serialization to decimal IPv4 address'],
  ];

  const ipv4HexTests = [
    ['192.168.0.1',
      'c0.a8.0.1',
      'Serialization to hexadecimal IPv4 address'],
  ];

  const ipv6NatTests = [
    ['2041:0000:140F:0000:0000:0000:875B:131B',
      '2041:0:140f::875b:131b',
      'Serialization to short IPv6 native address'],
    ['fe80::ce80:ff88%eth2',
      'fe80::ce80:ff88%eth2',
      'Serialization to short link local IPv6 address'],
  ];

  const ipv6NatNormTests = [
    ['2041:0000:140F::875B:131B',
      '2041:0000:140f:0000:0000:0000:875b:131b',
      'Serialization to normalized IPv6 native address'],
    ['fe80::ce80:ff88%eth2',
      'fe80:0000:0000:0000:0000:0000:ce80:ff88%eth2',
      'Serialization to normalized link local IPv6 address'],
  ];

  const ipv6EmbeddedTests = [
    ['2041:0000:140F:0000:0000:0000:875B:131B',
      '2041:0:140f::135.91.19.27',
      'Serialization to IPv4 embedded IPv6 address'],
  ];

  tester(ipv4DecTests, 'strictEqual', results, ipMain, 'parse', 'toString');
  tester(ipv4HexTests, 'strictEqual', results, ipMain, 'parse', 'toHexString');
  tester(ipv6NatTests, 'strictEqual', results, ipMain, 'parse', 'toString');
  tester(ipv6NatNormTests,
    'strictEqual',
    results,
    ipMain,
    'parse',
    'toNormalizedString');
  tester(ipv6EmbeddedTests,
    'strictEqual',
    results,
    ipMain,
    'parse',
    'toEmbeddedString');

  console.table(results);
}
