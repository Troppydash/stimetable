export const isFunction = (value: any) => value && (Object.prototype.toString.call(value) === "[object Function]" || "function" === typeof value || value instanceof Function);
export const isObject = (value: any) => typeof value === 'object' && value !== null;
