import { BroccoliProcessor } from "../index";
import { walkSync } from "../helpers";
import { Builder } from "./builder";

let subject: BroccoliProcessor;
let builder: Builder;

describe("basic", () => {
  let tmpDir: tmp.Dir;
  beforeEach(() => {
    tmpDir = tmp.dirSync({
      prefix: "broccoli-processor-",
      unsafeCleanup: true
    });

    subject = new BroccoliProcessor([tmpDir.name], {});
    builder = new Builder(subject);
  });

  afterEach(() => {
    tmpDir.removeCallback();
    return builder.cleanup();
  });

  it("should do something", () => {
    return builder.build().then(
      res => {
        let files = walkSync(res.directory, {});
        console.log(res.totalTime / 1000000);
        console.log("output", files);
      },
      err => console.log(err));
  });
});
