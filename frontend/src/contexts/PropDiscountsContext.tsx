import React, { createContext, useContext, useState, ReactNode } from 'react';
import { mockPropDiscounts, mockPropBanners, PropDiscount, PropBanner } from '@/data/mockPropDiscounts';

interface PropDiscountsContextType {
  discounts: PropDiscount[];
  banners: PropBanner[];
  availableTags: string[];
  addDiscount: (discount: Omit<PropDiscount, 'id'>) => void;
  updateDiscount: (id: string, discount: Partial<PropDiscount>) => void;
  deleteDiscount: (id: string) => void;
  addBanner: (banner: Omit<PropBanner, 'id'>) => void;
  updateBanner: (id: string, banner: Partial<PropBanner>) => void;
  deleteBanner: (id: string) => void;
  reorderBanners: (banners: PropBanner[]) => void;
}

const PropDiscountsContext = createContext<PropDiscountsContextType | undefined>(undefined);

export const PropDiscountsProvider = ({ children }: { children: ReactNode }) => {
  const [discounts, setDiscounts] = useState<PropDiscount[]>(mockPropDiscounts.discounts);
  const [banners, setBanners] = useState<PropBanner[]>(mockPropBanners.slides);
  const [availableTags] = useState<string[]>(mockPropDiscounts.filters.tags);

  const addDiscount = (discount: Omit<PropDiscount, 'id'>) => {
    const newDiscount = {
      ...discount,
      id: `pf-${Date.now()}`
    };
    setDiscounts(prev => [...prev, newDiscount]);
  };

  const updateDiscount = (id: string, discount: Partial<PropDiscount>) => {
    setDiscounts(prev => prev.map(d => d.id === id ? { ...d, ...discount } : d));
  };

  const deleteDiscount = (id: string) => {
    setDiscounts(prev => prev.filter(d => d.id !== id));
  };

  const addBanner = (banner: Omit<PropBanner, 'id'>) => {
    const newBanner = {
      ...banner,
      id: `bn-${Date.now()}`
    };
    setBanners(prev => [...prev, newBanner]);
  };

  const updateBanner = (id: string, banner: Partial<PropBanner>) => {
    setBanners(prev => prev.map(b => b.id === id ? { ...b, ...banner } : b));
  };

  const deleteBanner = (id: string) => {
    setBanners(prev => prev.filter(b => b.id !== id));
  };

  const reorderBanners = (newBanners: PropBanner[]) => {
    setBanners(newBanners);
  };

  return (
    <PropDiscountsContext.Provider
      value={{
        discounts,
        banners,
        availableTags,
        addDiscount,
        updateDiscount,
        deleteDiscount,
        addBanner,
        updateBanner,
        deleteBanner,
        reorderBanners
      }}
    >
      {children}
    </PropDiscountsContext.Provider>
  );
};

export const usePropDiscounts = () => {
  const context = useContext(PropDiscountsContext);
  if (!context) {
    throw new Error('usePropDiscounts must be used within PropDiscountsProvider');
  }
  return context;
};
