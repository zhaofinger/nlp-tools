import * as jieba from 'nodejieba';

export interface ILocation {
  name: string;
  locations: string[];
}

export default class NLPTools {
  /**
   * 解析获取文本中的地址信息
   * @param text
   */
  public static getLocations(text: string): null | ILocation[] {
    const splitWords = jieba.tag(text);
    const locationList: ILocation[] = [];

    splitWords.forEach(({ word, tag }, index) => {
      let locationName = '';
      let locations: string[] = [];
      let count = index;
      let prevTag = index > 1 ? splitWords[index - 1] : null;
      if (tag === 'ns' && prevTag.tag !== 'ns') {
        locationName = word;
        locations.push(word);
        count += 1;
        while (count < splitWords.length) {
          let nextItem = splitWords[count];
          if (nextItem.tag === 'ns' || nextItem.tag === 'n') {
            locationName += nextItem.word;
            locations.push(nextItem.word);
          } else {
            break;
          }
          count += 1;
        }
        locationList.push({
          name: locationName,
          locations,
        });
      }
    });
    if (!locationList.length) return null;
    return locationList;
  }
}