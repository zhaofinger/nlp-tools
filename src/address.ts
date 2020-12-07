import * as jieba from 'nodejieba';
import adcodeJson from './resources/adcodes.json';

interface IAdcodeAddress {
  adcode: number;
  name: string;
  longitude: number | null;
  latitude: number | null;
}

enum ADDRESS_TYPE {
  province = 0,
  city = 1,
  country = 2,
}

export interface IAddressInfo {
  province: string;
  city?: string;
  country?: string;
  address?: string;
  adcode: string;
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
  static addressLib?: IAdcodeAddress[];

  /**
   * 获取地址省市区类型
   * @param adCode
   */
  private static getType(adCode: string) {
    const adCodeTemp = adCode.substr(0, 6);
    if (adCodeTemp.endsWith('0000')) return ADDRESS_TYPE.province;
    if (adCodeTemp.endsWith('00')) return ADDRESS_TYPE.city;
    return ADDRESS_TYPE.country;
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
    const addressStopRegex = /([省市]|特别行政区|自治区)$/;
    return specialAbbrName[addressName] || addressName.split(addressStopRegex)[0];
  }

  /**
   * 根据 adcode 查找地址
   * @param adCode
   */
  private static findByAdcode(adCode: string) {
    const completeAdCode = `${adCode}${'0'.repeat(12 - adCode.length)}`;
    return this.addressLib?.find(item => `${item.adcode}` === completeAdCode);
  }

  /**
   * 解析地址 item 详情
   * @param adCode
   */
  private static extractItem(adCode: string) {
    const adCodeTemp = adCode.substr(0, 6);
    const addressRes: Partial<IAddressInfo> = {};

    // 省
    const matchProvinceAddress = this.findByAdcode(adCodeTemp.substr(0, 2));
    addressRes.province = matchProvinceAddress?.name;

    // 市
    if (adCodeTemp[3] !== '0') {
      const matchCityAddress = this.findByAdcode(adCodeTemp.substr(0, 4));
      addressRes.city = matchCityAddress?.name;
    }

    // 区
    if (adCodeTemp[5] !== '0') {
      const matchCountryAddress = this.findByAdcode(adCodeTemp);
      addressRes.country = matchCountryAddress?.name;
    }

    addressRes.adcode = adCode;

    return addressRes;
  }

  public static init() {
    try {
      const addressLib = adcodeJson;
      this.addressLib = addressLib;
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
      const matchAddressList: (IAdcodeAddress & { type: ADDRESS_TYPE })[] = [];
      // 匹配原数据中的地址关键字
      for (let i = 0; i < addressWords.length; i++) {
        const item = addressWords[i];
        const matchRes = this.addressLib?.find(address => this.abbrName(address.name) === this.abbrName(item));
        if (matchRes) {
          matchAddressList.push({ ...matchRes, type: this.getType(`${matchRes.adcode}`) });
        } else {
          addressRes.address = addressWords.slice(i).join('');
          break;
        }
      }

      // 按省市区排序
      const sortMathAddressList = matchAddressList.sort((a, b) => Number(Boolean(a.type - b.type)));
      // 地址文本
      let addressTemp = '';
      sortMathAddressList.forEach((item, index) => {
        const extractItem = this.extractItem(`${item.adcode}`);
        if (index !== 0) {
          // 区
          if (item.type === ADDRESS_TYPE.city) {
            if (extractItem.province === addressRes.province) {
              addressRes.city = extractItem.city;
              addressRes.adcode = extractItem.adcode;
            } else {
              addressTemp += extractItem.city || '';
            }
          }
          // 区
          if (item.type === ADDRESS_TYPE.country) {
            if (extractItem.province === addressRes.province) {
              addressRes.city = extractItem.city;
              addressRes.country = extractItem.country;
              addressRes.adcode = extractItem.adcode;
            } else {
              addressTemp += addressRes.country || '';
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
