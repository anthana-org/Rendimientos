import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { UserService } from '../services/userService';
import type { UserData } from '../services/userService';
import { updateEmail, updatePassword, reauthenticateWithCredential, EmailAuthProvider } from 'firebase/auth';
import { auth } from '../firebase';

export default function UserProfile() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  
  const [formData, setFormData] = useState<UserData>({
    email: '',
    displayName: '',
    phoneNumber: '',
    address: '',
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    loadUserData();
  }, [user]);

  const loadUserData = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const result = await UserService.getUser(user.uid);
      if (result.success && result.data) {
        setFormData({
          email: result.data.email || user.email || '',
          displayName: result.data.displayName || '',
          phoneNumber: result.data.phoneNumber || '',
          address: result.data.address || '',
        });
      } else {
        // Si no existe en Firestore, inicializar con datos de Auth
        setFormData({
          email: user.email || '',
          displayName: user.displayName || '',
          phoneNumber: '',
          address: '',
        });
      }
    } catch (error) {
      console.error('Error cargando datos del usuario:', error);
      setMessage({ type: 'error', text: 'Error al cargar los datos del usuario' });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
    setMessage(null);
  };

  const handleSaveProfile = async () => {
    if (!user) return;

    setSaving(true);
    setMessage(null);

    try {
      // Actualizar email si cambió (requiere reautenticación)
      if (formData.email !== user.email) {
        try {
          await updateEmail(user, formData.email);
        } catch (error: any) {
          if (error.code === 'auth/requires-recent-login') {
            setMessage({ 
              type: 'error', 
              text: 'Por seguridad, necesitas reautenticarte para cambiar el email. Por favor, cierra sesión y vuelve a iniciar sesión.' 
            });
            setSaving(false);
            return;
          }
          throw error;
        }
      }

      // Actualizar datos en Firestore
      const result = await UserService.createOrUpdateUser(user.uid, {
        email: formData.email,
        displayName: formData.displayName || undefined,
        phoneNumber: formData.phoneNumber || undefined,
        address: formData.address || undefined,
      });

      if (result.success) {
        setMessage({ type: 'success', text: 'Perfil actualizado correctamente' });
      } else {
        setMessage({ type: 'error', text: result.error || 'Error al actualizar el perfil' });
      }
    } catch (error: any) {
      console.error('Error guardando perfil:', error);
      setMessage({ 
        type: 'error', 
        text: error.message || 'Error al guardar los cambios' 
      });
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (!user || !auth) return;

    // Validaciones
    if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
      setMessage({ type: 'error', text: 'Por favor completa todos los campos' });
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setMessage({ type: 'error', text: 'Las contraseñas nuevas no coinciden' });
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setMessage({ type: 'error', text: 'La contraseña debe tener al menos 6 caracteres' });
      return;
    }

    setChangingPassword(true);
    setMessage(null);

    try {
      // Reautenticar al usuario
      const credential = EmailAuthProvider.credential(
        user.email || '',
        passwordData.currentPassword
      );
      await reauthenticateWithCredential(user, credential);

      // Actualizar contraseña
      await updatePassword(user, passwordData.newPassword);

      setMessage({ type: 'success', text: 'Contraseña cambiada correctamente' });
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    } catch (error: any) {
      console.error('Error cambiando contraseña:', error);
      let errorMessage = 'Error al cambiar la contraseña';
      
      if (error.code === 'auth/wrong-password') {
        errorMessage = 'La contraseña actual es incorrecta';
      } else if (error.code === 'auth/weak-password') {
        errorMessage = 'La contraseña es demasiado débil';
      } else if (error.code === 'auth/requires-recent-login') {
        errorMessage = 'Por seguridad, necesitas volver a iniciar sesión';
      }

      setMessage({ type: 'error', text: errorMessage });
    } finally {
      setChangingPassword(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Mi Perfil</h1>
        <p className="text-gray-400">Administra tu información personal y configuración de cuenta</p>
      </div>

      {message && (
        <div
          className={`mb-6 p-4 rounded-lg ${
            message.type === 'success'
              ? 'bg-green-900/30 border border-green-500 text-green-400'
              : 'bg-red-900/30 border border-red-500 text-red-400'
          }`}
        >
          {message.text}
        </div>
      )}

      <div className="space-y-6">
        {/* Información Personal */}
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-white mb-6">Información Personal</h2>

          <div className="space-y-4">
            <div>
              <label htmlFor="displayName" className="block text-sm font-medium text-gray-300 mb-2">
                Nombre Completo
              </label>
              <input
                type="text"
                id="displayName"
                name="displayName"
                value={formData.displayName}
                onChange={handleInputChange}
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500"
                placeholder="Ingresa tu nombre completo"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                Correo Electrónico
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500"
                placeholder="tu@email.com"
              />
              <p className="mt-1 text-sm text-gray-500">
                Si cambias el email, necesitarás reautenticarte
              </p>
            </div>

            <div>
              <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-300 mb-2">
                Número de Celular
              </label>
              <input
                type="tel"
                id="phoneNumber"
                name="phoneNumber"
                value={formData.phoneNumber}
                onChange={handleInputChange}
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500"
                placeholder="+52 123 456 7890"
              />
            </div>

            <div>
              <label htmlFor="address" className="block text-sm font-medium text-gray-300 mb-2">
                Dirección
              </label>
              <input
                type="text"
                id="address"
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500"
                placeholder="Calle, número, colonia, ciudad, estado"
              />
            </div>
          </div>

          <div className="mt-6">
            <button
              onClick={handleSaveProfile}
              disabled={saving}
              className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Guardando...' : 'Guardar Cambios'}
            </button>
          </div>
        </div>

        {/* Cambiar Contraseña */}
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-white mb-6">Cambiar Contraseña</h2>

          <div className="space-y-4">
            <div>
              <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-300 mb-2">
                Contraseña Actual
              </label>
              <input
                type="password"
                id="currentPassword"
                value={passwordData.currentPassword}
                onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500"
                placeholder="Ingresa tu contraseña actual"
              />
            </div>

            <div>
              <label htmlFor="newPassword" className="block text-sm font-medium text-gray-300 mb-2">
                Nueva Contraseña
              </label>
              <input
                type="password"
                id="newPassword"
                value={passwordData.newPassword}
                onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500"
                placeholder="Mínimo 6 caracteres"
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-300 mb-2">
                Confirmar Nueva Contraseña
              </label>
              <input
                type="password"
                id="confirmPassword"
                value={passwordData.confirmPassword}
                onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500"
                placeholder="Confirma tu nueva contraseña"
              />
            </div>
          </div>

          <div className="mt-6">
            <button
              onClick={handleChangePassword}
              disabled={changingPassword}
              className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {changingPassword ? 'Cambiando...' : 'Cambiar Contraseña'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}


