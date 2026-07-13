import test from "node:test";
import assert from "node:assert/strict";
import resume from "../lib/resume.json";

const publicationTitle =
  "“How does socioeconomic status affect the trajectory and livelihood of a low-economic child?”";

test("resume contains the complete Earlham education record", () => {
  const education = resume.education[0];
  assert.equal(education.school, "Earlham College");
  assert.equal(education.degree, "B.A. in Global Management");
  assert.equal(education.graduation, "May 2024");
  assert.equal(education.track, "Social Entrepreneurship");
  assert.ok(education.minors.includes("Political Science"));
  assert.ok(education.minors.includes("Leadership"));
  assert.ok(education.minors.includes("Philosophy"));
});

test("resume contains the complete structured publication", () => {
  const publication = resume.publications[0];
  assert.equal(publication.author, "Blake Taylor");
  assert.equal(publication.title, publicationTitle);
  assert.equal(publication.institution, "Earlham College");
  assert.equal(publication.date, "May 2024");
});
