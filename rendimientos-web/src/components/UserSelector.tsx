import { useState, useEffect } from 'react';
import { UserService } from '../services/userService';

interface User {
  uid: string;
  email: string;
  displayName?: string;
  phoneNumber?: string;
}

interface UserSelectorProps {
  selectedUsers: string[];
  onUsersChange: (userIds: string[]) => void;
  applyToAllUsers: boolean;
  onApplyToAllChange: (applyToAll: boolean) => void;
}

export function UserSelector({ 
  selectedUsers, 
  onUsersChange, 
  applyToAllUsers, 
  onApplyToAllChange 
}: UserSelectorProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showUserList, setShowUserList] = useState(false);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const result = await UserService.getAllUsers();
      if (result.success && result.data) {
        setUsers(result.data);
      }
    } catch (error) {
      console.error('Error cargando usuarios:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter(user =>
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (user.displayName && user.displayName.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleUserToggle = (userId: string) => {
    if (selectedUsers.includes(userId)) {
      onUsersChange(selectedUsers.filter(id => id !== userId));
    } else {
      onUsersChange([...selectedUsers, userId]);
    }
  };

  const handleSelectAll = () => {
    // Verificar si todos los usuarios filtrados están seleccionados
    const allFilteredSelected = filteredUsers.every(user => selectedUsers.includes(user.uid));
    
    if (allFilteredSelected) {
      // Deseleccionar todos los usuarios filtrados
      onUsersChange(selectedUsers.filter(userId => 
        !filteredUsers.some(user => user.uid === userId)
      ));
    } else {
      // Seleccionar todos los usuarios filtrados (mantener los ya seleccionados)
      const newSelection = [...selectedUsers];
      filteredUsers.forEach(user => {
        if (!newSelection.includes(user.uid)) {
          newSelection.push(user.uid);
        }
      });
      onUsersChange(newSelection);
    }
  };

  const handleApplyToAllToggle = (checked: boolean) => {
    onApplyToAllChange(checked);
    if (checked) {
      onUsersChange([]); // Limpiar selección individual
    }
  };

  const getSelectedUserNames = () => {
    return selectedUsers.map(userId => {
      const user = users.find(u => u.uid === userId);
      return user?.displayName || user?.email || userId;
    });
  };

  return (
    <div className="space-y-4">
      {/* Opción de aplicar a todos */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <label className="flex items-center space-x-3">
          <input
            type="checkbox"
            checked={applyToAllUsers}
            onChange={(e) => handleApplyToAllToggle(e.target.checked)}
            className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
          />
          <div>
            <span className="text-sm font-medium text-blue-900">
              Aplicar a todos los usuarios existentes
            </span>
            <p className="text-xs text-blue-700 mt-1">
              Se aplicará el rendimiento a todos los {users.length} usuarios registrados
            </p>
          </div>
        </label>
      </div>

      {/* Opción de selección individual */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <label className="flex items-center space-x-3 mb-3">
          <input
            type="checkbox"
            checked={!applyToAllUsers}
            onChange={(e) => handleApplyToAllToggle(!e.target.checked)}
            className="w-4 h-4 text-gray-600 bg-gray-100 border-gray-300 rounded focus:ring-gray-500 focus:ring-2"
          />
          <div>
            <span className="text-sm font-medium text-gray-900">
              Seleccionar usuarios específicos
            </span>
            <p className="text-xs text-gray-600 mt-1">
              Elige exactamente a qué usuarios aplicar el rendimiento
            </p>
          </div>
        </label>

        {!applyToAllUsers && (
          <div className="space-y-3">
            {/* Búsqueda de usuarios */}
            <div>
              <input
                type="text"
                placeholder="Buscar usuarios por email o nombre..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              />
            </div>

            {/* Botón para mostrar/ocultar lista */}
            <button
              onClick={() => setShowUserList(!showUserList)}
              className="w-full bg-gray-200 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors text-sm font-medium"
            >
              {showUserList ? 'Ocultar lista' : 'Mostrar lista de usuarios'}
              {selectedUsers.length > 0 && (
                <span className="ml-2 bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">
                  {selectedUsers.length} seleccionados
                </span>
              )}
            </button>

            {/* Lista de usuarios */}
            {showUserList && (
              <div className="bg-white border border-gray-200 rounded-lg max-h-60 overflow-y-auto">
                {loading ? (
                  <div className="p-4 text-center text-gray-500">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-500 mx-auto mb-2"></div>
                    Cargando usuarios...
                  </div>
                ) : (
                  <>
                    {/* Botón seleccionar todos */}
                    <div className="border-b border-gray-200 p-3">
                      <button
                        onClick={handleSelectAll}
                        className="w-full text-left text-sm font-medium text-blue-600 hover:text-blue-800"
                      >
                        {filteredUsers.every(user => selectedUsers.includes(user.uid)) 
                          ? 'Deseleccionar todos' 
                          : 'Seleccionar todos'
                        } ({filteredUsers.length})
                      </button>
                    </div>

                    {/* Lista de usuarios */}
                    <div className="divide-y divide-gray-200">
                      {filteredUsers.map((user) => (
                        <label
                          key={user.uid}
                          className="flex items-center space-x-3 p-3 hover:bg-gray-50 cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={selectedUsers.includes(user.uid)}
                            onChange={() => handleUserToggle(user.uid)}
                            className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-gray-900 truncate">
                              {user.displayName || user.email}
                            </div>
                            <div className="text-xs text-gray-500 truncate">
                              {user.email}
                            </div>
                            {user.phoneNumber && (
                              <div className="text-xs text-gray-400 truncate">
                                {user.phoneNumber}
                              </div>
                            )}
                          </div>
                        </label>
                      ))}
                    </div>

                    {filteredUsers.length === 0 && (
                      <div className="p-4 text-center text-gray-500 text-sm">
                        No se encontraron usuarios
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {/* Resumen de usuarios seleccionados */}
            {selectedUsers.length > 0 && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <div className="text-sm font-medium text-green-900 mb-2">
                  Usuarios seleccionados ({selectedUsers.length}):
                </div>
                <div className="text-xs text-green-700 space-y-1">
                  {getSelectedUserNames().slice(0, 5).map((name, index) => (
                    <div key={index}>• {name}</div>
                  ))}
                  {selectedUsers.length > 5 && (
                    <div>... y {selectedUsers.length - 5} más</div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Información adicional */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-green-800">
              Información importante
            </h3>
            <div className="mt-2 text-sm text-green-700">
              <ul className="list-disc list-inside space-y-1">
                <li>Los usuarios seleccionados recibirán el rendimiento global</li>
                <li>Puedes cambiar la selección antes de aplicar el rendimiento</li>
                <li>Se creará un registro de rendimiento para cada usuario seleccionado</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
