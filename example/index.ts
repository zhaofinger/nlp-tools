import { Address } from '../src';

async function main() {
  await Address.init();
  // const extractRes = Address.extract('急寻特朗普，男孩，于2018年11月27号11时在杭州市富阳走失。丢失发型短发，...', true);
  // console.log(extractRes);

  const parseRes = Address.parse('浙江西湖');
  console.log(parseRes);
}

main();