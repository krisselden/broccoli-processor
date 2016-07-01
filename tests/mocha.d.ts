declare var describe: {
  (description: string, spec: () => void): void;
  only(description: string, spec: () => void): void;
  skip(description: string, spec: () => void): void;
  timeout(ms: number): void;
};

declare var context: {
  (description: string, spec: () => void): void;
  only(description: string, spec: () => void): void;
  skip(description: string, spec: () => void): void;
  timeout(ms: number): void;
};

declare var it: {
    (expectation: string, assertion?: () => PromiseLike<any> | void): void;
    only(expectation: string, assertion?: () => PromiseLike<any> | void): void;
    skip(expectation: string, assertion?: () => PromiseLike<any> | void): void;
    timeout(ms: number): void;
};

declare function before(action: () => PromiseLike<any> | void): void;
declare function after(action: () => PromiseLike<any> | void): void;
declare function beforeEach(action: () => PromiseLike<any> | void): void;
declare function afterEach(action: () => PromiseLike<any> | void): void;
