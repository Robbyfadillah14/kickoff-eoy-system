export function analyzePresentationContext(report, departmentName = "") {
  // Ambil nama departemen dengan fallback yang aman dari objek report jika argumen kosong
  const effectiveDeptName = departmentName || report?.department?.name || report?.departmentName || "";
  const deptLower = effectiveDeptName.toLowerCase();
  
  // Gabungkan semua kemungkinan struktur data dari backend agar pembacaan parameter tidak pernah luput
  const metricsSource = {
    metricsJson: report?.metricsJson || {},
    salesPerformances: report?.salesPerformances || report?.salesPerformancesJson || [],
    financialMetrics: report?.financialMetrics || {},
    operationalMetrics: report?.operationalMetrics || {},
    summary: report?.achievementSummary || report?.note || ""
  };
  
  const metricsString = JSON.stringify(metricsSource).toLowerCase();

  // 1. Klaster Commercial / Sales (Penjualan, Komersial, Bisnis)
  if (deptLower.includes("sales") || deptLower.includes("komersial") || deptLower.includes("business")) {
    const isProfitOriented = metricsString.includes("profit") || 
                             metricsString.includes("margin") || 
                             metricsString.includes("hpp") || 
                             metricsString.includes("ebitda") ||
                             metricsString.includes("laba");

    return {
      cluster: "COMMERCIAL",
      salesType: isProfitOriented ? "PROFIT" : "OMZET",
      clusterName: isProfitOriented ? "Commercial Sales (Profit Orientation)" : "Commercial Sales (Omzet Orientation)",
      themeColor: isProfitOriented ? "emerald" : "blue",
      focusMetrics: isProfitOriented ? ["Gross Profit Margin", "Net Profit", "Cost Efficiency"] : ["Total Omzet", "Sales Volume", "Client Pipeline"],
      insight: isProfitOriented 
        ? "Fokus utama divisi Sales diarahkan pada optimasi margin keuntungan, efisiensi HPP, dan produk high-margin."
        : "Fokus utama divisi Sales diarahkan pada pencapaian volume penjualan, penetrasi pasar, dan pertumbuhan omzet."
    };
  }

  // 2. Klaster Financial & Numerical (Finance, Tax, Accounting, Pajak, Keuangan)
  if (deptLower.match(/(finance|tax|pajak|accounting|ap|ar|keuangan|akuntansi|audit)/g)) {
    return {
      cluster: "FINANCIAL",
      themeColor: "amber",
      clusterName: "Financial & Numerical Group",
      focusMetrics: ["Cash Flow Health", "Tax Risk & Compliance", "Reconciliation & Bad Debt"],
      insight: "Analisis difokuskan pada kesehatan arus kas (Cash Flow), kepatuhan pajak & mitigasi risiko Coretax, serta akurasi buku besar."
    };
  }

  // 3. Klaster Internal Operational & Hospitality (Inventory, HR, Logistics, Purchasing, ProdDev, dll.)
  return {
    cluster: "OPERATIONAL_HOSPITALITY",
    themeColor: "indigo",
    clusterName: "Internal Operational & Hospitality Group",
    focusMetrics: ["Service Level Agreement (SLA)", "On-Time Delivery (OTD)", "Process & Compliance Efficiency"],
    insight: "Analisis difokuskan pada tingkat kepatuhan SLA, efisiensi rantai pasok/pengadaan, dan kelancaran operasional harian."
  };
}