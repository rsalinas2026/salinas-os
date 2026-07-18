export type ClientStageName =
  | "Initial Review"
  | "Information Collection"
  | "Accounting Preparation"
  | "Tax Preparation"
  | "Internal Review"
  | "Signature"
  | "Filing in Progress"
  | "Filed"
  | "Status Under Review";

export type ClientStatus = {
  stage: ClientStageName;
  progressPercent: number;
  headline: string;
  description: string;
  nextStep: string;
  clientActionRequired: boolean;
  clientActionMessage: string | null;
};

const CLIENT_STATUS_MAP: Record<ClientStageName, ClientStatus> = {
  "Initial Review": {
    stage: "Initial Review",
    progressPercent: 10,
    headline: "Your tax file is undergoing our initial review.",
    description:
      "Our team is reviewing the information currently available, confirming the scope of the engagement and determining the requirements for preparing your tax return.",
    nextStep:
      "Once the initial review is complete, we will confirm whether any additional information or documentation is required.",
    clientActionRequired: false,
    clientActionMessage: null,
  },

  "Information Collection": {
    stage: "Information Collection",
    progressPercent: 25,
    headline:
      "We are collecting and reviewing the information needed for your tax return.",
    description:
      "Our team is organizing the documents received and identifying any remaining information required before preparation can continue.",
    nextStep:
      "Once the required information is complete, your return will move into the preparation stage.",
    clientActionRequired: true,
    clientActionMessage:
      "Please review our most recent request and provide any outstanding information or documents.",
  },

  "Accounting Preparation": {
    stage: "Accounting Preparation",
    progressPercent: 40,
    headline:
      "Your accounting records are being prepared for tax return preparation.",
    description:
      "Our team is reviewing and organizing the underlying accounting information required to prepare an accurate tax return.",
    nextStep:
      "Once the accounting preparation is complete, the file will move into tax preparation.",
    clientActionRequired: false,
    clientActionMessage: null,
  },

  "Tax Preparation": {
    stage: "Tax Preparation",
    progressPercent: 60,
    headline: "Your tax return is currently being prepared.",
    description:
      "A tax professional is preparing the return using the information and documentation collected for your file.",
    nextStep:
      "After preparation, the return will proceed through our internal quality-control review.",
    clientActionRequired: false,
    clientActionMessage: null,
  },

  "Internal Review": {
    stage: "Internal Review",
    progressPercent: 75,
    headline:
      "Your tax return is undergoing our internal quality-control review.",
    description:
      "Our review team is checking the return for accuracy, completeness and consistency before it is released for your review and signature.",
    nextStep:
      "Once quality control is complete, we will send the return or required authorization documents for your review and signature.",
    clientActionRequired: false,
    clientActionMessage: null,
  },

  Signature: {
    stage: "Signature",
    progressPercent: 90,
    headline:
      "Your tax return has reached the client review and signature stage.",
    description:
      "Preparation and internal review have been substantially completed. We are now waiting for the required approvals or electronic signatures.",
    nextStep:
      "After all required signatures and authorizations are received, the return will proceed to filing.",
    clientActionRequired: true,
    clientActionMessage:
      "Please review and complete any signature or authorization requests sent by our office.",
  },

  "Filing in Progress": {
    stage: "Filing in Progress",
    progressPercent: 95,
    headline: "Your tax return is being processed for filing.",
    description:
      "The required preparation, review and signature steps have been completed, and our team is processing the return for electronic filing.",
    nextStep:
      "We will update the file after the return has been transmitted and its filing status has been confirmed.",
    clientActionRequired: false,
    clientActionMessage: null,
  },

  Filed: {
    stage: "Filed",
    progressPercent: 100,
    headline: "Your tax return has been filed.",
    description:
      "The tax preparation workflow has been completed and the return has been processed for filing.",
    nextStep:
      "Please retain the final tax return and supporting records with your permanent files.",
    clientActionRequired: false,
    clientActionMessage: null,
  },

  "Status Under Review": {
    stage: "Status Under Review",
    progressPercent: 0,
    headline: "We are confirming the current status of your tax file.",
    description:
      "This file is currently undergoing an internal status review before a client-facing progress stage can be confirmed.",
    nextStep:
      "Our team will update the status after the workflow classification has been reviewed.",
    clientActionRequired: false,
    clientActionMessage: null,
  },
};

function isClientStageName(value: string): value is ClientStageName {
  return value in CLIENT_STATUS_MAP;
}

export function getClientStatus(stage: string): ClientStatus {
  if (isClientStageName(stage)) {
    return CLIENT_STATUS_MAP[stage];
  }

  return CLIENT_STATUS_MAP["Status Under Review"];
}