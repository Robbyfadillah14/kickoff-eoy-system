"use client";
import React from "react";
import KpiDeck from "./KpiDeck.jsx";

/** Deck Financial & Tax — memakai data gabungan Finance Dept, AR, AP, Accounting, Tax, Admin TF (+ Exim sebagai pendukung). */
export default function FinancialDeck(props) {
  return <KpiDeck cluster="FINANCIAL" {...props} />;
}
