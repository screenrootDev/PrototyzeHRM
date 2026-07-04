import { DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useForm, usePage } from '@inertiajs/react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import InputError from "@/components/input-error";
import { EditHelpdeskTicketProps, EditHelpdeskTicketFormData } from './types';

export default function Edit({ ticket, onSuccess }: { ticket: any; onSuccess: () => void }) {
    const { categories, companies, auth } = usePage<any>().props;
        const { data, setData, put, processing, errors } = useForm<EditHelpdeskTicketFormData>({
        title: ticket.title || '',
        description: ticket.description || '',
        status: ticket.status || 'open',
        priority: ticket.priority || 'medium',
        category_id: ticket.category_id || 0,

    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        put(route('helpdesk-tickets.update', ticket.id), {
            onSuccess: () => {
                onSuccess();
            }
        });
    };

    return (
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Edit Support Ticket</DialogTitle>
            </DialogHeader>
            <form onSubmit={submit} className="space-y-4">
                <div>
                    <Label htmlFor="edit_title">Title</Label>
                    <Input
                        id="edit_title"
                        value={data.title}
                        onChange={(e) => setData('title', e.target.value)}
                        placeholder="Enter ticket title"
                        required
                    />
                    <InputError message={errors.title} />
                </div>

                <div>
                    <Label htmlFor="edit_description" required>Description</Label>
                    <RichTextEditor
                        content={data.description || ''}
                        onChange={(value) => setData('description', value)}
                        placeholder="Describe your issue in detail"
                    />
                    <InputError message={errors.description} />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <Label htmlFor="edit_status">Status</Label>
                        <Select value={data.status} onValueChange={(value) => setData('status', value as any)}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="open">Open</SelectItem>
                                <SelectItem value="in_progress">In Progress</SelectItem>
                                <SelectItem value="resolved">Resolved</SelectItem>
                                <SelectItem value="closed">Closed</SelectItem>
                            </SelectContent>
                        </Select>
                        <InputError message={errors.status} />
                    </div>

                    <div>
                        <Label htmlFor="edit_priority">Priority</Label>
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

                <div>
                    <Label htmlFor="edit_category_id">Category</Label>
                    <Select value={data.category_id?.toString()} onValueChange={(value) => setData('category_id', parseInt(value))}>
                        <SelectTrigger>
                            <SelectValue placeholder={categories?.length === 0 ? "No categories available" : "Select category"} />
                        </SelectTrigger>
                        <SelectContent>
                            {categories?.map((category: any) => (
                                <SelectItem key={category.id} value={category.id.toString()}>
                                    {category.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <InputError message={errors.category_id} />
                </div>

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
