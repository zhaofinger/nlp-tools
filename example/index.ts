import NLPTools from '../src';

const testText = `急寻特朗普，男孩，于2018年11月27号11时在陕西省安康市汉滨区走失。丢失发型短发，...`;

const result = NLPTools.getLocations(testText);

console.log(result);