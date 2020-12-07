import { Address } from '../src';

async function main() {
  await Address.init();
  const extractRes = Address.extract('急寻特朗普，男孩，于2018年11月27号11时在陕西省安康市汉滨区走失。丢失发型短发，...', true);
  console.log(extractRes);

  const parseRes = Address.parse('陕西省安康市汉滨区');
  console.log(parseRes);
}

main();