import { BroccoliProcessor } from "..";
import { walkSync } from "../helpers";
import { Builder } from "./helpers";

let subject: BroccoliProcessor;
let builder: Builder;

describe("basic", () => {
  beforeEach(() => {
    subject = new BroccoliProcessor(["./tests/fixtures"], {});
    builder = new Builder(subject);
  });

  afterEach(() => {
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
