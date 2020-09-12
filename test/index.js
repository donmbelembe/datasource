import { assert } from 'chai';

function fake() {
  return 'No test yet';
}

describe('Blank test', () => {
  it('should add test for the project', () => {
    const expectedVal = 'No test yet';
    assert(fake() === expectedVal, 'Default not awesome :(');
  });
});
