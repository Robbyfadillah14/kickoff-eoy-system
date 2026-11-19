/**
 * SUMBER TUNGGAL pemetaan departemen -> klaster -> form -> deck.
 *
 * - Nama harus SAMA PERSIS dengan Department.name di database (lihat seed.js).
 * - Urutan array = prioritas saat menggabungkan metrik (yang lebih awal menang bila ada key bentrok).
 * - cluster : klaster pemilik (dipakai untuk kelengkapan data & pengelompokan dashboard)
 * - feeds   : klaster yang decknya ikut memakai data departemen ini
 */
export const DEPARTMENTS = [
  { code: "SALES",    name: "Sales & Sales Support",  short: "Sales",        cluster: "COMMERCIAL",              feeds: ["COMMERCIAL"],                                 form: "SalesForm" },
  { code: "DIG_MKT",  name: "Digital Marketing",      short: "Digital Mkt",  cluster: "DIGITAL_MARKETING",       feeds: ["DIGITAL_MARKETING"],                          form: "DigitalMarketingForm" },
  { code: "PROD_DEV", name: "Product Development",    short: "Product Dev",  cluster: "PRODUCT_DEVELOPMENT",     feeds: ["PRODUCT_DEVELOPMENT"],                        form: "ProductDevelopmentForm" },

  { code: "FIN_DEPT", name: "Finance Department",     short: "Finance",      cluster: "FINANCIAL",               feeds: ["FINANCIAL"],                                  form: "FinanceDepartmentForm" },
  { code: "FIN_AR",   name: "Finance AR",             short: "AR",           cluster: "FINANCIAL",               feeds: ["FINANCIAL"],                                  form: "FinanceARForm" },
  { code: "FIN_AP",   name: "Finance AP",             short: "AP",           cluster: "FINANCIAL",               feeds: ["FINANCIAL"],                                  form: "FinanceAPForm" },
  { code: "ACCT",     name: "Accounting",             short: "Accounting",   cluster: "FINANCIAL",               feeds: ["FINANCIAL"],                                  form: "AccountingTaxForm" },
  { code: "TAX",      name: "Tax",                    short: "Tax",          cluster: "FINANCIAL",               feeds: ["FINANCIAL"],                                  form: "AccountingTaxForm" },
  { code: "ADM_TF",   name: "Admin TF",               short: "Admin TF",     cluster: "FINANCIAL",               feeds: ["FINANCIAL", "OPERATIONAL_HOSPITALITY"],       form: "AdminTfForm" },

  { code: "PURCH",    name: "Purchasing",             short: "Purchasing",   cluster: "OPERATIONAL_HOSPITALITY", feeds: ["OPERATIONAL_HOSPITALITY"],                    form: "PurchasingForm" },
  { code: "EXIM",     name: "Export & Import",        short: "Exim",         cluster: "OPERATIONAL_HOSPITALITY", feeds: ["OPERATIONAL_HOSPITALITY", "FINANCIAL"],       form: "EximForm" },
  { code: "LOG_WH",   name: "Logistic & Warehouse",   short: "Logistic",     cluster: "OPERATIONAL_HOSPITALITY", feeds: ["OPERATIONAL_HOSPITALITY"],                    form: "LogisticWarehouseForm" },
  { code: "ADM_LOG",  name: "Admin Logistic",         short: "Admin Log",    cluster: "OPERATIONAL_HOSPITALITY", feeds: ["OPERATIONAL_HOSPITALITY"],                    form: "AdminLogisticForm" },
  { code: "HR_MR",    name: "HR & MR",                short: "HR & MR",      cluster: "OPERATIONAL_HOSPITALITY", feeds: ["OPERATIONAL_HOSPITALITY"],                    form: "HrMrForm" },
];