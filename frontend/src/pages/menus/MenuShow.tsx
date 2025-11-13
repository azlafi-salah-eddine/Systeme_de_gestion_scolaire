import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import PageHead from '../../components/ui/PageHead';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { menuService } from '../../services/menuService';
import type { MenuItem } from '../../services/menuService';

const MenuShow: React.FC = () => {
  const { id } = useParams();
  const menuId = useMemo(() => Number(id), [id]);
  const navigate = useNavigate();

  const [menu, setMenu] = useState<MenuItem | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!menuId) return;
    void loadMenu();
  }, [menuId]);

  const loadMenu = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await menuService.show(menuId);
      setMenu(res.data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur de chargement');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHead 
        title={menu ? `${menu.jour} - ${menu.plat_principal}` : 'Menu'} 
        subtitle="Détails du menu"
        breadcrumb={[
          { label: 'Accueil', link: '/dashboard' },
          { label: 'Menus', link: '/menus' },
          { label: 'Détails', link: `/menus/${menuId}` }
        ]}
        actions={menu ? [
          { label: 'Modifier', onClick: () => navigate(`/menus/${menuId}/edit`), variant: 'secondary' },
        ] : []}
      />

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
        </div>
      ) : error ? (
        <Card><div className="p-6 text-red-600">{error}</div></Card>
      ) : menu ? (
        <Card>
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <div className="text-sm text-slate-500">Cantine</div>
              <div className="text-base font-medium">{menu.cantine?.nom || `#${menu.cantine_id}`}</div>
            </div>
            <div>
              <div className="text-sm text-slate-500">Jour</div>
              <div className="text-base font-medium capitalize">{menu.jour}</div>
            </div>
            <div>
              <div className="text-sm text-slate-500">Plat principal</div>
              <div className="text-base font-medium">{menu.plat_principal}</div>
            </div>
            <div>
              <div className="text-sm text-slate-500">Entrée</div>
              <div className="text-base">{menu.entree || '-'}</div>
            </div>
            <div>
              <div className="text-sm text-slate-500">Dessert</div>
              <div className="text-base">{menu.dessert || '-'}</div>
            </div>
            <div>
              <div className="text-sm text-slate-500">Boisson</div>
              <div className="text-base">{menu.boisson || '-'}</div>
            </div>
            <div className="md:col-span-2">
              <div className="text-sm text-slate-500">Date</div>
              <div className="text-base">{menu.date_menu || '-'}</div>
            </div>
          </div>
        </Card>
      ) : null}
    </div>
  );
};

export default MenuShow;


