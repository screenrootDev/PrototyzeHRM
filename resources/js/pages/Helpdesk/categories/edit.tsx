import { DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useForm } from "@inertiajs/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import InputError from "@/components/input-error";
import { EditHelpdeskCategoryProps, EditHelpdeskCategoryFormData } from './types';

export default function Edit({ category, onSuccess }: EditHelpdeskCategoryProps) {
        const { data, setData, put, processing, errors } = useForm<EditHelpdeskCategoryFormData>({
        name: category.name,
        description: category.description || '',
        color: category.color,
        is_active: category.is_active
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        put(route('helpdesk-categories.update', category.id), {
            onSuccess: () => {
                onSuccess();
            }
        });
    };

    return (
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Edit Helpdesk Category</DialogTitle>
            </DialogHeader>
            <form onSubmit={submit} className="space-y-4">
                <div>
                    <Label htmlFor="edit_name">Name</Label>
                    <Input
                        id="edit_name"
                        value={data.name}
                        onChange={(e) => setData('name', e.target.value)}
                        placeholder="Enter category name"
                        required
                    />
                    <InputError message={errors.name} />
                </div>

                <div>
                    <Label htmlFor="edit_description">Description</Label>
                    <Textarea
                        id="edit_description"
                        value={data.description || ''}
                        onChange={(e) => setData('description', e.target.value)}
                        placeholder="Enter category description"
                        rows={3}
                    />
                    <InputError message={errors.description} />
                </div>

                <div>
                    <Label htmlFor="edit_color">Color</Label>
                    <Input
                        id="edit_color"
                        type="color"
                        value={data.color}
                        onChange={(e) => setData('color', e.target.value)}
                        className="h-10 w-20"
                    />
                    <InputError message={errors.color} />
                </div>

                <div>
                    <Label htmlFor="edit_is_active">Active</Label>
                    <div className="mt-2">
                        <Switch
                            id="edit_is_active"
                            checked={data.is_active}
                            onCheckedChange={(checked) => setData('is_active', checked)}
                        />
                    </div>
                </div>
                <InputError message={errors.is_active} />

                <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={onSuccess}>
                        Cancel
                    </Button>
                    <Button type="submit" disabled={processing}>
                        {processing ? 'Updating...' : 'Update'}
                    </Button>
                </div>
            </form>
        </DialogContent>
    );
}