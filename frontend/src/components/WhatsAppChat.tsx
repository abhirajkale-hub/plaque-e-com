import { useState, useEffect } from 'react';
import { MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getSettings } from '@/data/mockSettings';

interface SiteSettings {
  contact_phone: string | null;
}

export const WhatsAppChat = () => {
  const [phoneNumber, setPhoneNumber] = useState('8261065806');

  useEffect(() => {
    const settings = getSettings();
    if (settings.contact_phone) {
      const cleanNumber = settings.contact_phone.replace(/\D/g, '');
      setPhoneNumber(cleanNumber);
    }
  }, []);

  const openWhatsApp = () => {
    const message = encodeURIComponent(
      "Hi! I'm interested in your premium trading awards. Can you help me?"
    );
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${message}`;
    window.open(whatsappUrl, '_blank');
  };

  return (
    <Button
      onClick={openWhatsApp}
      size="icon"
      className="fixed right-6 bottom-6 z-50 h-14 w-14 rounded-full shadow-lg animate-fade-in hover-scale bg-[#25D366] hover:bg-[#20BA5A] text-white"
      aria-label="Chat on WhatsApp"
    >
      <MessageCircle className="h-6 w-6" />
    </Button>
  );
};
