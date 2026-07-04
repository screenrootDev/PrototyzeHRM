import { DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useForm, usePage, router } from '@inertiajs/react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import InputError from "@/components/input-error";
import { CreateHelpdeskTicketProps, CreateHelpdeskTicketFormData } from './types';

export default function Create({ onSuccess }: { onSuccess: () => void }) {
    const { categories, companies, auth } = usePage<CreateHelpdeskTicketProps>().props;
        const { data, setData, post, processing, errors } = useForm<CreateHelpdeskTicketFormData>({
        title: '',
        description: '',
        priority: 'medium',
        category_id: categories.length > 0 ? categories[0].id : 0,
        company_id: companies.length > 0 ? companies[0].id : undefined,
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('helpdesk-tickets.store'), {
            onSuccess: () => {
                onSuccess();
            }
        });
    };

    return (
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Create Support Ticket</DialogTitle>
            </DialogHeader>
            <form onSubmit={submit} className="space-y-4">
                <div>
                    <Label htmlFor="title">Title</Label>
                    <Input
                        id="title"
                        value={data.title}
                        onChange={(e) => setData('title', e.target.value)}
                        placeholder="Enter ticket title"
                        required
                    />
                    <InputError message={errors.title} />
                </div>

                <div>
                    <Label htmlFor="description" required>Description</Label>
                    <RichTextEditor
                        content={data.description}
                        onChange={(value) => setData('description', value)}
                        placeholder="Describe your issue in detail"
                    />
                    <InputError message={errors.description} />
                </div>

                {auth.user?.type === 'superadmin' && (
                    <div>
                        <Label htmlFor="company_id">User</Label>
                        <Select value={data.company_id?.toString() || ''} onValueChange={(value) => setData('company_id', parseInt(value))}>
                            <SelectTrigger>
                                <SelectValue placeholder={companies.length === 0 ? "No users available" : "Select user"} />
                            </SelectTrigger>
                            <SelectContent>
                                {companies.map((company) => (
                                    <SelectItem key={company.id} value={company.id.toString()}>
                                        {company.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {companies.length === 0 && auth.user?.permissions?.includes('create-users') && (
                            <p className="text-xs text-gray-500 mb-1">
                                Create users here. <button onClick={() => router.get(route('users.index'))} className="text-blue-600 hover:underline">Create users</button>
                            </p>
                        )}
                        <InputError message={errors.company_id} />
                    </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <Label htmlFor="category_id">Category</Label>
                        <Select value={data.category_id.toString()} onValueChange={(value) => setData('category_id', parseInt(value))}>
                            <SelectTrigger>
                                <SelectValue placeholder={categories.length === 0 ? "No categories available" : "Select category"} />
                            </SelectTrigger>
                            <SelectContent>
                                {categories.map((category) => (
                                    <SelectItem key={category.id} value={category.id.toString()}>
                                        {category.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {categories.length === 0 && auth.user?.permissions?.includes('create-helpdesk-categories') && (
                            <p className="text-xs text-gray-500 mb-1">
                                Create category here. <button onClick={() => router.get(route('helpdesk-categories.index'))} className="text-blue-600 hover:underline">Create category</button>
                            </p>
                        )}
                        <InputError message={errors.category_id} />
                    </div>

                    <div>
                        <Label htmlFor="priority">Priority</Label>
                        <Select value={data.priority} onValueChange={(value) => setData('priority', value as any)}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="low">Low</SelectItem>
                                <SelectItem value="medium">Medium</SelectItem>
                                <SelectItem value="high">High</SelectItem>
                                <SelectItem value="urgent">Urgent</SelectItem>
                            </SelectContent>
                        </Select>
                        <InputError message={errors.priority} />
                    </div>
                </div>

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
