import { OptionGroupForm } from "@/components/admin/OptionGroupForm";

export default async function EditOptionGroupPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;
    return <OptionGroupForm groupId={id} />;
}
