export function computeSkills(character) {
  if (!character) return null;
  const avg = (a, b) => Math.round((a + b) / 2);
  return {
    bluff: avg(character.esprit, character.coeur),
    farce: avg(character.esprit, character.coeur),
    tactique: avg(character.esprit, character.coeur),
    rumeur: avg(character.esprit, character.coeur),
    decorum: avg(character.coeur, character.corps),
    discretion: avg(character.coeur, character.corps),
    persuasion: avg(character.coeur, character.corps),
    romance: avg(character.coeur, character.corps),
    bagarre: avg(character.corps, character.esprit),
    endurance: avg(character.corps, character.esprit),
    perception: avg(character.corps, character.esprit),
    precision: avg(character.corps, character.esprit),
  };
}
