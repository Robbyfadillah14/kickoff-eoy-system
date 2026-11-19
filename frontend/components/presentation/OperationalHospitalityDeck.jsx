"use client";
import React from "react";
import KpiDeck from "./KpiDeck.jsx";

/** Deck Operational & Logistics — Purchasing, Exim, Logistic & Warehouse, Admin Logistic, HR & MR (+ Admin TF sebagai pendukung). */
export default function OperationalHospitalityDeck(props) {
  return <KpiDeck cluster="OPERATIONAL_HOSPITALITY" {...props} />;
}
