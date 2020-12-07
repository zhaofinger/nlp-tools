import { Address } from './';

describe('NLPTools', () => {

  describe('Address', () => {

    const testSentence = '急寻特朗普，男孩，于2018年11月27号11时在陕西省安康市汉滨区走失。丢失发型短发，...';

    it(`Address.extract(testSentence, false)`, async () => {
      await Address.init();
      const result = Address.extract(testSentence, false);
      expect(result).toEqual(expect.arrayContaining([
        {
          name: '陕西省安康市汉滨区',
          parse: null,
        }
      ]));
    });

    it(`Address.extract(testSentence, true)`, async () => {
      await Address.init();
      const result = Address.extract(testSentence, true);
      expect(result).toEqual(expect.arrayContaining([
        {
          name: '陕西省安康市汉滨区',
          parse: {
            province: '陕西省',
            adcode: '610902000000',
            city: '安康市',
            country: '汉滨区',
            address: ''
          }
        }
      ]));
    });


    it(`Address.parse('陕西省安康市汉滨区')`, async () => {
      await Address.init();
      const result = Address.parse('陕西省安康市汉滨区');
      expect(result).toEqual(expect.objectContaining({
        province: '陕西省',
        adcode: '610902000000',
        city: '安康市',
        country: '汉滨区',
        address: ''
      }));
    });

  });

});