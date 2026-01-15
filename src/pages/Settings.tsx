import React, { useState, useEffect } from 'react';
import { Header } from '@/components/layout';
import { Button, Modal } from '@/components/ui';
import { settingsApi, databaseApi } from '@/lib/tauri';
import { useAppStore } from '@/store/appStore';
import { open } from '@tauri-apps/api/dialog';
import { convertFileSrc } from '@tauri-apps/api/tauri';
import { checkUpdate, installUpdate } from '@tauri-apps/api/updater';
import { getVersion } from '@tauri-apps/api/app';
import { relaunch } from '@tauri-apps/api/process';
import {
  Store,
  Phone,
  MapPin,
  Image,
  Save,
  MessageCircle,
  Instagram,
  Music2,
  ExternalLink,
  Loader2,
  Upload,
  X,
  AlertTriangle,
  Database,
  Settings as SettingsIcon,
  RefreshCw,
  Download,
  CheckCircle,
  Info,
} from 'lucide-react';
import type { UpdateSettings } from '@/types';

type TabType = 'magaza' | 'proqram' | 'yenileme' | 'tehluke';

interface UpdateInfo {
  available: boolean;
  currentVersion: string;
  newVersion?: string;
  releaseNotes?: string;
  date?: string;
}

export const SettingsPage: React.FC = () => {
  const { addToast, currentUser } = useAppStore();
  const [activeTab, setActiveTab] = useState<TabType>('magaza');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [confirmText, setConfirmText] = useState('');

  // Update states
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null);
  const [checkingUpdate, setCheckingUpdate] = useState(false);
  const [installing, setInstalling] = useState(false);

  const [formData, setFormData] = useState<UpdateSettings>({
    magaza_adi: '',
    logo_yolu: '',
    telefon: '',
    adres: '',
    whatsapp: '',
    instagram: '',
    tiktok: '',
    olculer_aktiv: true,
    qifil_sifresi: '',
    barkod_capinda_magaza_adi: false,
  });

  const loadSettings = async () => {
    setLoading(true);
    try {
      const data = await settingsApi.parametrleriAl();
      setFormData({
        magaza_adi: data.magaza_adi || '',
        logo_yolu: data.logo_yolu || '',
        telefon: data.telefon || '',
        adres: data.adres || '',
        whatsapp: data.whatsapp || '',
        instagram: data.instagram || '',
        tiktok: data.tiktok || '',
        olculer_aktiv: data.olculer_aktiv ?? true,
        qifil_sifresi: data.qifil_sifresi || '',
        barkod_capinda_magaza_adi: data.barkod_capinda_magaza_adi ?? false,
      });
    } catch (error) {
      console.error('Error loading settings:', error);
      addToast('error', 'Parametrlər yüklənə bilmədi');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
    loadCurrentVersion();
  }, []);

  const loadCurrentVersion = async () => {
    try {
      const version = await getVersion();
      setUpdateInfo({
        available: false,
        currentVersion: version,
      });
    } catch (error) {
      console.error('Error getting version:', error);
    }
  };

  const handleCheckUpdate = async () => {
    setCheckingUpdate(true);
    try {
      const { shouldUpdate, manifest } = await checkUpdate();
      const currentVersion = await getVersion();

      if (shouldUpdate && manifest) {
        setUpdateInfo({
          available: true,
          currentVersion,
          newVersion: manifest.version,
          releaseNotes: manifest.body,
          date: manifest.date,
        });
        addToast('info', `Yeni versiya mövcuddur: v${manifest.version}`);
      } else {
        setUpdateInfo({
          available: false,
          currentVersion,
        });
        addToast('success', 'Proqram ən son versiyadadır');
      }
    } catch (error: any) {
      console.error('Update check error:', error);
      addToast('error', 'Yeniləmə yoxlanarkən xəta baş verdi');
    } finally {
      setCheckingUpdate(false);
    }
  };

  const handleInstallUpdate = async () => {
    setInstalling(true);
    try {
      addToast('info', 'Yeniləmə yüklənir...');
      await installUpdate();
      addToast('success', 'Yeniləmə uğurla yükləndi! Proqram yenidən başladılır...');
      // Restart the app after update
      await relaunch();
    } catch (error: any) {
      console.error('Install update error:', error);
      addToast('error', 'Yeniləmə quraşdırılarkən xəta baş verdi');
    } finally {
      setInstalling(false);
    }
  };

  const handleSelectLogo = async () => {
    try {
      const selected = await open({
        multiple: false,
        filters: [{
          name: 'Şəkillər',
          extensions: ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg']
        }]
      });
      
      if (selected && typeof selected === 'string') {
        setFormData({ ...formData, logo_yolu: selected });
      }
    } catch (error) {
      console.error('Error selecting logo:', error);
    }
  };

  const handleRemoveLogo = () => {
    setFormData({ ...formData, logo_yolu: '' });
  };

  const getLogoSrc = (path: string | null | undefined) => {
    if (!path) return null;
    // Convert local file path to asset URL for Tauri
    if (path.startsWith('http')) return path;
    return convertFileSrc(path);
  };

  const handleSave = async () => {
    // Validation
    if (formData.qifil_sifresi && formData.qifil_sifresi.trim().length > 0 && formData.qifil_sifresi.trim().length < 4) {
      addToast('error', 'Qıfıl şifrəsi ən azı 4 simvol olmalıdır');
      return;
    }

    setSaving(true);
    try {
      await settingsApi.parametrleriYenile({
        magaza_adi: formData.magaza_adi || null,
        logo_yolu: formData.logo_yolu || null,
        telefon: formData.telefon || null,
        adres: formData.adres || null,
        whatsapp: formData.whatsapp || null,
        instagram: formData.instagram || null,
        tiktok: formData.tiktok || null,
        olculer_aktiv: formData.olculer_aktiv ?? null,
        qifil_sifresi: formData.qifil_sifresi && formData.qifil_sifresi.trim().length > 0 ? formData.qifil_sifresi : null,
        barkod_capinda_magaza_adi: formData.barkod_capinda_magaza_adi ?? null,
      });
      addToast('success', 'Parametrlər uğurla yeniləndi!');
      loadSettings(); // Reload to get updated data
    } catch (error: any) {
      addToast('error', error.toString());
    } finally {
      setSaving(false);
    }
  };

  const handleResetDatabase = async () => {
    if (confirmText !== 'SIFIRLA') {
      addToast('error', 'Təsdiq mətni düzgün deyil!');
      return;
    }

    setResetting(true);
    try {
      await databaseApi.databaziSifirla();
      addToast('success', 'Databaza uğurla sıfırlandı!');
      setResetModalOpen(false);
      setConfirmText('');
      // Reload the app
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (error: any) {
      addToast('error', error.toString());
    } finally {
      setResetting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Header title="Parametrlər" />

      <div className="p-6 max-w-4xl mx-auto">
        {/* Tabs */}
        <div className="flex gap-2 mb-6 flex-wrap">
          <button
            onClick={() => setActiveTab('magaza')}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all ${
              activeTab === 'magaza'
                ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/30'
                : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
            }`}
          >
            <Store className="w-5 h-5" />
            Mağaza Parametrləri
          </button>
          <button
            onClick={() => setActiveTab('proqram')}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all ${
              activeTab === 'proqram'
                ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/30'
                : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
            }`}
          >
            <SettingsIcon className="w-5 h-5" />
            Proqram Parametrləri
          </button>
          <button
            onClick={() => setActiveTab('yenileme')}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all ${
              activeTab === 'yenileme'
                ? 'bg-green-500 text-white shadow-lg shadow-green-500/30'
                : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
            }`}
          >
            <Download className="w-5 h-5" />
            Proqram Yeniləmə
            {updateInfo?.available && (
              <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            )}
          </button>
          {currentUser?.rol?.toLowerCase() === 'admin' && (
            <button
              onClick={() => setActiveTab('tehluke')}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all ${
                activeTab === 'tehluke'
                  ? 'bg-red-600 text-white shadow-lg shadow-red-600/30'
                  : 'bg-white text-red-600 hover:bg-red-50 border border-red-200'
              }`}
            >
              <AlertTriangle className="w-5 h-5" />
              Təhlükə Zonası
            </button>
          )}
        </div>

        {/* Mağaza Parametrləri Tab */}
        {activeTab === 'magaza' && (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          {/* Header */}
          <div className="px-6 py-4 bg-gradient-to-r from-slate-800 to-slate-900 text-white">
            <div className="flex items-center gap-3">
              <Store className="w-6 h-6" />
              <div>
                <h2 className="text-lg font-semibold">Mağaza Parametrləri</h2>
                <p className="text-slate-300 text-sm">
                  Mağazanızın əsas məlumatlarını idarə edin
                </p>
              </div>
            </div>
          </div>

          <div className="p-6 space-y-6">
            {/* Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                  <Store className="w-4 h-4" />
                  Mağaza Adı
                </label>
                <input
                  type="text"
                  value={formData.magaza_adi || ''}
                  onChange={(e) => setFormData({ ...formData, magaza_adi: e.target.value })}
                  placeholder="Mağazanızın adını daxil edin"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                  <Phone className="w-4 h-4" />
                  Telefon Nömrəsi
                </label>
                <input
                  type="tel"
                  value={formData.telefon || ''}
                  onChange={(e) => setFormData({ ...formData, telefon: e.target.value })}
                  placeholder="+994 XX XXX XX XX"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Logo */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                <Image className="w-4 h-4" />
                Logo
              </label>
              <div className="flex items-center gap-4">
                {formData.logo_yolu ? (
                  <div className="relative">
                    <img
                      src={getLogoSrc(formData.logo_yolu) || ''}
                      alt="Logo"
                      className="w-24 h-24 rounded-xl object-cover border-2 border-gray-200"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '';
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                    <button
                      onClick={handleRemoveLogo}
                      className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="w-24 h-24 bg-gray-100 rounded-xl border-2 border-dashed border-gray-300 flex items-center justify-center">
                    <Image className="w-8 h-8 text-gray-400" />
                  </div>
                )}
                <div className="flex-1">
                  <Button
                    variant="secondary"
                    onClick={handleSelectLogo}
                    icon={<Upload className="w-4 h-4" />}
                  >
                    Logo Seç
                  </Button>
                  <p className="text-xs text-gray-500 mt-2">
                    PNG, JPG, GIF, WebP və ya SVG formatlarında
                  </p>
                  {formData.logo_yolu && (
                    <p className="text-xs text-gray-400 mt-1 truncate max-w-xs">
                      {formData.logo_yolu}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Address */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                <MapPin className="w-4 h-4" />
                Ünvan
              </label>
              <textarea
                value={formData.adres || ''}
                onChange={(e) => setFormData({ ...formData, adres: e.target.value })}
                placeholder="Mağazanızın tam ünvanını daxil edin"
                rows={2}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
              />
            </div>

            {/* Social Media */}
            <div className="border-t pt-6">
              <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <ExternalLink className="w-4 h-4" />
                Sosial Media Hesabları
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* WhatsApp */}
                <div className="relative">
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                    <MessageCircle className="w-4 h-4 text-green-500" />
                    WhatsApp
                  </label>
                  <input
                    type="text"
                    value={formData.whatsapp || ''}
                    onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                    placeholder="+994XXXXXXXXX"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>

                {/* Instagram */}
                <div className="relative">
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                    <Instagram className="w-4 h-4 text-pink-500" />
                    Instagram
                  </label>
                  <input
                    type="text"
                    value={formData.instagram || ''}
                    onChange={(e) => setFormData({ ...formData, instagram: e.target.value })}
                    placeholder="@username"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  />
                </div>

                {/* TikTok */}
                <div className="relative">
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                    <Music2 className="w-4 h-4 text-gray-900" />
                    TikTok
                  </label>
                  <input
                    type="text"
                    value={formData.tiktok || ''}
                    onChange={(e) => setFormData({ ...formData, tiktok: e.target.value })}
                    placeholder="@username"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            {/* Preview Card */}
            {formData.magaza_adi && (
              <div className="border-t pt-6">
                <h3 className="text-sm font-semibold text-gray-900 mb-4">Önizləmə</h3>
                <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl p-6 border border-slate-200">
                  <div className="flex items-center gap-4">
                    {formData.logo_yolu ? (
                      <img
                        src={getLogoSrc(formData.logo_yolu) || ''}
                        alt="Logo"
                        className="w-16 h-16 rounded-xl object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className="w-16 h-16 bg-primary-500 rounded-xl flex items-center justify-center">
                        <Store className="w-8 h-8 text-white" />
                      </div>
                    )}
                    <div>
                      <h4 className="text-xl font-bold text-gray-900">{formData.magaza_adi}</h4>
                      {formData.telefon && (
                        <p className="text-gray-600 flex items-center gap-1">
                          <Phone className="w-3 h-3" /> {formData.telefon}
                        </p>
                      )}
                      {formData.adres && (
                        <p className="text-gray-500 text-sm flex items-center gap-1 mt-1">
                          <MapPin className="w-3 h-3" /> {formData.adres}
                        </p>
                      )}
                    </div>
                  </div>

                  {(formData.whatsapp || formData.instagram || formData.tiktok) && (
                    <div className="flex items-center gap-4 mt-4 pt-4 border-t border-slate-200">
                      {formData.whatsapp && (
                        <span className="flex items-center gap-1 text-sm text-green-600">
                          <MessageCircle className="w-4 h-4" /> {formData.whatsapp}
                        </span>
                      )}
                      {formData.instagram && (
                        <span className="flex items-center gap-1 text-sm text-pink-600">
                          <Instagram className="w-4 h-4" /> {formData.instagram}
                        </span>
                      )}
                      {formData.tiktok && (
                        <span className="flex items-center gap-1 text-sm text-gray-700">
                          <Music2 className="w-4 h-4" /> {formData.tiktok}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Save Button */}
            <div className="flex justify-end pt-4 border-t">
              <Button
                onClick={handleSave}
                disabled={saving}
                icon={saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                className="px-8"
              >
                {saving ? 'Saxlanılır...' : 'Parametrləri Saxla'}
              </Button>
            </div>
          </div>
        </div>
        )}

        {/* Proqram Parametrləri Tab */}
        {activeTab === 'proqram' && (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          {/* Header */}
          <div className="px-6 py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white">
            <div className="flex items-center gap-3">
              <SettingsIcon className="w-6 h-6" />
              <div>
                <h2 className="text-lg font-semibold">Proqram Parametrləri</h2>
                <p className="text-blue-100 text-sm">
                  Proqramın işləmə qaydasını tənzimləyin
                </p>
              </div>
            </div>
          </div>

          <div className="p-6 space-y-6">
            {/* Sistem Parametrləri */}
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <SettingsIcon className="w-4 h-4" />
                Sistem Parametrləri
              </h3>
              
              <div className="space-y-4">
                {/* Ölçülər aktiv */}
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                  <div>
                    <p className="font-medium text-gray-900">Sistemdə Ölçülər Olsun?</p>
                    <p className="text-sm text-gray-500">
                      Məhsullar üçün ölçü (beden) seçimi aktiv olsun
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="sr-only peer"
                      checked={formData.olculer_aktiv ?? true}
                      onChange={(e) => setFormData({ ...formData, olculer_aktiv: e.target.checked })}
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-500"></div>
                  </label>
                </div>
              </div>
            </div>

            {/* Barkod Parametrləri */}
            <div className="border-t pt-6">
              <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Image className="w-4 h-4" />
                Barkod Çap Parametrləri
              </h3>
              
              <div className="space-y-4">
                {/* Barkodda mağaza adı */}
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                  <div>
                    <p className="font-medium text-gray-900">Barkodda Mağaza Adı Göstərilsin?</p>
                    <p className="text-sm text-gray-500">
                      Barkod çap edərkən mağaza adı etiketdə görünsün
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="sr-only peer"
                      checked={formData.barkod_capinda_magaza_adi ?? false}
                      onChange={(e) => setFormData({ ...formData, barkod_capinda_magaza_adi: e.target.checked })}
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-500"></div>
                  </label>
                </div>
              </div>
            </div>

            {/* Təhlükəsizlik */}
            <div className="border-t pt-6">
              <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                Təhlükəsizlik
              </h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Qıfıl Şifrəsi
                </label>
                <input
                  type="text"
                  value={formData.qifil_sifresi || ''}
                  onChange={(e) => setFormData({ ...formData, qifil_sifresi: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Qıfıl şifrəsini daxil edin"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Bu şifrə proqramı qıfıllamaq üçün istifadə olunacaq
                </p>
              </div>
            </div>

            {/* Saxla düyməsi */}
            <div className="flex justify-end pt-4 border-t">
              <Button
                onClick={handleSave}
                disabled={saving}
                icon={saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                className="px-8"
              >
                {saving ? 'Saxlanılır...' : 'Parametrləri Saxla'}
              </Button>
            </div>

            {/* Info */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-700">
                💡 <strong>Qeyd:</strong> Bu parametrlər proqramın işləməsini dəyişdirəcək. 
                Dəyişikliklər saxlandıqdan sonra tətbiq olunacaq.
              </p>
            </div>
          </div>
        </div>
        )}

        {/* Proqram Yeniləmə Tab */}
        {activeTab === 'yenileme' && (
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4 bg-gradient-to-r from-green-600 to-green-700 text-white">
              <div className="flex items-center gap-3">
                <Download className="w-6 h-6" />
                <div>
                  <h2 className="text-lg font-semibold">Proqram Yeniləmə</h2>
                  <p className="text-green-100 text-sm">
                    Proqramın ən son versiyasını yoxlayın və quraşdırın
                  </p>
                </div>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Current Version */}
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center">
                    <Info className="w-6 h-6 text-primary-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Cari Versiya</p>
                    <p className="text-xl font-bold text-gray-900">
                      v{updateInfo?.currentVersion || '...'}
                    </p>
                  </div>
                </div>
                <Button
                  variant="secondary"
                  onClick={handleCheckUpdate}
                  disabled={checkingUpdate}
                  icon={checkingUpdate ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                >
                  {checkingUpdate ? 'Yoxlanılır...' : 'Yeniləmə Yoxla'}
                </Button>
              </div>

              {/* Update Available */}
              {updateInfo?.available && (
                <div className="border-2 border-green-200 bg-green-50 rounded-xl p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Download className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-lg font-semibold text-green-800">
                          Yeni Versiya Mövcuddur!
                        </h3>
                        <span className="px-2 py-0.5 bg-green-200 text-green-800 text-xs font-medium rounded-full">
                          v{updateInfo.newVersion}
                        </span>
                      </div>
                      {updateInfo.date && (
                        <p className="text-sm text-green-600 mb-3">
                          Buraxılış tarixi: {new Date(updateInfo.date).toLocaleDateString('az-AZ')}
                        </p>
                      )}
                      {updateInfo.releaseNotes && (
                        <div className="bg-white rounded-lg p-4 mb-4 border border-green-200">
                          <p className="text-sm font-medium text-gray-700 mb-2">Dəyişikliklər:</p>
                          <div className="text-sm text-gray-600 whitespace-pre-wrap">
                            {updateInfo.releaseNotes}
                          </div>
                        </div>
                      )}
                      <Button
                        onClick={handleInstallUpdate}
                        disabled={installing}
                        icon={installing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        {installing ? 'Quraşdırılır...' : 'Yeniləməni Quraşdır'}
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* No Update Available */}
              {updateInfo && !updateInfo.available && (
                <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
                  <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                    <CheckCircle className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Proqram Aktual Vəziyyətdədir</p>
                    <p className="text-sm text-gray-500">
                      Siz ən son versiyanı istifadə edirsiniz
                    </p>
                  </div>
                </div>
              )}

              {/* Info */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-700">
                  <strong>Qeyd:</strong> Yeniləmə quraşdırıldıqdan sonra proqram avtomatik olaraq yenidən başladılacaq.
                  Zəhmət olmasa açıq işlərinizi qeyd edin.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Təhlükə Zonası Tab - Admin Only */}
        {activeTab === 'tehluke' && currentUser?.rol?.toLowerCase() === 'admin' && (
          <div className="bg-white rounded-2xl border border-red-200 overflow-hidden">
            <div className="px-6 py-4 bg-gradient-to-r from-red-600 to-red-700 text-white">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-6 h-6" />
                <div>
                  <h2 className="text-lg font-semibold">Təhlükə Zonası</h2>
                  <p className="text-red-100 text-sm">
                    Bu əməliyyatlar geri qaytarıla bilməz!
                  </p>
                </div>
              </div>
            </div>

            <div className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Database className="w-5 h-5 text-red-600" />
                    <h3 className="text-lg font-semibold text-gray-900">
                      Databazanı Sıfırla
                    </h3>
                  </div>
                  <p className="text-gray-600 text-sm mb-2">
                    Bütün məhsullar, satışlar, müştərilər və digər məlumatlar silinəcək.
                  </p>
                  <ul className="text-sm text-gray-500 space-y-1">
                    <li className="flex items-center gap-2">
                      <span className="text-red-500">✗</span>
                      Məhsullar və stok
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-red-500">✗</span>
                      Satışlar və geri qaytarmalar
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-red-500">✗</span>
                      Müştərilər və borc məlumatları
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-red-500">✗</span>
                      Parametrlər (logo, ünvan və s.)
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-green-500">✓</span>
                      İstifadəçilər qalacaq
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-green-500">✓</span>
                      Ölçülər qalacaq
                    </li>
                  </ul>
                </div>
                <Button
                  variant="danger"
                  onClick={() => setResetModalOpen(true)}
                  icon={<AlertTriangle className="w-4 h-4" />}
                  className="ml-4"
                >
                  Sıfırla
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Reset Confirmation Modal */}
      <Modal
        isOpen={resetModalOpen}
        onClose={() => {
          setResetModalOpen(false);
          setConfirmText('');
        }}
        title="Databazanı Sıfırla"
        size="md"
      >
        <div className="space-y-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex gap-3">
              <AlertTriangle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-red-900 mb-1">
                  Bu əməliyyat geri qaytarıla bilməz!
                </h4>
                <p className="text-sm text-red-700">
                  Bütün məhsullar, satışlar, müştərilər və digər məlumatlar həmişəlik silinəcək.
                  Yalnız istifadəçilər və ölçülər qalacaq.
                </p>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Təsdiq etmək üçün <span className="font-bold text-red-600">SIFIRLA</span> yazın:
            </label>
            <input
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="SIFIRLA yazın"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent font-mono text-center text-lg"
              autoComplete="off"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              variant="secondary"
              onClick={() => {
                setResetModalOpen(false);
                setConfirmText('');
              }}
              disabled={resetting}
            >
              Ləğv et
            </Button>
            <Button
              variant="danger"
              onClick={handleResetDatabase}
              disabled={confirmText !== 'SIFIRLA' || resetting}
              icon={resetting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Database className="w-4 h-4" />}
            >
              {resetting ? 'Sıfırlanır...' : 'Databazanı Sıfırla'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
