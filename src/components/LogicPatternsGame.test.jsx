import { LOGIC_PATTERN_BANK } from './LogicPatternsGame';

test('logic patterns load from JSON and use the correct Macedonian alphabet sequence', () => {
  const lettersPattern = LOGIC_PATTERN_BANK.find((item) => item.sourceTaskId === 34);

  expect(lettersPattern).toMatchObject({
    sequence: ['А', 'Б', 'В', '?'],
    correctOption: 'Г',
  });
  expect(lettersPattern.options).toContain('Г');
  expect(lettersPattern.explanation).toMatch(/А, Б, В, Г/);
  expect(LOGIC_PATTERN_BANK.length).toBeGreaterThanOrEqual(37);
});
