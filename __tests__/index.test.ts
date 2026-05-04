import main from '../src/index';

describe('mihawk', () => {
  // test case
  test('mihawk exec without throw error.', () => {
    expect(typeof main).toBe('function');
  });
});
