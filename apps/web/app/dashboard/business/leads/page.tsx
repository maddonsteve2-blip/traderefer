import { redirect } from "next/navigation";
export default function BusinessLeadsPage() {
    redirect("/dashboard/business/sales?tab=leads");
}
