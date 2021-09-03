
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
