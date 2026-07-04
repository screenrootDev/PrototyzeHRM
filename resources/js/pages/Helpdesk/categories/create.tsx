import { DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useForm } from "@inertiajs/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import InputError from "@/components/input-error";
import { CreateHelpdeskCategoryProps, CreateHelpdeskCategoryFormData } from './types';

export default function Create({ onSuccess }: CreateHelpdeskCategoryProps) {
        const { data, setData, post, processing, errors } = useForm<CreateHelpdeskCategoryFormData>({
        name: '',
        description: '',
        color: '#3B82F6',
        is_active: true,
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('helpdesk-categories.store'), {
            onSuccess: () => {
                onSuccess();
            }
        });
    };

    return (
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Create Helpdesk Category</DialogTitle>
            </DialogHeader>
            <form onSubmit={submit} className="space-y-4">
                <div>
                    <Label htmlFor="name">Name</Label>
                    <Input
                        id="name"
                        value={data.name}
                        onChange={(e) => setData('name', e.target.value)}
                        placeholder="Enter category name"
                        required
                    />
                    <InputError message={errors.name} />
                </div>

                <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                        id="description"
                        value={data.description}
                        onChange={(e) => setData('description', e.target.value)}
                        placeholder="Enter category description"
                        rows={3}
                    />
                    <InputError message={errors.description} />
                </div>

                <div>
                    <Label htmlFor="color">Color</Label>
                    <Input
                        id="color"
                        type="color"
                        value={data.color}
                        onChange={(e) => setData('color', e.target.value)}
                        className="h-10 w-20"
                    />
                    <InputError message={errors.color} />
                </div>

                <div>
                    <Label htmlFor="is_active">Active</Label>
                    <div className="mt-2">
                        <Switch
                            id="is_active"
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
                        {processing ? 'Creating...' : 'Create'}
                    </Button>
                </div>
            </form>
        </DialogContent>
    );
}
