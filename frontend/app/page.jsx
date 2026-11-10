import { redirect } from "next/navigation";

export default function Home() {
  // Kalau belum login, arahkan langsung ke halaman /login
  redirect("/login");
}