"use client";
// Deck Commercial/Sales = SalesDeck (gaya master deck: dashboard, timeline, tim sales, produk, inovasi, support, outlook).
// File ini dipertahankan agar import lama tetap jalan.
export { productsOf, achievementOf } from "../../lib/presentation/commercialData.js";
export { default, buildSalesSlides as buildCommercialSlides } from "./SalesDeck.jsx";