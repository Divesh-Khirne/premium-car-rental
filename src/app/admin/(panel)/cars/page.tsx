import { CarsAdmin } from "@/components/admin/CarsAdmin";
import { getCars } from "@/lib/data";
import { requireAdmin } from "@/lib/auth";

export const metadata = { title: "Vehicles" };
export default async function AdminCars() { await requireAdmin(); return <CarsAdmin cars={await getCars()} />; }
