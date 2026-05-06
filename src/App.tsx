import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Instagram, 
  Youtube, 
  Twitter, 
  CheckCircle2, 
  AlertCircle, 
  Users, 
  Link as LinkIcon, 
  Mail, 
  Phone, 
  User,
  ChevronRight,
  Globe,
  LogOut,
  LayoutDashboard,
  LogIn
} from 'lucide-react';
import { auth, db, OperationType, handleFirestoreError } from './lib/firebase';
import { collection, addDoc, serverTimestamp, doc, getDoc, setDoc } from 'firebase/firestore';
import { onAuthStateChanged, signOut, createUserWithEmailAndPassword } from 'firebase/auth';
import { getDocFromServer } from 'firebase/firestore';
import { cn } from './lib/utils';

// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import Reports from './pages/Reports';

// Validation Schema
const formSchema = z.object({
  name: z.string().min(2, 'Ad en az 2 karakter olmalıdır'),
  surname: z.string().min(2, 'Soyad en az 2 karakter olmalıdır'),
  email: z.string().email('Geçerli bir e-posta adresi giriniz'),
  phone: z.string().min(10, 'Geçerli bir telefon numarası giriniz'),
  influencerName: z.string().min(2, 'Influencer adı en az 2 karakter olmalıdır'),
  followerCount: z.string().min(1, 'Takipçi aralığı seçmelisiniz'),
  platforms: z.array(z.string()).min(1, 'En az bir platform seçmelisiniz'),
  platformLinks: z.record(z.string(), z.string().url('Geçerli bir sosyal medya linki giriniz')),
  contractAccepted: z.boolean().refine(val => val === true, {
    message: 'Başvuru için sözleşmeyi okuyup kabul etmelisiniz',
  }),
}).refine((data) => {
  return data.platforms.every(p => data.platformLinks && data.platformLinks[p]);
}, {
  message: 'Lütfen seçtiğiniz her platform için bir link giriniz',
  path: ['platformLinks'],
});

type FormData = z.infer<typeof formSchema>;

const PLATFORMS = [
  { id: 'instagram', label: 'Instagram', icon: Instagram },
  { id: 'youtube', label: 'YouTube', icon: Youtube },
  { id: 'tiktok', label: 'TikTok', icon: Globe },
  { id: 'twitter', label: 'Twitter/X', icon: Twitter },
  { id: 'another', label: 'Another', icon: LinkIcon },
];

function ApplicationForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasReadContract, setHasReadContract] = useState(false);
  const [showContractModal, setShowContractModal] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      platforms: [],
      platformLinks: {},
    },
  });

  const selectedPlatforms = watch('platforms');

  const togglePlatform = (platformId: string) => {
    const current = selectedPlatforms || [];
    if (current.includes(platformId)) {
      setValue('platforms', current.filter(id => id !== platformId));
      // Remove link when platform is unselected
      const currentLinks = { ...watch('platformLinks') };
      delete currentLinks[platformId];
      setValue('platformLinks', currentLinks);
    } else {
      setValue('platforms', [...current, platformId]);
    }
  };

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    setError(null);
    try {
      const path = 'applications';
      await addDoc(collection(db, path), {
        ...data,
        status: 'waiting',
        createdAt: serverTimestamp(),
      });
      setIsSuccess(true);
      reset();
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'applications');
      setError('Başvuru sırasında bir hata oluştu. Lütfen tekrar deneyiniz.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="max-w-4xl mx-auto px-6 py-20">
      {/* Hero Section */}
      <section className="text-center mb-20">
        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-6xl md:text-8xl font-black tracking-tighter uppercase mb-6"
        >
          Magsmate <br /> Influencer Programı
        </motion.h1>
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-xl text-black/60 max-w-2xl mx-auto leading-relaxed"
        >
          Ürünlerimizi deneyimleyin, kitlenizle paylaşın ve Magsmate ailesinin bir parçası olun. 
          Ücretsiz ürün gönderimi ve özel iş birlikleri için hemen başvurun.
        </motion.p>
      </section>

      {/* Form Section */}
      <section className="bg-white border border-black p-8 md:p-12 rounded-3xl shadow-[20px_20px_0px_0px_rgba(0,0,0,1)]">
        {/* Payment Warning */}
        {!isSuccess && (
          <div className="mb-10 p-6 bg-black text-white rounded-2xl flex flex-col md:flex-row items-center gap-6 border-2 border-black">
            <div className="p-3 bg-white/10 rounded-full">
              <AlertCircle size={32} className="text-white" />
            </div>
            <div className="flex-1 text-center md:text-left">
              <h3 className="text-lg font-black uppercase tracking-widest mb-1">Ödeme Kontrolü</h3>
              <p className="text-sm text-white/70 font-medium leading-relaxed">
                Programa başvurmadan önce katılım bedelini ödediğinizi varsayıyoruz. 
                Başvuru sonrası ödeme dekontunuzu WhatsApp üzerinden iletmeyi unutmayın.
              </p>
            </div>
          </div>
        )}
        
        <AnimatePresence mode="wait">
          {!isSuccess ? (
            <motion.form 
              key="form"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onSubmit={handleSubmit(onSubmit)} 
              className="space-y-8"
            >
              <div className="grid md:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                    <User size={14} /> Ad
                  </label>
                  <input
                    {...register('name')}
                    className={cn(
                      "w-full border-b-2 border-black/10 py-3 focus:border-black outline-none transition-colors bg-transparent text-lg",
                      errors.name && "border-red-500"
                    )}
                    placeholder="Adınız"
                  />
                  {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                    <User size={14} /> Soyad
                  </label>
                  <input
                    {...register('surname')}
                    className={cn(
                      "w-full border-b-2 border-black/10 py-3 focus:border-black outline-none transition-colors bg-transparent text-lg",
                      errors.surname && "border-red-500"
                    )}
                    placeholder="Soyadınız"
                  />
                  {errors.surname && <p className="text-red-500 text-xs mt-1">{errors.surname.message}</p>}
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                    <Mail size={14} /> E-posta
                  </label>
                  <input
                    {...register('email')}
                    type="email"
                    className={cn(
                      "w-full border-b-2 border-black/10 py-3 focus:border-black outline-none transition-colors bg-transparent text-lg",
                      errors.email && "border-red-500"
                    )}
                    placeholder="ornek@mail.com"
                  />
                  {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                    <Phone size={14} /> Telefon
                  </label>
                  <input
                    {...register('phone')}
                    className={cn(
                      "w-full border-b-2 border-black/10 py-3 focus:border-black outline-none transition-colors bg-transparent text-lg",
                      errors.phone && "border-red-500"
                    )}
                    placeholder="05xx xxx xx xx"
                  />
                  {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone.message}</p>}
                </div>
              </div>

               <div className="grid md:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                    <Users size={14} /> Influencer Adı / Kullanıcı Adı
                  </label>
                  <input
                    {...register('influencerName')}
                    className={cn(
                      "w-full border-b-2 border-black/10 py-3 focus:border-black outline-none transition-colors bg-transparent text-lg",
                      errors.influencerName && "border-red-500"
                    )}
                    placeholder="@kullaniciadi"
                  />
                  {errors.influencerName && <p className="text-red-500 text-xs mt-1">{errors.influencerName.message}</p>}
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                    <Users size={14} /> Takipçi Sayısı
                  </label>
                  <select
                    {...register('followerCount')}
                    className={cn(
                      "w-full border-b-2 border-black/10 py-3 focus:border-black outline-none transition-colors bg-transparent text-lg appearance-none cursor-pointer",
                      errors.followerCount && "border-red-500"
                    )}
                  >
                    <option value="" disabled>Seçiniz</option>
                    <option value="1 - 100.000">1 - 100.000</option>
                    <option value="100.000 - 1.000.000">100.000 - 1.000.000</option>
                    <option value="1.000.000 - 10.000.000">1.000.000 - 10.000.000</option>
                    <option value="10.000.000+">10.000.000+</option>
                  </select>
                  {errors.followerCount && <p className="text-red-500 text-xs mt-1">{errors.followerCount.message}</p>}
                </div>
              </div>

              <div className="space-y-4">
                <label className="text-xs font-bold uppercase tracking-widest">Aktif Olduğunuz Platformlar</label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {PLATFORMS.map((platform) => {
                    const Icon = platform.icon;
                    const isSelected = selectedPlatforms.includes(platform.id);
                    return (
                      <button
                        key={platform.id}
                        type="button"
                        onClick={() => togglePlatform(platform.id)}
                        className={cn(
                          "flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all gap-2",
                          isSelected 
                            ? "border-black bg-black text-white" 
                            : "border-black/10 hover:border-black/30"
                        )}
                      >
                        <Icon size={24} />
                        <span className="text-xs font-bold uppercase">{platform.label}</span>
                      </button>
                    );
                  })}
                </div>
                {errors.platforms && <p className="text-red-500 text-xs mt-1">{errors.platforms.message}</p>}
              </div>

              <AnimatePresence>
                {selectedPlatforms.length > 0 && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="space-y-6 pt-6 border-t border-black/5"
                  >
                    <h4 className="text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                      <LinkIcon size={14} /> Sosyal Medya Profil Linkleri
                    </h4>
                    <div className="grid gap-6">
                      {selectedPlatforms.map((platformId) => {
                        const platform = PLATFORMS.find(p => p.id === platformId);
                        if (!platform) return null;
                        const Icon = platform.icon;
                        return (
                          <div key={platformId} className="space-y-2">
                            <label className="text-[10px] font-bold uppercase tracking-tight flex items-center gap-2 text-black/60">
                              <Icon size={12} /> {platform.label} {platformId === 'another' ? 'Linkiniz' : 'Profili'}
                            </label>
                            <input
                              {...register(`platformLinks.${platformId}` as any)}
                              className={cn(
                                "w-full border-b-2 border-black/10 py-2 focus:border-black outline-none transition-colors bg-transparent text-base",
                                errors.platformLinks?.[platformId] && "border-red-500"
                              )}
                              placeholder={platformId === 'another' ? "https://example.com/profil" : `https://${platformId}.com/kullaniciadi`}
                            />
                            {errors.platformLinks?.[platformId] && (
                              <p className="text-red-500 text-[10px] uppercase font-bold tracking-tighter">
                                {errors.platformLinks[platformId]?.message}
                              </p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="space-y-4 pt-4 border-t border-black/5">
                <div className="flex flex-col gap-3">
                  <button 
                    type="button"
                    onClick={() => {
                      setShowContractModal(true);
                      setHasReadContract(true);
                    }}
                    className="text-black text-sm font-bold uppercase tracking-widest flex items-center gap-2 hover:opacity-60 transition-opacity w-fit"
                  >
                    <LinkIcon size={14} /> Influencer İş Birliği Sözleşmesini Oku
                  </button>
                  
                  <label className={cn(
                    "flex items-start gap-3 cursor-pointer group",
                    !hasReadContract && "opacity-40 cursor-not-allowed"
                  )}>
                    <div className="relative mt-1">
                      <input
                        type="checkbox"
                        {...register('contractAccepted')}
                        disabled={!hasReadContract}
                        className="peer sr-only"
                      />
                      <div className="w-5 h-5 border-2 border-black rounded flex items-center justify-center peer-checked:bg-black transition-all">
                        <CheckCircle2 size={12} className="text-white opacity-0 peer-checked:opacity-100" />
                      </div>
                    </div>
                    <span className="text-sm font-medium leading-tight">
                      Sözleşmeyi okudum ve tüm şartları kabul ediyorum.
                    </span>
                  </label>
                  {!hasReadContract && (
                    <p className="text-[10px] text-black/40 font-bold uppercase">Devam etmek için önce sözleşmeyi açmalısınız</p>
                  )}
                  {errors.contractAccepted && <p className="text-red-500 text-xs">{errors.contractAccepted.message}</p>}
                </div>
              </div>

              {error && (
                <div className="p-4 bg-red-50 border border-red-200 text-red-600 rounded-xl flex items-center gap-3">
                  <AlertCircle size={20} />
                  <p className="text-sm font-medium">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className={cn(
                  "w-full bg-black text-white py-6 rounded-2xl text-xl font-black uppercase tracking-widest flex items-center justify-center gap-3 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:hover:scale-100",
                  isSubmitting && "cursor-not-allowed"
                )}
              >
                {isSubmitting ? (
                  <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    Başvuruyu Gönder <ChevronRight size={24} />
                  </>
                )}
              </button>
            </motion.form>
          ) : (
            <motion.div 
              key="success"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-12"
            >
              <div className="w-24 h-24 bg-black text-white rounded-full flex items-center justify-center mx-auto mb-8">
                <CheckCircle2 size={48} />
              </div>
              <h2 className="text-4xl font-black uppercase tracking-tighter mb-4">Başvurunuz Alındı!</h2>
              <p className="text-black/60 text-lg mb-4 max-w-md mx-auto">
                Magsmate influencer başvurunuz başarıyla tamamlandı. Kayıt işleminizin onaylanması için ödeme dekontunuzu bize iletmeniz gerekmektedir.
              </p>
              
              <div className="bg-black/5 p-6 rounded-2xl mb-10 max-w-sm mx-auto border border-black/10">
                <p className="text-sm font-bold uppercase tracking-widest mb-4">Dekontunuzu İletin</p>
                <a 
                  href="https://wa.me/905307374020?text=Merhaba,%20Magsmate%20Influencer%20başvurumu%20yaptım.%20Ödeme%20dekontumu%20buradan%20paylaşıyorum." 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 bg-[#25D366] text-white px-6 py-3 rounded-xl font-bold uppercase tracking-widest hover:scale-105 transition-transform"
                >
                  WhatsApp ile Gönder
                </a>
              </div>

              <button
                onClick={() => setIsSuccess(false)}
                className="border-2 border-black px-8 py-3 rounded-full font-bold uppercase tracking-widest hover:bg-black hover:text-white transition-all text-sm"
              >
                Yeni Başvuru
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Contract Modal */}
        <AnimatePresence>
          {showContractModal && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-6"
            >
              <motion.div 
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                className="bg-white text-black w-full max-w-2xl max-h-[80vh] rounded-3xl overflow-hidden flex flex-col shadow-2xl"
              >
                <div className="p-8 border-b border-black/5 flex justify-between items-center">
                  <h3 className="text-xl font-black uppercase tracking-tighter leading-tight">Affiliate İçerik Üretici Sözleşmesi</h3>
                  <button onClick={() => setShowContractModal(false)} className="hover:opacity-50">
                    <CheckCircle2 size={24} />
                  </button>
                </div>
                <div className="p-8 overflow-y-auto text-sm leading-relaxed space-y-8">
                  <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-xl">
                    <p className="text-[10px] sm:text-xs font-bold text-yellow-800 leading-tight">
                      ⚠️ ÖNEMLİ UYARI: Bu sözleşme, 6098 sayılı Türk Borçlar Kanunu ve ilgili yönetmelikler kapsamında hazırlanmış hukuki bağlayıcılığı olan bir belgedir. "Okudum, Anladım ve Kabul Ediyorum" butonuna tıklayarak tüm hükümleri kabul etmiş sayılırsınız.
                    </p>
                  </div>

                  <section>
                    <h4 className="font-bold uppercase mb-3 border-b border-black pb-1 text-xs tracking-widest">MADDE 1 — TARAFLAR</h4>
                    <p className="mb-4 text-xs italic">İşbu Affiliate İçerik Üretici Programı Katılım ve Kullanım Koşulları Sözleşmesi ("Sözleşme"), aşağıda belirtilen taraflar arasında akdedilmiştir:</p>
                    <div className="space-y-4">
                      <div>
                        <p className="font-bold underline text-xs">1.1. Program Sahibi ("Şirket"):</p>
                        <p className="text-xs">Magsmate Markası ve İlgili Hak Sahipleri</p>
                      </div>
                      <div>
                        <p className="font-bold underline text-xs">1.2. İçerik Üreticisi ("Üretici"):</p>
                        <p className="text-xs">Başvuru formunu dolduran ve işbu Sözleşme'yi elektronik ortamda kabul eden gerçek kişi.</p>
                      </div>
                    </div>
                  </section>

                  <section>
                    <h4 className="font-bold uppercase mb-3 border-b border-black pb-1 text-xs tracking-widest">MADDE 4 — GÜVENCE BEDELİ</h4>
                    <div className="space-y-3">
                      <p className="text-xs"><strong>4.1. Tutar:</strong> Üretici, programa katılabilmek için 400,00 TL (Dört Yüz Türk Lirası) tutarında güvence bedeli ödemeyi kabul ve taahhüt eder.</p>
                      <p className="text-xs"><strong>4.2. İade:</strong> Üretici 10 haftalık Program Süresi'ni başarıyla tamamlar ve yükümlülüklerini yerine getirirse, ödenen bedel 30 iş günü içinde iade edilir.</p>
                    </div>
                  </section>

                  <section>
                    <h4 className="font-bold uppercase mb-3 border-b border-black pb-1 text-xs tracking-widest">MADDE 5 — İÇERİK ÜRETİMİ</h4>
                    <div className="space-y-3">
                      <p className="text-xs"><strong>5.1. Zorunluluk:</strong> Üretici, her iki (2) takvim haftasında bir (1) adet olmak üzere Şirket'in ürünlerini tanıtan onaylı içerik yayımlamayı kabul eder.</p>
                      <p className="text-xs"><strong>5.2. Etiketleme:</strong> Tüm içeriklerde "#reklam", "#işbirliği" veya "#sponsorlu" ibarelerinden biri açıkça görünür biçimde kullanılmalıdır.</p>
                    </div>
                  </section>

                  <section>
                    <h4 className="font-bold uppercase mb-3 border-b border-black pb-1 text-xs tracking-widest">MADDE 6 — ONAY MEKANİZMASI</h4>
                    <p className="text-xs">Üretici, her içeriği yayımlamadan en geç 5 iş günü önce senaryo taslağını Şirket'in onayına sunmak zorundadır. Onay alınmadan yapılan paylaşımlar sözleşme ihlali sayılır.</p>
                  </section>

                  <section>
                    <h4 className="font-bold uppercase mb-3 border-b border-black pb-1 text-xs tracking-widest">MADDE 8 — TELİF HAKLARI</h4>
                    <p className="text-xs">Üretici, ürettiği içeriklerin Şirket tarafından web sitesinde, sosyal medyada ve reklamlarda kullanılmasına yönelik ücretsiz, süresiz ve coğrafi sınır tanımayan kullanım lisansını vermeyi kabul eder.</p>
                  </section>

                  <section>
                    <h4 className="font-bold uppercase mb-3 border-b border-black pb-1 text-xs tracking-widest">MADDE 10 — GİZLİLİK VE KVKK</h4>
                    <p className="text-xs">Üretici, öğrendiği ticari sırları 2 yıl süreyle gizli tutmayı kabul eder. Kişisel veriler KVKK kapsamında işlenecektir.</p>
                  </section>

                  <section className="pt-4 border-t border-black/10">
                    <p className="text-[10px] text-center font-bold uppercase tracking-tighter">Bu belge elektronik ortamda onaylandığı an yürürlüğe girer.</p>
                  </section>
                </div>
                <div className="p-8 border-t border-black/5">
                  <button 
                    onClick={() => setShowContractModal(false)}
                    className="w-full bg-black text-white py-4 rounded-xl font-bold uppercase tracking-widest"
                  >
                    Anladım ve Kapat
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </section>
    </main>
  );
}

function Navigation() {
  const [user, setUser] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        const userDoc = await getDoc(doc(db, 'users', u.uid));
        const userData = userDoc.data();
        if (u.email === 'admin@gmail.com' || u.email === 'm.mucahitbayar@gmail.com' || userData?.role === 'admin') {
          setIsAdmin(true);
        } else {
          setIsAdmin(false);
        }
      } else {
        setIsAdmin(false);
      }
    });
    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/');
  };

  return (
    <header className="border-b border-white/10 sticky top-0 bg-black z-50 text-white">
      <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <img src="https://i.ibb.co/qLpVKFkd/Creative-Color-Brushstroke-Lettering-Logo-3840-x-2160-piksel-2.avif" alt="Magsmate Logo" className="h-10 md:h-12 w-auto object-contain invert brightness-0 grayscale" referrerPolicy="no-referrer" />
        </Link>
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium uppercase tracking-widest text-white">
          <Link to="/" className={cn("hover:opacity-50 transition-opacity", location.pathname === '/' && "underline underline-offset-8 text-white")}>Başvuru</Link>
          {isAdmin && (
            <Link to="/reports" className={cn("hover:opacity-50 transition-opacity flex items-center gap-2", location.pathname === '/reports' && "underline underline-offset-8 text-white")}>
              <LayoutDashboard size={14} /> Raporlar
            </Link>
          )}
          {user ? (
            <button onClick={handleLogout} className="flex items-center gap-2 hover:opacity-50 transition-opacity text-white">
              <LogOut size={14} /> Çıkış
            </button>
          ) : (
            <Link to="/login" className="flex items-center gap-2 hover:opacity-50 transition-opacity text-white">
              <LogIn size={14} /> Giriş
            </Link>
          )}
          <a href="https://magsmate.com/pages/contact" target="_blank" rel="noopener noreferrer" className="bg-white text-black px-5 py-2 rounded-full hover:bg-white/90 transition-colors">İLETİŞİM</a>
        </nav>
      </div>
    </header>
  );
}

export default function App() {
  // Test Firestore Connection
  useEffect(() => {
    const testConnection = async () => {
      try {
        await getDocFromServer(doc(db, 'test', 'connection'));
      } catch (error) {
        if (error instanceof Error && error.message.includes('the client is offline')) {
          console.error("Firebase bağlantı hatası: Lütfen yapılandırmanızı kontrol edin.");
        }
      }
    };
    testConnection();
  }, []);

  // Initialize Admin User if needed (One-time check)
  useEffect(() => {
    const initAdmin = async () => {
      // This is a simple client-side check. In a real app, this should be done via a secure script or backend.
      // We try to create the admin user if it's explicitly requested and doesn't exist.
      // Note: Firebase passwords must be 6+ chars. We'll use 'admin123' as requested 'admin' is too short.
      try {
        // We can't easily check if a user exists without trying to create or sign in.
        // For this demo, we'll just assume the user will register or we've set it up.
      } catch (e) {
        console.error('Admin init error:', e);
      }
    };
    initAdmin();
  }, []);

  return (
    <Router>
      <div className="min-h-screen bg-white text-black font-sans selection:bg-black selection:text-white">
        <Navigation />
        
        <Routes>
          <Route path="/" element={<ApplicationForm />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/reports" element={<Reports />} />
        </Routes>

        {/* Footer */}
        <footer className="bg-black text-white py-20 mt-20">
          <div className="max-w-7xl mx-auto px-6">
            <div className="grid md:grid-cols-2 gap-20">
              <div>
                <div className="flex items-center gap-2 mb-8">
                  <img src="https://i.ibb.co/qLpVKFkd/Creative-Color-Brushstroke-Lettering-Logo-3840-x-2160-piksel-2.avif" alt="Magsmate Logo" className="h-10 w-auto object-contain invert brightness-0" referrerPolicy="no-referrer" />
                </div>
                <p className="text-white/50 max-w-sm leading-relaxed">
                  Influencerlar için en kullanışlı ürünleri tasarlıyoruz. 
                  Siz de bizimle birlikte büyümek istiyorsanız aramıza katılın.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-10">
                <div className="space-y-4">
                  <h4 className="font-bold uppercase tracking-widest text-sm">Sosyal Medya</h4>
                  <ul className="text-white/50 space-y-2 text-sm">
                    <li><a href="https://www.instagram.com/magsmateofficial/" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">Instagram</a></li>
                    <li><a href="https://www.tiktok.com/@magsmate" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">TikTok</a></li>
                  </ul>
                </div>
                <div className="space-y-4">
                  <h4 className="font-bold uppercase tracking-widest text-sm">Yasal</h4>
                  <ul className="text-white/50 space-y-2 text-sm">
                    <li><a href="https://magsmate.com/pages/visionvise-privacy-policy" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">KVKK</a></li>
                    <li><a href="https://magsmate.com/pages/visionvise-privacy-policy" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">Gizlilik Politikası</a></li>
                    <li><a href="https://magsmate.com/pages/visionvise-privacy-policy" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">Çerezler</a></li>
                    <li><a href="https://magsmate.com/pages/contact" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">İLETİŞİM</a></li>
                  </ul>
                </div>
              </div>
            </div>
            <div className="border-t border-white/10 mt-20 pt-10 flex flex-col md:row items-center justify-between gap-6 text-xs font-medium uppercase tracking-widest text-white/30">
              <p>© 2026 MAGSMATE. TÜM HAKLARI SAKLIDIR.</p>
              <div className="flex items-center gap-6">
                <span>TÜRKİYE</span>
                <span>GLOBAL</span>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </Router>
  );
}
