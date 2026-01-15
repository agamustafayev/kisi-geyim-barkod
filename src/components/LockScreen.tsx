import React, { useState, useEffect } from 'react';
import { useAppStore } from '@/store/appStore';
import { settingsApi, userApi } from '@/lib/tauri';
import { Lock, Unlock, AlertTriangle, User } from 'lucide-react';
import { Button } from './ui';

export const LockScreen: React.FC = () => {
  const { isScreenLocked, unlockScreen, currentUser } = useAppStore();
  const [lockPassword, setLockPassword] = useState('');
  const [userPassword, setUserPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [useUserPassword, setUseUserPassword] = useState(false);
  const [qifilSifresi, setQifilSifresi] = useState<string | null>(null);

  useEffect(() => {
    const loadLockPassword = async () => {
      try {
        const settings = await settingsApi.parametrleriAl();
        setQifilSifresi(settings.qifil_sifresi);
      } catch (error) {
        console.error('Error loading settings:', error);
      }
    };
    
    if (isScreenLocked) {
      loadLockPassword();
    }
  }, [isScreenLocked]);

  const handleUnlock = async () => {
    setError('');
    
    if (useUserPassword) {
      // İstifadəçi parolu ilə açmaq
      if (!userPassword.trim()) {
        setError('İstifadəçi parolunu daxil edin');
        return;
      }

      setLoading(true);
      try {
        await userApi.girisYap({
          istifadeci_adi: currentUser?.istifadeci_adi || '',
          sifre: userPassword,
        });
        unlockScreen();
        setUserPassword('');
        setError('');
      } catch (err) {
        setError('İstifadəçi parolu yanlışdır');
      } finally {
        setLoading(false);
      }
    } else {
      // Qıfıl şifrəsi ilə açmaq
      if (!lockPassword.trim()) {
        setError('Qıfıl şifrəsini daxil edin');
        return;
      }

      if (lockPassword.length < 4) {
        setError('Qıfıl şifrəsi ən azı 4 simvol olmalıdır');
        return;
      }

      if (!qifilSifresi) {
        setError('Qıfıl şifrəsi təyin edilməyib. İstifadəçi parolu ilə daxil olun.');
        return;
      }

      if (lockPassword === qifilSifresi) {
        unlockScreen();
        setLockPassword('');
        setError('');
      } else {
        setError('Qıfıl şifrəsi yanlışdır');
      }
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleUnlock();
    }
  };

  if (!isScreenLocked) return null;

  return (
    <div className="fixed inset-0 z-[9999] bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
          backgroundSize: '40px 40px'
        }} />
      </div>

      {/* Lock Card */}
      <div className="relative w-full max-w-md mx-4">
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-8 py-10 text-center">
            <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-4">
              <Lock className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Ekran Qıfıldadır</h2>
            <p className="text-blue-100 text-sm">
              Davam etmək üçün qıfılı açın
            </p>
          </div>

          {/* Content */}
          <div className="p-8">
            {/* User Info */}
            {currentUser && (
              <div className="flex items-center gap-3 mb-6 p-4 bg-gray-50 rounded-xl">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
                  {currentUser.ad[0]}{currentUser.soyad[0]}
                </div>
                <div>
                  <p className="font-semibold text-gray-900">
                    {currentUser.ad} {currentUser.soyad}
                  </p>
                  <p className="text-sm text-gray-500">@{currentUser.istifadeci_adi}</p>
                </div>
              </div>
            )}

            {/* Toggle Method */}
            <div className="flex gap-2 mb-6">
              <button
                onClick={() => {
                  setUseUserPassword(false);
                  setError('');
                  setUserPassword('');
                }}
                className={`flex-1 px-4 py-2.5 rounded-lg font-medium text-sm transition-all ${
                  !useUserPassword
                    ? 'bg-blue-600 text-white shadow-lg'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <Lock className="w-4 h-4 inline mr-2" />
                Qıfıl Şifrəsi
              </button>
              <button
                onClick={() => {
                  setUseUserPassword(true);
                  setError('');
                  setLockPassword('');
                }}
                className={`flex-1 px-4 py-2.5 rounded-lg font-medium text-sm transition-all ${
                  useUserPassword
                    ? 'bg-blue-600 text-white shadow-lg'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <User className="w-4 h-4 inline mr-2" />
                İstifadəçi Parolu
              </button>
            </div>

            {/* Input */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {useUserPassword ? 'İstifadəçi Parolu' : 'Qıfıl Şifrəsi'}
              </label>
              <input
                type="password"
                value={useUserPassword ? userPassword : lockPassword}
                onChange={(e) => {
                  if (useUserPassword) {
                    setUserPassword(e.target.value);
                  } else {
                    setLockPassword(e.target.value);
                  }
                  setError('');
                }}
                onKeyPress={handleKeyPress}
                placeholder={useUserPassword ? 'Parolunuzu daxil edin' : 'Qıfıl şifrəsini daxil edin (min 4 simvol)'}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
                autoFocus
              />
              {!useUserPassword && !qifilSifresi && (
                <p className="text-xs text-orange-600 mt-2 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  Qıfıl şifrəsi təyin edilməyib. İstifadəçi parolunu istifadə edin.
                </p>
              )}
            </div>

            {/* Error */}
            {error && (
              <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  {error}
                </p>
              </div>
            )}

            {/* Unlock Button */}
            <Button
              onClick={handleUnlock}
              disabled={loading}
              className="w-full py-3 text-lg"
              icon={loading ? <Lock className="w-5 h-5 animate-pulse" /> : <Unlock className="w-5 h-5" />}
            >
              {loading ? 'Yoxlanılır...' : 'Qıfılı Aç'}
            </Button>

            {/* Hint */}
            <p className="text-xs text-gray-500 text-center mt-4">
              {useUserPassword 
                ? 'Qıfıl şifrəsini unutmusunuzsa, istifadəçi parolunuzla daxil ola bilərsiniz'
                : 'Şifrəni unutmusunuzsa, yuxarıdan İstifadəçi Parolu seçin'
              }
            </p>
          </div>
        </div>

        {/* Info */}
        <div className="text-center mt-6 text-white/80 text-sm">
          <p>💡 F5 düyməsi ilə də ekranı qıfıllaya bilərsiniz</p>
        </div>
      </div>
    </div>
  );
};
