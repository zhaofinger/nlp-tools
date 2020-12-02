import NLPTools from ".";

describe('NLPTools', () => {

  const testSentence = '急寻特朗普，男孩，于2018年11月27号11时在陕西省安康市汉滨区走失。丢失发型短发，...';
  const testResult = [
    {
      name: '陕西省安康市汉滨区',
      locations: [ '陕西省', '安康市', '汉滨区' ]
    }
  ];

  it(`NLPTools.getLocations(testSentence)`, () => {
    const result = NLPTools.getLocations(testSentence);
    expect(result).toEqual(expect.arrayContaining(testResult));
  });

});