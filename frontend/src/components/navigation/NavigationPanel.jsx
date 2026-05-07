import React from 'react';
import { Link } from 'react-router-dom';

const NavigationPanel = () => {
    return (
        <aside className="w-64 bg-white border-r border-gray-200 h-full flex flex-col">
            <div className="p-6">
                <h1 className="text-2xl font-bold text-blue-600">Lender's HQ</h1>
            </div>
            <nav className="flex-1 px-4 space-y-2">
                <Link to="/dashboard" className="block px-4 py-2 text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded-md transition-colors">Dashboard</Link>
                <Link to="/loans" className="block px-4 py-2 text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded-md transition-colors">Prestamos</Link>
                <Link to="/borrowers" className="block px-4 py-2 text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded-md transition-colors">Prestatarios</Link>
                <Link to="/reports" className="block px-4 py-2 text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded-md transition-colors">Reportes</Link>
            </nav>
            <div className="p-4 border-t border-gray-100">
                <Link to="/settings" className="block px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-md transition-colors">Configuración</Link>
                <Link to="/login" className="block px-4 py-2 text-red-600 hover:bg-red-50 rounded-md transition-colors">Cerrar Sesión</Link>
                <Link to="/" className="block px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-md transition-colors">Usuario</Link>
            </div>
        </aside>
    );
};

export default NavigationPanel