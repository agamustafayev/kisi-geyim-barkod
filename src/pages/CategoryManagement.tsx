import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Save, X, Tag } from 'lucide-react';
import { Button, Input, Modal } from '@/components/ui';
import { categoryApi } from '@/lib/tauri';
import { useAppStore } from '@/store/appStore';
import type { Category } from '@/types';

export const CategoryManagement: React.FC = () => {
  const { addToast } = useAppStore();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingName, setEditingName] = useState('');
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      setLoading(true);
      const data = await categoryApi.kateqoriyaSiyahisi();
      setCategories(data);
    } catch (error) {
      addToast('error', 'Kateqoriyalar yüklənə bilmədi');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async () => {
    if (!newCategoryName.trim()) {
      addToast('warning', 'Kateqoriya adı daxil edin');
      return;
    }

    try {
      await categoryApi.kateqoriyaElaveEt({ ad: newCategoryName.trim() });
      addToast('success', 'Kateqoriya əlavə edildi');
      setNewCategoryName('');
      loadCategories();
    } catch (error) {
      addToast('error', 'Kateqoriya əlavə edilə bilmədi');
    }
  };

  const handleEdit = (category: Category) => {
    setEditingId(category.id);
    setEditingName(category.ad);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditingName('');
  };

  const handleSaveEdit = async () => {
    if (!editingName.trim() || editingId === null) {
      addToast('warning', 'Kateqoriya adı daxil edin');
      return;
    }

    try {
      await categoryApi.kateqoriyaYenile(editingId, editingName.trim());
      addToast('success', 'Kateqoriya yeniləndi');
      setEditingId(null);
      setEditingName('');
      loadCategories();
    } catch (error) {
      addToast('error', 'Kateqoriya yenilənə bilmədi');
    }
  };

  const handleDeleteClick = (category: Category) => {
    setCategoryToDelete(category);
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!categoryToDelete) return;

    try {
      await categoryApi.kateqoriyaSil(categoryToDelete.id);
      addToast('success', 'Kateqoriya silindi');
      setDeleteModalOpen(false);
      setCategoryToDelete(null);
      loadCategories();
    } catch (error) {
      addToast('error', 'Kateqoriya silinə bilmədi. Bu kateqoriyaya aid məhsullar ola bilər.');
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Kateqoriya İdarəetməsi</h1>
        <p className="text-gray-600 mt-1">Məhsul kateqoriyalarını əlavə edin, redaktə edin və ya silin</p>
      </div>

      {/* Add New Category */}
      <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
        <h2 className="text-lg font-semibold mb-3">Yeni Kateqoriya</h2>
        <div className="flex gap-3">
          <Input
            placeholder="Kateqoriya adı..."
            value={newCategoryName}
            onChange={(e) => setNewCategoryName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            className="flex-1"
          />
          <Button onClick={handleAdd}>
            <Plus className="w-4 h-4 mr-2" />
            Əlavə Et
          </Button>
        </div>
      </div>

      {/* Categories List */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-4 border-b">
          <h2 className="text-lg font-semibold">Kateqoriyalar ({categories.length})</h2>
        </div>

        {loading ? (
          <div className="p-8 text-center text-gray-500">Yüklənir...</div>
        ) : categories.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <Tag className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>Heç bir kateqoriya yoxdur</p>
          </div>
        ) : (
          <div className="divide-y">
            {categories.map((category) => (
              <div
                key={category.id}
                className="p-4 flex items-center justify-between hover:bg-gray-50"
              >
                {editingId === category.id ? (
                  <div className="flex items-center gap-3 flex-1">
                    <Input
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSaveEdit();
                        if (e.key === 'Escape') handleCancelEdit();
                      }}
                      className="flex-1 max-w-md"
                      autoFocus
                    />
                    <Button size="sm" onClick={handleSaveEdit}>
                      <Save className="w-4 h-4" />
                    </Button>
                    <Button size="sm" variant="secondary" onClick={handleCancelEdit}>
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                        <Tag className="w-5 h-5 text-primary-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{category.ad}</p>
                        <p className="text-sm text-gray-500">
                          ID: {category.id}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => handleEdit(category)}
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="danger"
                        onClick={() => handleDeleteClick(category)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Kateqoriyanı Sil"
        size="sm"
      >
        <div className="p-4">
          <p className="text-gray-600 mb-4">
            <strong>"{categoryToDelete?.ad}"</strong> kateqoriyasını silmək istədiyinizə əminsiniz?
          </p>
          <p className="text-sm text-red-600 mb-4">
            Bu kateqoriyaya aid məhsullar varsa, silmə əməliyyatı uğursuz ola bilər.
          </p>
          <div className="flex gap-3">
            <Button
              variant="secondary"
              className="flex-1"
              onClick={() => setDeleteModalOpen(false)}
            >
              Ləğv Et
            </Button>
            <Button
              variant="danger"
              className="flex-1"
              onClick={handleConfirmDelete}
            >
              Sil
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
