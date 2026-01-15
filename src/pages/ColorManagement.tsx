import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Save, X, Palette } from 'lucide-react';
import { Button, Input, Modal } from '@/components/ui';
import { colorApi } from '@/lib/tauri';
import { useAppStore } from '@/store/appStore';
import type { Color } from '@/types';

export const ColorManagement: React.FC = () => {
  const { addToast } = useAppStore();
  const [colors, setColors] = useState<Color[]>([]);
  const [loading, setLoading] = useState(true);
  const [newColorName, setNewColorName] = useState('');
  const [newColorCode, setNewColorCode] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingName, setEditingName] = useState('');
  const [editingCode, setEditingCode] = useState('');
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [colorToDelete, setColorToDelete] = useState<Color | null>(null);

  useEffect(() => {
    loadColors();
  }, []);

  const loadColors = async () => {
    try {
      setLoading(true);
      const data = await colorApi.rengSiyahisi();
      setColors(data);
    } catch (error) {
      addToast('error', 'Rənglər yüklənə bilmədi');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async () => {
    if (!newColorName.trim()) {
      addToast('warning', 'Rəng adı daxil edin');
      return;
    }

    try {
      await colorApi.rengElaveEt({
        ad: newColorName.trim(),
        kod: newColorCode.trim() || null
      });
      addToast('success', 'Rəng əlavə edildi');
      setNewColorName('');
      setNewColorCode('');
      loadColors();
    } catch (error) {
      addToast('error', 'Rəng əlavə edilə bilmədi');
    }
  };

  const handleEdit = (color: Color) => {
    setEditingId(color.id);
    setEditingName(color.ad);
    setEditingCode(color.kod || '');
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditingName('');
    setEditingCode('');
  };

  const handleSaveEdit = async () => {
    if (!editingName.trim() || editingId === null) {
      addToast('warning', 'Rəng adı daxil edin');
      return;
    }

    try {
      await colorApi.rengYenile(editingId, editingName.trim(), editingCode.trim() || null);
      addToast('success', 'Rəng yeniləndi');
      setEditingId(null);
      setEditingName('');
      setEditingCode('');
      loadColors();
    } catch (error) {
      addToast('error', 'Rəng yenilənə bilmədi');
    }
  };

  const handleDeleteClick = (color: Color) => {
    setColorToDelete(color);
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!colorToDelete) return;

    try {
      await colorApi.rengSil(colorToDelete.id);
      addToast('success', 'Rəng silindi');
      setDeleteModalOpen(false);
      setColorToDelete(null);
      loadColors();
    } catch (error) {
      addToast('error', 'Rəng silinə bilmədi');
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Rəng İdarəetməsi</h1>
        <p className="text-gray-600 mt-1">Məhsul rənglərini əlavə edin, redaktə edin və ya silin</p>
      </div>

      {/* Add New Color */}
      <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
        <h2 className="text-lg font-semibold mb-3">Yeni Rəng</h2>
        <div className="flex gap-3">
          <Input
            placeholder="Rəng adı..."
            value={newColorName}
            onChange={(e) => setNewColorName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            className="flex-1"
          />
          <Input
            type="color"
            value={newColorCode || '#000000'}
            onChange={(e) => setNewColorCode(e.target.value)}
            className="w-14 h-10 p-1 cursor-pointer"
          />
          <Button onClick={handleAdd}>
            <Plus className="w-4 h-4 mr-2" />
            Əlavə Et
          </Button>
        </div>
      </div>

      {/* Colors List */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-4 border-b">
          <h2 className="text-lg font-semibold">Rənglər ({colors.length})</h2>
        </div>

        {loading ? (
          <div className="p-8 text-center text-gray-500">Yüklənir...</div>
        ) : colors.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <Palette className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>Heç bir rəng yoxdur</p>
          </div>
        ) : (
          <div className="divide-y">
            {colors.map((color) => (
              <div
                key={color.id}
                className="p-4 flex items-center justify-between hover:bg-gray-50"
              >
                {editingId === color.id ? (
                  <div className="flex items-center gap-3 flex-1">
                    <Input
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSaveEdit();
                        if (e.key === 'Escape') handleCancelEdit();
                      }}
                      className="flex-1 max-w-xs"
                      autoFocus
                    />
                    <Input
                      type="color"
                      value={editingCode || '#000000'}
                      onChange={(e) => setEditingCode(e.target.value)}
                      className="w-14 h-10 p-1 cursor-pointer"
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
                      <div
                        className="w-10 h-10 rounded-lg border-2 border-gray-200"
                        style={{ backgroundColor: color.kod || '#e5e7eb' }}
                      />
                      <div>
                        <p className="font-medium text-gray-900">{color.ad}</p>
                        <p className="text-sm text-gray-500">ID: {color.id}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => handleEdit(color)}
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="danger"
                        onClick={() => handleDeleteClick(color)}
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
        title="Rəngi Sil"
        size="sm"
      >
        <div className="p-4">
          <p className="text-gray-600 mb-4">
            <strong>"{colorToDelete?.ad}"</strong> rəngini silmək istədiyinizə əminsiniz?
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
