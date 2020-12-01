import * as jieba from 'nodejieba';

export default class NLPTools {
  /**
   * 解析获取文本中的地址信息
   * @param text
   */
  public static getLocations(text: string): null | string[] {
    const splitWords = jieba.tag(text);
    const locationList: string[] = [];

    splitWords.forEach(({ word, tag }, index) => {
      let locationTemp = '';
      let count = index;
      if (tag === 'ns') {
        locationTemp = word;
        count += 1;
        while (count < splitWords.length) {
          let nextItem = splitWords[count];
          if (nextItem.tag === 'ns' || nextItem.tag === 'n') {
            locationTemp += nextItem.word;
          } else {
            break;
          }
          count += 1;
        }
        locationList.push(locationTemp);
      }
    });
    if (!locationList.length) return null;
    return locationList;
  }
}