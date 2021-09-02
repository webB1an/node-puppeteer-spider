
/**
 * movie
 * @export
 * @interface Movie
 */
export interface Movie {
  rank: string;
  name: string;
  rate: string;
  quote: string;
  href: string;
}

/**
 * csv base header
 * @export
 * @interface Filed
 */
export interface Filed {
  value: string;
  label: string;
}

/**
 * json2csv parser header
 * @export
 * @interface Fileds
 */
export interface Fileds {
  fields: Filed[]
}
