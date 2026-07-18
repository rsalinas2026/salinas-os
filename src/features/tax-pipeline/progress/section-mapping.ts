import type { SectionProgressMapping } from "./types";

export const SECTION_PROGRESS_MAPPINGS: Record<
  string,
  SectionProgressMapping
> = {
  QUESTIONNARIES: {
    asanaSectionName: "QUESTIONNARIES",
    clientStage: "Information Collection",
    clientVisible: false,
    workflowType: "unknown",
    isTaxReturn: false,
  },

  "NEW TAX LEADS": {
    asanaSectionName: "NEW TAX LEADS",
    clientStage: "Status Under Review",
    clientVisible: false,
    workflowType: "unknown",
    isTaxReturn: false,
  },

  "SEASON UPDATES": {
    asanaSectionName: "SEASON UPDATES",
    clientStage: "Status Under Review",
    clientVisible: false,
    workflowType: "unknown",
    isTaxReturn: false,
  },

  "0. IMPORTANT QUESTIONS TO DO FOR EACH PROJECT": {
    asanaSectionName: "0. IMPORTANT QUESTIONS TO DO FOR EACH PROJECT",
    clientStage: "Initial Review",
    clientVisible: false,
    workflowType: "unknown",
    isTaxReturn: false,
  },

  "1.0 PRESCREENING": {
    asanaSectionName: "1.0 PRESCREENING",
    clientStage: "Initial Review",
    clientVisible: true,
    workflowType: "unknown",
    isTaxReturn: true,
  },

  "1.1 INFORMATION REQUESTED TO CLIENT": {
    asanaSectionName: "1.1 INFORMATION REQUESTED TO CLIENT",
    clientStage: "Information Collection",
    clientVisible: true,
    workflowType: "unknown",
    isTaxReturn: true,
  },

  "1.2 THE FLORIDA BUSINESS LAW": {
    asanaSectionName: "1.2 THE FLORIDA BUSINESS LAW",
    clientStage: "Information Collection",
    clientVisible: false,
    workflowType: "unknown",
    isTaxReturn: false,
  },

  "1.3 CLIENTS TO CONTACT": {
    asanaSectionName: "1.3 CLIENTS TO CONTACT",
    clientStage: "Information Collection",
    clientVisible: true,
    workflowType: "unknown",
    isTaxReturn: true,
  },

  "1.4 PERSONAL DOCUMENTATION RECEIVED - WAITING FOR COMPANY TAXES": {
    asanaSectionName:
      "1.4 PERSONAL DOCUMENTATION RECEIVED - WAITING FOR COMPANY TAXES",
    clientStage: "Information Collection",
    clientVisible: true,
    workflowType: "unknown",
    isTaxReturn: true,
  },

  "2.0 MONTHLY BOOKKEEPING ENGAGEMENTS": {
    asanaSectionName: "2.0 MONTHLY BOOKKEEPING ENGAGEMENTS",
    clientStage: "Accounting Preparation",
    clientVisible: true,
    workflowType: "tax-with-bookkeeping",
    isTaxReturn: true,
  },

  "2.1 ACCOUNTING DATA ENTRY": {
    asanaSectionName: "2.1 ACCOUNTING DATA ENTRY",
    clientStage: "Accounting Preparation",
    clientVisible: true,
    workflowType: "tax-with-accounting",
    isTaxReturn: true,
  },

  "2.2 READY TO ASSIGN": {
    asanaSectionName: "2.2 READY TO ASSIGN",
    clientStage: "Tax Preparation",
    clientVisible: true,
    workflowType: "unknown",
    isTaxReturn: true,
  },

  "2.3 BOOKS REVIEW: XIOMY/VANESSA/ BRYAN/MARIA": {
    asanaSectionName: "2.3 BOOKS REVIEW: XIOMY/VANESSA/ BRYAN/MARIA",
    clientStage: "Accounting Preparation",
    clientVisible: true,
    workflowType: "tax-with-accounting",
    isTaxReturn: true,
  },

  "XIOMY TAXES": {
    asanaSectionName: "XIOMY TAXES",
    clientStage: "Tax Preparation",
    clientVisible: true,
    workflowType: "unknown",
    isTaxReturn: true,
  },

  "VANESSAS TAXES": {
    asanaSectionName: "VANESSAS TAXES",
    clientStage: "Tax Preparation",
    clientVisible: true,
    workflowType: "unknown",
    isTaxReturn: true,
  },

  "BRYAN TAXES": {
    asanaSectionName: "BRYAN TAXES",
    clientStage: "Tax Preparation",
    clientVisible: true,
    workflowType: "unknown",
    isTaxReturn: true,
  },

  "MARIA TAXES": {
    asanaSectionName: "MARIA TAXES",
    clientStage: "Tax Preparation",
    clientVisible: true,
    workflowType: "unknown",
    isTaxReturn: true,
  },

  "MATT TAXES": {
    asanaSectionName: "MATT TAXES",
    clientStage: "Tax Preparation",
    clientVisible: true,
    workflowType: "unknown",
    isTaxReturn: true,
  },

  "TAXES PREPARED - WAITING FOR OTHER DEPENDENCIES": {
    asanaSectionName: "TAXES PREPARED - WAITING FOR OTHER DEPENDENCIES",
    clientStage: "Tax Preparation",
    clientVisible: true,
    workflowType: "unknown",
    isTaxReturn: true,
  },

  "BRYAN TO REVIEW": {
    asanaSectionName: "BRYAN TO REVIEW",
    clientStage: "Internal Review",
    clientVisible: true,
    workflowType: "unknown",
    isTaxReturn: true,
  },

  "MARIA TO REVIEW": {
    asanaSectionName: "MARIA TO REVIEW",
    clientStage: "Internal Review",
    clientVisible: true,
    workflowType: "unknown",
    isTaxReturn: true,
  },

  "VANESSA TO REVIEW": {
    asanaSectionName: "VANESSA TO REVIEW",
    clientStage: "Internal Review",
    clientVisible: true,
    workflowType: "unknown",
    isTaxReturn: true,
  },

  "CLIENT REVIEW": {
    asanaSectionName: "CLIENT REVIEW",
    clientStage: "Internal Review",
    clientVisible: true,
    workflowType: "unknown",
    isTaxReturn: true,
  },

  "WAITING ON SIGNATURE": {
    asanaSectionName: "WAITING ON SIGNATURE",
    clientStage: "Signature",
    clientVisible: true,
    workflowType: "unknown",
    isTaxReturn: true,
  },

  "PREPARE FORMS TO PRINT AND SEND TO IRS BY MAIL": {
    asanaSectionName: "PREPARE FORMS TO PRINT AND SEND TO IRS BY MAIL",
    clientStage: "Filing in Progress",
    clientVisible: true,
    workflowType: "unknown",
    isTaxReturn: true,
  },

  "REJECTED BY IRS - PENDING RESPONSE": {
    asanaSectionName: "REJECTED BY IRS - PENDING RESPONSE",
    clientStage: "Filing in Progress",
    clientVisible: true,
    workflowType: "unknown",
    isTaxReturn: true,
  },

  "SENT TO IRS BY MAIL": {
    asanaSectionName: "SENT TO IRS BY MAIL",
    clientStage: "Filed",
    clientVisible: true,
    workflowType: "unknown",
    isTaxReturn: true,
  },

  "E-FILING CONFIRMED": {
    asanaSectionName: "E-FILING CONFIRMED",
    clientStage: "Filed",
    clientVisible: true,
    workflowType: "unknown",
    isTaxReturn: true,
  },

  "WE WON'T HANDLE THESE TAXES": {
    asanaSectionName: "WE WON'T HANDLE THESE TAXES",
    clientStage: "Status Under Review",
    clientVisible: false,
    workflowType: "unknown",
    isTaxReturn: false,
  },
};