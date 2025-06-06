import { computeSkills } from '../src/utils/skills';

describe('computeSkills', () => {
  it('calculates averages correctly', () => {
    const character = { esprit: 4, coeur: 6, corps: 8 };
    const skills = computeSkills(character);
    expect(skills.bluff).toBe(5); // avg(4,6)
    expect(skills.decorum).toBe(7); // avg(6,8)
    expect(skills.bagarre).toBe(6); // avg(8,4)
  });

  it('returns null when character is null', () => {
    expect(computeSkills(null)).toBeNull();
  });

  it('rounds values when averaging', () => {
    const character = { esprit: 5, coeur: 4, corps: 7 };
    const skills = computeSkills(character);
    // avg(5,4) = 4.5 -> 5
    expect(skills.bluff).toBe(5);
    expect(skills.decorum).toBe(6); // avg(4,7) -> 5.5 -> 6
  });
});
