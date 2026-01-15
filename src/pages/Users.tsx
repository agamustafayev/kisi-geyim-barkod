import React, { useState, useEffect } from 'react';
import { Header } from '@/components/layout';
import { Button, Input, Modal, Table } from '@/components/ui';
import { userApi } from '@/lib/tauri';
import { useAppStore } from '@/store/appStore';
import { formatDate } from '@/lib/utils';
import {
  Plus,
  Edit,
  Trash2,
  UserCheck,
  UserX,
  Shield,
  User as UserIcon,
  RefreshCw,
  Search,
  Lock,
} from 'lucide-react';
import type { User, CreateUser, UpdateUser } from '@/types';

export const Users: React.FC = () => {
  const { addToast, currentUser } = useAppStore();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<User | null>(null);

  const [formData, setFormData] = useState<CreateUser>({
    ad: '',
    soyad: '',
    istifadeci_adi: '',
    sifre: '',
    rol: 'isci',
  });

  const loadUsers = async () => {
    setLoading(true);
    try {
      const data = await userApi.istifadeciSiyahisi();
      setUsers(data);
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const openAddModal = () => {
    setEditingUser(null);
    setFormData({
      ad: '',
      soyad: '',
      istifadeci_adi: '',
      sifre: '',
      rol: 'isci',
    });
    setIsModalOpen(true);
  };

  const openEditModal = (user: User) => {
    setEditingUser(user);
    setFormData({
      ad: user.ad,
      soyad: user.soyad,
      istifadeci_adi: user.istifadeci_adi,
      sifre: '', // Don't show password
      rol: user.rol,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.ad || !formData.soyad || !formData.istifadeci_adi) {
      addToast('error', 'Bütün sahələr tələb olunur');
      return;
    }

    if (!editingUser && !formData.sifre) {
      addToast('error', 'Şifrə tələb olunur');
      return;
    }

    try {
      if (editingUser) {
        const updateData: UpdateUser = {
          ad: formData.ad,
          soyad: formData.soyad,
          istifadeci_adi: formData.istifadeci_adi,
          rol: formData.rol,
        };
        if (formData.sifre) {
          updateData.sifre = formData.sifre;
        }
        await userApi.istifadeciYenile(editingUser.id, updateData);
        addToast('success', 'İstifadəçi yeniləndi');
      } else {
        await userApi.istifadeciElaveEt(formData);
        addToast('success', 'İstifadəçi əlavə edildi');
      }
      setIsModalOpen(false);
      loadUsers();
    } catch (error: any) {
      addToast('error', error.toString());
    }
  };

  const handleToggleActive = async (user: User) => {
    try {
      await userApi.istifadeciYenile(user.id, { aktiv: !user.aktiv });
      addToast('success', user.aktiv ? 'İstifadəçi deaktiv edildi' : 'İstifadəçi aktiv edildi');
      loadUsers();
    } catch (error: any) {
      addToast('error', error.toString());
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    try {
      await userApi.istifadeciSil(deleteConfirm.id);
      addToast('success', 'İstifadəçi silindi');
      setDeleteConfirm(null);
      loadUsers();
    } catch (error: any) {
      addToast('error', error.toString());
    }
  };

  const filteredUsers = users.filter(
    (u) =>
      u.ad.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.soyad.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.istifadeci_adi.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const columns = [
    {
      key: 'name',
      header: 'Ad Soyad',
      render: (user: User) => (
        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-full flex items-center justify-center ${
              user.rol === 'admin'
                ? 'bg-purple-100 text-purple-600'
                : 'bg-blue-100 text-blue-600'
            }`}
          >
            {user.rol === 'admin' ? (
              <Shield className="w-5 h-5" />
            ) : (
              <UserIcon className="w-5 h-5" />
            )}
          </div>
          <div>
            <p className="font-medium text-gray-900">
              {user.ad} {user.soyad}
            </p>
            <p className="text-sm text-gray-500">@{user.istifadeci_adi}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'rol',
      header: 'Rol',
      render: (user: User) => (
        <span
          className={`px-3 py-1 rounded-full text-xs font-medium ${
            user.rol === 'admin'
              ? 'bg-purple-100 text-purple-700'
              : 'bg-blue-100 text-blue-700'
          }`}
        >
          {user.rol === 'admin' ? 'Admin' : 'İşçi'}
        </span>
      ),
    },
    {
      key: 'aktiv',
      header: 'Status',
      render: (user: User) => (
        <span
          className={`px-3 py-1 rounded-full text-xs font-medium ${
            user.aktiv
              ? 'bg-green-100 text-green-700'
              : 'bg-red-100 text-red-700'
          }`}
        >
          {user.aktiv ? 'Aktiv' : 'Deaktiv'}
        </span>
      ),
    },
    {
      key: 'created_at',
      header: 'Yaradılma Tarixi',
      render: (user: User) => formatDate(user.created_at),
    },
    {
      key: 'actions',
      header: 'Əməliyyatlar',
      render: (user: User) => (
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            icon={user.aktiv ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
            onClick={() => handleToggleActive(user)}
            title={user.aktiv ? 'Deaktiv et' : 'Aktiv et'}
            disabled={user.id === currentUser?.id}
          />
          <Button
            variant="ghost"
            size="sm"
            icon={<Edit className="w-4 h-4" />}
            onClick={() => openEditModal(user)}
          />
          <Button
            variant="ghost"
            size="sm"
            icon={<Trash2 className="w-4 h-4 text-red-500" />}
            onClick={() => setDeleteConfirm(user)}
            disabled={user.id === currentUser?.id}
          />
        </div>
      ),
    },
  ];

  return (
    <div className="min-h-screen">
      <Header title="İstifadəçilər" />

      <div className="p-6">
        {/* Actions Bar */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="relative w-80">
              <Input
                placeholder="Axtar..."
                icon={<Search className="w-4 h-4" />}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button
              variant="secondary"
              icon={<RefreshCw className="w-4 h-4" />}
              onClick={loadUsers}
            >
              Yenilə
            </Button>
          </div>
          <Button
            variant="primary"
            icon={<Plus className="w-4 h-4" />}
            onClick={openAddModal}
          >
            Yeni İstifadəçi
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-sm text-gray-500">Ümumi İstifadəçi</p>
            <p className="text-2xl font-bold text-gray-900">{users.length}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-sm text-gray-500">Admin</p>
            <p className="text-2xl font-bold text-purple-600">
              {users.filter((u) => u.rol === 'admin').length}
            </p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-sm text-gray-500">İşçi</p>
            <p className="text-2xl font-bold text-blue-600">
              {users.filter((u) => u.rol === 'isci').length}
            </p>
          </div>
        </div>

        {/* Users Table */}
        <Table
          columns={columns}
          data={filteredUsers}
          keyExtractor={(u) => u.id}
          loading={loading}
          emptyMessage="İstifadəçi tapılmadı"
        />
      </div>

      {/* Add/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingUser ? 'İstifadəçini Redaktə Et' : 'Yeni İstifadəçi'}
        size="md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Ad"
              value={formData.ad}
              onChange={(e) => setFormData({ ...formData, ad: e.target.value })}
              required
            />
            <Input
              label="Soyad"
              value={formData.soyad}
              onChange={(e) => setFormData({ ...formData, soyad: e.target.value })}
              required
            />
          </div>

          <Input
            label="İstifadəçi Adı"
            value={formData.istifadeci_adi}
            onChange={(e) => setFormData({ ...formData, istifadeci_adi: e.target.value })}
            icon={<UserIcon className="w-4 h-4" />}
            required
          />

          <Input
            label={editingUser ? 'Yeni Şifrə (boş buraxsanız dəyişməz)' : 'Şifrə'}
            type="password"
            value={formData.sifre}
            onChange={(e) => setFormData({ ...formData, sifre: e.target.value })}
            icon={<Lock className="w-4 h-4" />}
            required={!editingUser}
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Rol</label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="rol"
                  value="isci"
                  checked={formData.rol === 'isci'}
                  onChange={() => setFormData({ ...formData, rol: 'isci' })}
                  className="w-4 h-4 text-primary-600"
                />
                <span className="flex items-center gap-1">
                  <UserIcon className="w-4 h-4 text-blue-600" />
                  İşçi
                </span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="rol"
                  value="admin"
                  checked={formData.rol === 'admin'}
                  onChange={() => setFormData({ ...formData, rol: 'admin' })}
                  className="w-4 h-4 text-primary-600"
                />
                <span className="flex items-center gap-1">
                  <Shield className="w-4 h-4 text-purple-600" />
                  Admin
                </span>
              </label>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              İşçilər hesabatları və alış qiymətlərini görə bilməz
            </p>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
              Ləğv et
            </Button>
            <Button type="submit">
              {editingUser ? 'Yenilə' : 'Əlavə et'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <Modal
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        title="İstifadəçini Sil"
        size="sm"
      >
        <p className="text-gray-600 mb-6">
          <strong>
            {deleteConfirm?.ad} {deleteConfirm?.soyad}
          </strong>{' '}
          istifadəçisini silmək istədiyinizə əminsiniz?
        </p>
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={() => setDeleteConfirm(null)}>
            Ləğv et
          </Button>
          <Button variant="danger" onClick={handleDelete}>
            Sil
          </Button>
        </div>
      </Modal>
    </div>
  );
};
