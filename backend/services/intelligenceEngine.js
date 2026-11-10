/**
 * INTELLIGENCE ENGINE: Auto-Anomaly Detection & Prescriptive Narrative Generator
 * Menganalisis perbandingan antara Target dan Aktual secara otonom.
 */
function analyzePerformanceMetrics(salesPerformances = []) {
  let totalTarget = 0;
  let totalActual = 0;
  let anomalies = [];
  let strengths = [];

  salesPerformances.forEach((item, index) => {
    const target = Number(item.targetVal) || 0;
    const actual = Number(item.actualVal) || 0;
    totalTarget += target;
    totalActual += actual;

    // Hitung persentase pencapaian
    const achievement = target > 0 ? (actual / target) * 100 : 0;
    const itemName = item.salesName || `Item #${index + 1}`;

    // Deteksi Anomali / Risiko (Jika pencapaian di bawah 85%)
    if (target > 0 && achievement < 85) {
      anomalies.push({
        item: itemName,
        target,
        actual,
        achievement: achievement.toFixed(1) + "%",
        gap: target - actual,
        severity: achievement < 50 ? "CRITICAL" : "WARNING",
        recommendation: `Segera evaluasi strategi distribusi untuk ${itemName}. Gap kekurangan sebesar ${target - actual} unit/nilai memerlukan eskalasi atau realokasi stok.`
      });
    } else if (achievement >= 100) {
      strengths.push({
        item: itemName,
        achievement: achievement.toFixed(1) + "%"
      });
    }
  });

  const overallAchievement = totalTarget > 0 ? (totalActual / totalTarget) * 100 : 0;

  // Generate Narasi Eksekutif Otomatis (Storytelling)
  let executiveSummary = "";
  if (overallAchievement >= 100) {
    executiveSummary = `Performa secara keseluruhan sangat solid dengan total pencapaian mencapai ${overallAchievement.toFixed(1)}%. Target tahunan berhasil terlampaui berkat kontribusi kuat dari lini produk utama.`;
  } else if (overallAchievement >= 80) {
    executiveSummary = `Performa berada di jalur yang stabil (${overallAchievement.toFixed(1)}% dari target). Namun, terdapat beberapa titik deviasi di sejumlah pos yang memerlukan perhatian operasional.`;
  } else {
    executiveSummary = `⚠️ Terdeteksi deviasi performa yang signifikan secara nasional dengan total pencapaian baru menyentuh ${overallAchievement.toFixed(1)}%. Diperlukan tindakan intervensi manajemen segera.`;
  }

  return {
    summary: {
      totalTarget,
      totalActual,
      overallAchievement: overallAchievement.toFixed(1) + "%",
      executiveSummary
    },
    anomalies,
    strengths
  };
}

module.exports = { analyzePerformanceMetrics };