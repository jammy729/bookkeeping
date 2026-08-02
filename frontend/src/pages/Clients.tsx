import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useClients, useClientMutations } from '../hooks/useClients';
import { type Client, type CreateClientDto, type UpdateClientDto } from '../services/clients.service';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../components/ui/dialog';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Skeleton } from '../components/ui/skeleton';
import { EmptyState } from '../components/ui/EmptyState';
import { toast } from 'sonner';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogFooter, AlertDialogTitle, AlertDialogDescription, AlertDialogAction, AlertDialogCancel } from '../components/ui/alert-dialog';
import { Pencil, Trash2, Plus, Users } from 'lucide-react';

export function Clients() {
  const { t } = useTranslation();
  const { data: clients = [], isLoading: loading } = useClients();
  const { remove: removeClient } = useClientMutations();
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string } | null>(null);

  const handleDelete = (id: string) => {
    setDeleteTarget({ id });
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    try {
      await removeClient.mutateAsync(deleteTarget.id);
      toast.success(t('clients.toast.deleted'));
      setDeleteTarget(null);
    } catch {
      toast.error(t('clients.toast.deleteFailed'));
    }
  };

  const handleEdit = (client: Client) => {
    setSelectedClient(client);
    setIsFormOpen(true);
  };

  const handleAddNew = () => {
    setSelectedClient(null);
    setIsFormOpen(true);
  };

  const activeClients = clients.filter(c => c.isActive).length;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">{t('clients.title')}</h1>
          <p className="text-sm text-muted-foreground">{t('clients.description')}</p>
        </div>
        <Button onClick={handleAddNew}>
          <Plus className="w-4 h-4 mr-2" />
          {t('clients.addClient')}
        </Button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {loading ? (
          <>
            <Skeleton className="h-28" />
            <Skeleton className="h-28" />
          </>
        ) : (
          <>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{t('clients.stats.total')}</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{clients.length}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{t('clients.stats.active')}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">{activeClients}</p>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Clients Table */}
      <Card>
        <CardHeader>
          <CardTitle>{t('clients.list')}</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-14 w-full" />
              ))}
            </div>
          ) : clients.length === 0 ? (
            <EmptyState
              title={t('clients.noClients')}
              description={t('clients.noClientsDesc')}
              action={
                <Button onClick={handleAddNew}>
                  <Plus className="w-4 h-4 mr-2" />
                  {t('clients.addClient')}
                </Button>
              }
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-semibold">{t('clients.table.name')}</th>
                    <th className="text-left py-3 px-4 font-semibold">{t('clients.table.email')}</th>
                    <th className="text-left py-3 px-4 font-semibold">{t('clients.table.phone')}</th>
                    <th className="text-left py-3 px-4 font-semibold">{t('clients.table.status')}</th>
                    <th className="text-right py-3 px-4 font-semibold">{t('clients.table.actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {clients.map((client) => (
                    <tr key={client.id} className="border-b hover:bg-muted/50 transition-colors">
                      <td className="py-3 px-4">
                        <div>
                          <div className="font-medium">{client.name}</div>
                          {client.address && (
                            <div className="text-sm text-muted-foreground">{client.address}</div>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-muted-foreground">{client.email || '-'}</td>
                      <td className="py-3 px-4 text-muted-foreground">{client.phone || '-'}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded text-xs ${client.isActive ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : 'bg-muted text-muted-foreground'}`}>
                          {client.isActive ? t('clients.active') : t('clients.inactive')}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" onClick={() => handleEdit(client)}>
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDelete(client.id)} className="text-destructive hover:text-destructive">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Client Form Dialog */}
      <ClientDialog
        client={selectedClient}
        open={isFormOpen}
        onClose={() => { setIsFormOpen(false); setSelectedClient(null); }}
      />

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('dialog.deleteTitle', { entity: 'client' })}</AlertDialogTitle>
            <AlertDialogDescription>{t('dialog.confirmDelete', { entity: 'client' })}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm}>{t('delete')}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function ClientDialog({
  client,
  open,
  onClose,
}: {
  client: Client | null;
  open: boolean;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const { create, update } = useClientMutations();
  const [formData, setFormData] = useState<CreateClientDto & UpdateClientDto>({
    name: client?.name || '',
    email: client?.email || '',
    phone: client?.phone || '',
    address: client?.address || '',
    notes: client?.notes || '',
    isActive: client?.isActive ?? true,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (client) {
        await update.mutateAsync({ id: client.id, data: formData });
        toast.success(t('clients.toast.updated'));
      } else {
        await create.mutateAsync(formData as CreateClientDto);
        toast.success(t('clients.toast.created'));
      }
      onClose();
    } catch {
      toast.error(client ? t('clients.toast.updateFailed') : t('clients.toast.createFailed'));
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{client ? t('clients.form.titleEdit') : t('clients.form.titleCreate')}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="client-name">{t('clients.form.name')}</Label>
            <Input
              id="client-name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              placeholder={t('clients.form.namePlaceholder')}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="client-email">{t('clients.form.email')}</Label>
            <Input
              id="client-email"
              type="email"
              value={formData.email || ''}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder={t('clients.form.emailPlaceholder')}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="client-phone">{t('clients.form.phone')}</Label>
            <Input
              id="client-phone"
              type="tel"
              value={formData.phone || ''}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder={t('clients.form.phonePlaceholder')}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="client-address">{t('clients.form.address')}</Label>
            <Input
              id="client-address"
              value={formData.address || ''}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder={t('clients.form.addressPlaceholder')}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="client-notes">{t('clients.form.notes')}</Label>
            <Input
              id="client-notes"
              value={formData.notes || ''}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder={t('clients.form.notesPlaceholder')}
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="client-active"
              checked={formData.isActive ?? true}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              className="rounded border-input"
            />
            <Label htmlFor="client-active" className="text-sm font-normal">{t('clients.form.active')}</Label>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>{t('cancel')}</Button>
            <Button type="submit" disabled={create.isPending || update.isPending}>
              {create.isPending || update.isPending ? t('saving') : client ? t('update') : t('create')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
