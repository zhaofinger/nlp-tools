declare module 'province-city-china/data' {
  export interface IAddressData {
    code: string;
    name: string;
    province: string;
    city: string | 0;
    area: string | 0;
    town: number | 0;
  }
  export const data: IAddressData[];
}