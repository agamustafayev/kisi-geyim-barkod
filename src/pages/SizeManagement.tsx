import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, X, Ruler, Check } from 'lucide-react';
import { Button, Input, Modal, Table } from '@/components/ui';
import { sizeApi } from '@/lib/tauri';
import { useAppStore } from '@/store/appStore';
import type { Size } from '@/types';

export const SizeManagement: React.FC = () => {
  const { addToast } = useAppStore();
  const [sizes, setSizes] = useState<Size[]>([]);
  const [loading, setLoading] = useState(true);
  const [newSizeName, setNewSizeName] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingName, setEditingName] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [sizeToDelete, setSizeToDelete] = useState<Size | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    loadSizes();
  }, []);

  const loadSizes = async () => {
    try {
      setLoading(true);
      const data = await sizeApi.olcuSiyahisi();
      // Sort: text first, then numeric
      const sorted = data.sort((a, b) => {
        const aIsNum = !isNaN(Number(a.olcu));
        const bIsNum = !isNaN(Number(b.olcu));
        
        if (aIsNum !== bIsNum) return aIsNum ? 1 : -1;
        if (aIsNum && bIsNum) return Number(a.olcu) - Number(b.olcu);
        return a.olcu.localeCompare(b.olcu);
      });
      setSizes(sorted);
    } catch (error) {
      addToast('error', 'Ölçülər yüklənə bilmədi');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async () => {
    if (!newSizeName.trim()) {
      addToast('warning', 'Ölçü adı daxil edin');
      return;
    }

    try {
      setIsAdding(true);
      await sizeApi.olcuElaveEt({ olcu: newSizeName.trim() });
      addToast('success', 'Ölçü əlavə edildi');
      setNewSizeName('');
      await loadSizes();
    } catch (error) {
      console.error('Error adding size:', error);
      addToast('error', 'Ölçü əlavə edilə bilmədi: ' + (error instanceof Error ? error.message : 'Xəta baş verdi'));
    } finally {
      setIsAdding(false);
    }
  };

  const handleEdit = (size: Size) => {
    setEditingId(size.id);
    setEditingName(size.olcu);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditingName('');
  };

  const handleSaveEdit = async () => {
    if (!editingName.trim() || editingId === null) {
      addToast('warning', 'Ölçü adı daxil edin');
      return;
    }

    try {
      setIsEditing(true);
      await sizeApi.olcuYenile(editingId, editingName.trim());
      addToast('success', 'Ölçü yeniləndi');
      setEditingId(null);
      setEditingName('');
      await loadSizes();
    } catch (error) {
      console.error('Error updating size:', error);
      addToast('error', 'Ölçü yenilənə bilmədi: ' + (error instanceof Error ? error.message : 'Xəta baş verdi'));
    } finally {
      setIsEditing(false);
    }
  };

  const handleDeleteClick = (size: Size) => {
    setSizeToDelete(size);
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!sizeToDelete) return;

    try {
      setIsDeleting(true);
      await sizeApi.olcuSil(sizeToDelete.id);
      addToast('success', 'Ölçü silindi');
      setDeleteModalOpen(false);
      setSizeToDelete(null);
      await loadSizes();
    } catch (error) {
      console.error('Error deleting size:', error);
      addToast('error', 'Ölçü silinə bilmədi: ' + (error instanceof Error ? error.message : 'Bu ölçü məhsullarda istifadə oluna bilər'));
    } finally {
      setIsDeleting(false);
    }
  };

  const columns = [
    {
      key: 'olcu',
      header: 'Ölçü Adı',
      sortable: true,
      render: (size: Size) => (
        editingId === size.id ? (
          <Input
            value={editingName}
            onChange={(e) => setEditingName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSaveEdit();
              if (e.key === 'Escape') handleCancelEdit();
            }}
            placeholder="Ölçü adını daxil edin..."
            autoFocus
            className="w-full"
          />
        ) : (
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-primary-100 to-primary-50 text-primary-700 rounded-lg flex items-center justify-center font-bold border border-primary-200">
              {size.olcu}
            </div>
            <span className="font-medium text-gray-900">{size.olcu}</span>
          </div>
        )
      ),
    },
    {
      key: 'type',
      header: 'Tip',
      sortable: false,
      render: (size: Size) => {
        const isNumeric = !isNaN(Number(size.olcu));
        return (
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
            isNumeric
              ? 'bg-green-100 text-green-700'
              : 'bg-blue-100 text-blue-700'
          }`}>
            {isNumeric ? 'Rəqəm' : 'Hərf'}
          </span>
        );
      },
    },
    {
      key: 'actions',
      header: 'Əməliyyatlar',
      sortable: false,
      render: (size: Size) => (
        editingId === size.id ? (
          <div className="flex items-center gap-2 justify-center">
            <button
              onClick={handleSaveEdit}
              disabled={isEditing}
              className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors disabled:opacity-50"
              title="Yadda saxla"
            >
              <Check className="w-5 h-5" />
            </button>
            <button
              onClick={handleCancelEdit}
              disabled={isEditing}
              className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
              title="Ləğv et"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2 justify-center">
            <button
              onClick={() => handleEdit(size)}
              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              title="Redaktə et"
            >
              <Edit2 className="w-5 h-5" />
            </button>
            <button
              onClick={() => handleDeleteClick(size)}
              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              title="Sil"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          </div>
        )
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center">
              <Ruler className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900">Ölçü İdarəetməsi</h1>
          </div>
          <p className="text-gray-600">Məhsul ölçülərini cədvəl şəklində idarə edin</p>
        </div>

        {/* Add New Size Section */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Yeni Ölçü Əlavə Et</h2>
          <div className="flex gap-3">
            <Input
              placeholder="Ölçü adını daxil edin (məs: XXXXL, 52, 3XL, XS)..."
              value={newSizeName}
              onChange={(e) => setNewSizeName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !isAdding) handleAdd();
              }}
              disabled={isAdding}
              className="flex-1"
            />
            <Button
              onClick={handleAdd}
              disabled={isAdding || !newSizeName.trim()}
              className="px-6"
            >
              <Plus className="w-5 h-5 mr-2" />
              {isAdding ? 'Əlavə olunur...' : 'Əlavə Et'}
            </Button>
          </div>
        </div>

        {/* Table Section */}
        {loading ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-12 text-center">
            <div className="inline-flex items-center justify-center w-14 h-14 bg-primary-100 rounded-full mb-4">
              <Ruler className="w-7 h-7 text-primary-600 animate-pulse" />
            </div>
            <p className="text-gray-500 font-medium">Yüklənir...</p>
          </div>
        ) : sizes.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-12 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
              <Ruler className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-gray-500 font-medium mb-1">Heç bir ölçü yoxdur</p>
            <p className="text-gray-400 text-sm">Yuxarıdakı forma vasitəsilə ilk ölçünüzü əlavə edin</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <Table
              data={sizes}
              columns={columns}
              keyExtractor={(size) => size.id}
            />
          </div>
        )}

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={() => !isDeleting && setDeleteModalOpen(false)}
        title="Ölçünü Sil"
        size="sm"
      >
        <div className="p-6">
          <div className="mb-6">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-red-100 rounded-full mb-3">
              <Trash2 className="w-6 h-6 text-red-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Ölçünü Sil</h3>
            <p className="text-gray-600">
              <strong>"{sizeToDelete?.olcu}"</strong> ölçüsünü silmək istədiyinizə əminsiniz?
            </p>
            <p className="text-sm text-orange-600 mt-3 bg-orange-50 p-3 rounded-lg">
              ⚠️ Bu ölçü məhsullarda istifadə olunursa silinə bilməyəcəkdir.
            </p>
          </div>
          <div className="flex gap-3">
            <Button
              variant="secondary"
              className="flex-1"
              onClick={() => setDeleteModalOpen(false)}
              disabled={isDeleting}
            >
              Ləğv Et
            </Button>
            <Button
              variant="danger"
              className="flex-1"
              onClick={handleConfirmDelete}
              disabled={isDeleting}
            >
              {isDeleting ? 'Silinir...' : 'Sil'}
            </Button>
          </div>
        </div>
      </Modal>
        </div>
    </div>
  );
};
