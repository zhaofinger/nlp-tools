import * as jieba from 'nodejieba';
import { data as addressData, IAddressData } from 'province-city-china/data';


enum ADDRESS_TYPE {
  province = 0,
  city = 1,
  area = 2,
}

export interface IAddressInfo {
  code: string;
  province: string;
  city?: string;
  area?: string;
  address?: string;
}

export interface IExtractAddress {
  name: string;
  parse?: IAddressInfo | null;
}


/**
 * 地址处理
 */
export default class Address {
  /**
   * csv 2 json 地址数组
   * adcode 含义
   * 前 2 位表示 省
   * 前 4 位表示 市
   * 前 6 位表示 区
   *
   */
  static addressLib?: IAddressData[];

  /**
   * 获取地址省市区类型
   * @param adCode
   */
  private static getType(code: string) {
    const adCodeTemp = code.substr(0, 6);
    if (adCodeTemp.endsWith('0000')) return ADDRESS_TYPE.province;
    if (adCodeTemp.endsWith('00')) return ADDRESS_TYPE.city;
    return ADDRESS_TYPE.area;
  }

  /**
   * 获取地名简写
   * @param addressName
   */
  private static abbrName(addressName: string) {
    const specialAbbrName: { [key: string]: string } = {
      '内蒙古自治区': '内蒙古',
      '广西壮族自治区': '广西',
      '西藏自治区': '西藏',
      '新疆维吾尔自治区': '新疆',
      '宁夏回族自治区': '宁夏',
    };
    const addressStopRegex = /([省市]|特别行政区|自治区|区|县)$/;
    return specialAbbrName[addressName] || addressName.split(addressStopRegex)[0];
  }

  /**
   * 根据 adcode 查找地址
   * @param code
   */
  private static findByAdcode(code: string) {
    return this.addressLib?.find(item => item.code === code);
  }

  /**
   * 解析地址 item 详情
   * @param item
   */
  private static extractItem(item: IAddressData) {
    const addressRes: Partial<IAddressInfo> = {};

    // 省
    const matchProvinceAddress = this.findByAdcode(`${item.province}0000`);
    addressRes.province = matchProvinceAddress?.name;

    // 市
    if (item.city) {
      const matchCityAddress = this.findByAdcode(`${item.province}${item.city}00`);
      addressRes.city = matchCityAddress?.name;
    }

    // 区
    if (item.area) {
      const matchCountryAddress = this.findByAdcode(`${item.code}`);
      addressRes.area = matchCountryAddress?.name;
    }

    addressRes.code = item.code;

    return addressRes;
  }

  public static init() {
    try {
      this.addressLib = addressData;
    } catch (error) {
      throw new Error(error);
    }
  }


  /**
   * 解析地址
   * @param address
   */
  public static parse(address: string) {
    if (!this.addressLib) {
      this.init();
    }
    const addressWords = jieba.cut(address);
    let addressRes: Partial<IAddressInfo> = {};
    try {
      const matchAddressList: (IAddressData & { type: ADDRESS_TYPE })[] = [];
      // 匹配原数据中的地址关键字
      for (let i = 0; i < addressWords.length; i++) {
        const item = addressWords[i];
        const matchResList = this.addressLib?.filter(address => this.abbrName(address.name) === this.abbrName(item));
        if (matchResList?.length) {
          matchResList.forEach(matchRes => matchAddressList.push({ ...matchRes, type: this.getType(`${matchRes.code}`) }));
        } else {
          addressRes.address = addressWords.slice(i).join('');
          break;
        }
      }

      // 按省市区排序
      const sortMathAddressList = matchAddressList.sort((a, b) => a.type - b.type);
      // 地址文本
      let addressTemp = '';

      sortMathAddressList.forEach((item, index) => {
        const extractItem = this.extractItem(item);
        if (index !== 0) {
          // 区
          if (item.type === ADDRESS_TYPE.city) {
            if (extractItem.province === addressRes.province) {
              addressRes.city = extractItem.city;
              addressRes.code = extractItem.code;
            } else {
              addressTemp += extractItem.city || '';
            }
          }
          // 区
          if (item.type === ADDRESS_TYPE.area) {
            if (extractItem.province === addressRes.province) {
              addressRes.city = extractItem.city;
              addressRes.area = extractItem.area;
              addressRes.code = extractItem.code;
            } else {
              addressTemp += addressRes.area || '';
            }
          }
        } else {
          addressRes = { ...extractItem, ...addressRes };
        }
      });
      addressRes.address = `${addressTemp || ''}${addressRes.address || ''}`;
      if (addressRes.province) return addressRes as IAddressInfo;
      return null;
    } catch (error) {
      throw new Error(error);
    }
  }

  /**
   * 提取文本中的地址
   * @param text
   */
  public static extract(text: string, withParse = false) {
    const splitWords = jieba.tag(text);
    const addressList: IExtractAddress[] = [];
    try {
      splitWords.forEach(({ word, tag }, index) => {
        let addressName = '';
        let count = index;
        let prevTag = index > 1 ? splitWords[index - 1] : null;
        // 匹配到地名 开始寻找后续名词
        if (tag === 'ns' && prevTag?.tag !== 'ns') {
          addressName = word;
          count += 1;
          while (count < splitWords.length) {
            let nextItem = splitWords[count];
            if (nextItem.tag === 'ns' || nextItem.tag === 'n') {
              addressName += nextItem.word;
            } else {
              break;
            }
            count += 1;
          }
          let parse: IAddressInfo | null = null;
          if (withParse) parse = this.parse(addressName);
          addressList.push({
            name: addressName,
            parse,
          });
        }
      });
      if (!addressList.length) return null;
      return addressList;
    } catch (error) {
      throw new Error(error);
    }
  }
}
