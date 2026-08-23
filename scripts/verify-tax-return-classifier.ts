import assert from "node:assert/strict";
import {
  classifyTaxReturnTask,
  type ClassifiableAsanaMembership,
  type ClassifiableAsanaTask,
} from "../src/features/tax-pipeline/classify-tax-return";
import { SECTION_PROGRESS_MAPPINGS } from "../src/features/tax-pipeline/progress/section-mapping";
import type { TaxSeason } from "../src/features/tax-pipeline/tax-seasons";

const season: TaxSeason = {
  id: "verification",
  year: 2026,
  name: "Verification Season",
  status: "active",
  projects: [
    {
      id: "primary",
      name: "Primary Project",
      asanaProjectGid: "project-primary",
      enabled: true,
    },
    {
      id: "secondary",
      name: "Secondary Project",
      asanaProjectGid: "project-secondary",
      enabled: true,
    },
  ],
};

function taskWithMemberships(
  memberships: ClassifiableAsanaMembership[],
): ClassifiableAsanaTask {
  return {
    memberships,
  };
}

function membership(
  projectGid: string,
  sectionGid: string,
  sectionName: string,
) {
  return {
    project: {
      gid: projectGid,
      name: projectGid,
    },
    section: {
      gid: sectionGid,
      name: sectionName,
    },
  };
}

const singleMapped = classifyTaxReturnTask(
  taskWithMemberships([
    membership("project-primary", "section-prescreen", "1.0 PRESCREENING"),
  ]),
  season,
);
assert.equal(singleMapped.taxReturnEligible, true);
assert.equal(singleMapped.clientStatusEligible, true);
assert.equal(singleMapped.clientStage, "Initial Review");
assert.equal(singleMapped.progressPercent, 10);

const taxOverNonTax = classifyTaxReturnTask(
  taskWithMemberships([
    membership("project-primary", "section-questionnaires", "QUESTIONNARIES"),
    membership("project-secondary", "section-prescreen", "1.0 PRESCREENING"),
  ]),
  season,
);
assert.equal(taxOverNonTax.selectedSectionGid, "section-prescreen");
assert.equal(taxOverNonTax.taxReturnEligible, true);

const highestProgress = classifyTaxReturnTask(
  taskWithMemberships([
    membership("project-primary", "section-prescreen", "1.0 PRESCREENING"),
    membership("project-secondary", "section-signature", "WAITING ON SIGNATURE"),
  ]),
  season,
);
assert.equal(highestProgress.selectedSectionGid, "section-signature");
assert.equal(highestProgress.progressPercent, 90);

const unmapped = classifyTaxReturnTask(
  taskWithMemberships([
    membership("project-primary", "section-unknown", "UNKNOWN SECTION"),
  ]),
  season,
);
assert.equal(unmapped.mappingStatus, "unmapped");
assert.equal(unmapped.exclusionReason, "unmapped-section");
assert.equal(unmapped.clientStatusEligible, false);

const outsideSeason = classifyTaxReturnTask(
  taskWithMemberships([
    membership("different-project", "section-prescreen", "1.0 PRESCREENING"),
  ]),
  season,
);
assert.equal(outsideSeason.belongsToSelectedSeason, false);
assert.equal(outsideSeason.exclusionReason, "outside-selected-season");

const clientInvisibleNonTax = classifyTaxReturnTask(
  taskWithMemberships([
    membership("project-primary", "section-questionnaires", "QUESTIONNARIES"),
  ]),
  season,
);
assert.equal(clientInvisibleNonTax.clientVisible, false);
assert.equal(clientInvisibleNonTax.exclusionReason, "non-tax-record");

const clientInvisibleTaxMappings = Object.values(
  SECTION_PROGRESS_MAPPINGS,
).filter((mapping) => mapping.isTaxReturn && !mapping.clientVisible);
assert.equal(
  clientInvisibleTaxMappings.length,
  0,
  "Add an explicit client-invisible tax-record scenario if the mappings introduce one.",
);

const projectOrderTie = classifyTaxReturnTask(
  taskWithMemberships([
    membership("project-secondary", "section-b", "1.0 PRESCREENING"),
    membership("project-primary", "section-z", "1.0 PRESCREENING"),
  ]),
  season,
);
assert.equal(projectOrderTie.selectedProjectGid, "project-primary");

const stableGidTie = classifyTaxReturnTask(
  taskWithMemberships([
    membership("project-primary", "section-z", "1.0 PRESCREENING"),
    membership("project-primary", "section-a", "1.0 PRESCREENING"),
  ]),
  season,
);
assert.equal(stableGidTie.selectedSectionGid, "section-a");

console.log("Canonical tax-return classifier verification passed.");
