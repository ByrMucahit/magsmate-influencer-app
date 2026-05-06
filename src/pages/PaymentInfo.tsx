import { motion } from 'motion/react';
import { CreditCard, Copy, Check, ChevronLeft, Info } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';

const ACCOUNT_DETAILS = [
  {
    label: 'Hesap Sahibi',
    value: 'İbrahim Ethem Han',
    id: 'owner'
  },
  {
    label: 'Banka',
    value: 'T.C Ziraat Bankası',
    id: 'bank'
  },
  {
    label: 'Şube',
    value: 'İstanbul / Ümraniye',
    id: 'branch'
  },
  {
    label: 'IBAN',
    value: 'TR05 0001 0020 6983 6294 2150 02',
    id: 'iban'
  },
  {
    label: 'Vergi Dairesi',
    value: 'Ümraniye Vergi Dairesi',
    id: 'tax'
  },
  {
    label: 'Açıklama',
    value: 'Influencer Programı Kayıt Bedeli - [Adınız Soyadınız]',
    id: 'desc'
  }
];

export default function PaymentInfo() {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="min-h-screen bg-white">
      <main className="max-w-2xl mx-auto px-6 py-20">
        <Link 
          to="/" 
          className="inline-flex items-center gap-2 text-black/40 hover:text-black transition-colors font-bold uppercase text-xs tracking-widest mb-12"
        >
          <ChevronLeft size={16} /> Geri Dön
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-12"
        >
          <div>
            <h1 className="text-5xl font-black uppercase tracking-tighter mb-4">Ödeme Bilgileri</h1>
            <p className="text-black/60 text-lg leading-relaxed">
              Magsmate Influencer Programı katılım bedelini aşağıdaki hesap bilgilerini kullanarak iletebilirsiniz. 
              Ödeme sonrası dekontunuzu WhatsApp üzerinden göndermeyi unutmayınız.
            </p>
          </div>

          <div className="bg-black text-white p-8 md:p-12 rounded-[2.5rem] shadow-[20px_20px_0px_0px_rgba(0,0,0,0.1)] border-2 border-black">
            <div className="flex items-center gap-4 mb-10">
              <div className="p-3 bg-white/10 rounded-2xl">
                <CreditCard size={32} />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">Banka Bilgileri</p>
                <h2 className="text-xl font-black uppercase tracking-tight">Kayıt Ücreti: 400 TL</h2>
              </div>
            </div>

            <div className="space-y-8">
              {ACCOUNT_DETAILS.map((detail) => (
                <div key={detail.id} className="group relative">
                  <p className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-2">{detail.label}</p>
                  <div className="flex items-center justify-between gap-4">
                    <p className="text-lg font-bold break-all">{detail.value}</p>
                    <button
                      onClick={() => copyToClipboard(detail.value, detail.id)}
                      className="p-2 hover:bg-white/10 rounded-lg transition-colors flex-shrink-0"
                    >
                      {copiedId === detail.id ? <Check size={18} className="text-green-400" /> : <Copy size={18} />}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 p-6 rounded-2xl flex gap-4">
            <div className="p-2 bg-yellow-100 rounded-full h-fit">
              <Info size={20} className="text-yellow-700" />
            </div>
            <div className="space-y-2">
              <h4 className="font-bold text-yellow-900 text-sm uppercase tracking-widest">Önemli Hatırlatma</h4>
              <p className="text-yellow-800/80 text-xs leading-relaxed">
                Ödeme yaptıktan sonra dekontunuzu sistem üzerinden veya direkt WhatsApp numaramıza iletmeniz gerekmektedir. 
                Dekont iletilmeyen başvurular "beklemede" kalacaktır.
              </p>
            </div>
          </div>

          <div className="flex flex-col items-center gap-6 pt-10">
            <a 
              href="https://wa.me/905511038804?text=Merhaba, ödeme yaptım. Dekontumu paylaşıyorum." 
              target="_blank" 
              rel="noopener noreferrer"
              className="w-full bg-[#25D366] text-white py-6 rounded-2xl text-xl font-black uppercase tracking-widest flex items-center justify-center gap-3 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              WhatsApp ile Dekont Gönder
            </a>
            <Link 
              to="/" 
              className="text-sm font-black uppercase tracking-widest hover:opacity-50 transition-opacity"
            >
              Forma Geri Dön
            </Link>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
