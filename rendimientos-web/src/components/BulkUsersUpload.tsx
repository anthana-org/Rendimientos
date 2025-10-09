import { useState } from 'react';
import { UserService } from '../services/userService';

interface BulkUsersUploadProps {
  onUsersCreated: () => void;
  loading: boolean;
  setLoading: (loading: boolean) => void;
  setError: (error: string) => void;
  setSuccessMessage: (message: string) => void;
}

export function BulkUsersUpload({ onUsersCreated, loading, setLoading, setError, setSuccessMessage }: BulkUsersUploadProps) {
  const [bulkUsersFile, setBulkUsersFile] = useState<File | null>(null);
  const [bulkUsersPreview, setBulkUsersPreview] = useState<any[]>([]);
  const [showBulkUsersPreview, setShowBulkUsersPreview] = useState(false);

  const handleBulkUsersFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      setError('Por favor selecciona un archivo Excel (.xlsx o .xls)');
      return;
    }

    try {
      setLoading(true);
      setError('');

      // Leer el archivo Excel
      const XLSX = await import('xlsx');
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);

      // Validar que el archivo tenga las columnas necesarias
      if (jsonData.length === 0) {
        setError('El archivo está vacío');
        return;
      }

      const firstRow = jsonData[0] as any;
      const requiredColumns = ['email', 'password'];
      const missingColumns = requiredColumns.filter(col => !(col in firstRow));
      
      if (missingColumns.length > 0) {
        setError(`Faltan las siguientes columnas: ${missingColumns.join(', ')}`);
        return;
      }

      // Procesar los datos
      const users = jsonData.map((row: any, index: number) => ({
        email: row.email?.toString().trim(),
        password: row.password?.toString().trim(),
        displayName: row.displayName?.toString().trim() || row.email?.toString().trim(),
        phoneNumber: row.phoneNumber?.toString().trim() || '',
        rowNumber: index + 2 // +2 porque empezamos desde la fila 2 (después del header)
      })).filter(user => user.email && user.password);

      if (users.length === 0) {
        setError('No se encontraron usuarios válidos en el archivo');
        return;
      }

      setBulkUsersFile(file);
      setBulkUsersPreview(users);
      setShowBulkUsersPreview(true);
      setSuccessMessage(`✅ Se encontraron ${users.length} usuarios válidos en el archivo`);

    } catch (err: any) {
      console.error('Error procesando archivo:', err);
      setError('Error procesando el archivo: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleBulkCreateUsers = async () => {
    if (bulkUsersPreview.length === 0) return;

    try {
      setLoading(true);
      setError('');

      const results = await UserService.createBulkUsers(bulkUsersPreview);
      
      if (results.success) {
        setSuccessMessage(
          `✅ Se crearon ${results.createdCount} usuarios exitosamente. ` +
          `${results.skippedCount} usuarios fueron omitidos (emails duplicados).`
        );
        
        // Limpiar el formulario
        setBulkUsersFile(null);
        setBulkUsersPreview([]);
        setShowBulkUsersPreview(false);
        
        // Recargar la lista de usuarios
        onUsersCreated();
      } else {
        setError(results.error || 'Error creando usuarios');
      }

    } catch (err: any) {
      console.error('Error creando usuarios:', err);
      setError('Error creando usuarios: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-4 lg:p-6">
      <h3 className="text-xl font-semibold text-gray-900 mb-4">📁 Carga Masiva de Usuarios</h3>
      <p className="text-gray-600 mb-4">
        Sube un archivo Excel (.xlsx) con las columnas: email, password, displayName (opcional), phoneNumber (opcional)
      </p>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Seleccionar archivo Excel
          </label>
          <input
            type="file"
            accept=".xlsx,.xls"
            onChange={handleBulkUsersFile}
            disabled={loading}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50"
          />
        </div>

        {bulkUsersFile && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-blue-800 font-medium mb-2">
              Archivo seleccionado: {bulkUsersFile.name}
            </p>
            <p className="text-blue-600 text-sm">
              {bulkUsersPreview.length} usuarios encontrados
            </p>
          </div>
        )}

        {showBulkUsersPreview && bulkUsersPreview.length > 0 && (
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-3">Vista previa de usuarios:</h4>
            <div className="max-h-40 overflow-y-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-1">Email</th>
                    <th className="text-left py-1">Nombre</th>
                    <th className="text-left py-1">Teléfono</th>
                  </tr>
                </thead>
                <tbody>
                  {bulkUsersPreview.slice(0, 10).map((user, index) => (
                    <tr key={index} className="border-b">
                      <td className="py-1">{user.email}</td>
                      <td className="py-1">{user.displayName}</td>
                      <td className="py-1">{user.phoneNumber || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {bulkUsersPreview.length > 10 && (
                <p className="text-gray-500 text-xs mt-2">
                  ... y {bulkUsersPreview.length - 10} usuarios más
                </p>
              )}
            </div>
            
            <div className="flex space-x-3 mt-4">
              <button
                onClick={handleBulkCreateUsers}
                disabled={loading}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
              >
                {loading ? 'Creando...' : `Crear ${bulkUsersPreview.length} usuarios`}
              </button>
              <button
                onClick={() => {
                  setBulkUsersFile(null);
                  setBulkUsersPreview([]);
                  setShowBulkUsersPreview(false);
                }}
                className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}


