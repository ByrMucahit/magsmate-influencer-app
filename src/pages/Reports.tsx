import { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, doc, getDoc, updateDoc } from 'firebase/firestore';
import { auth, db, OperationType, handleFirestoreError } from '../lib/firebase';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { 
  Users, 
  Mail, 
  Phone, 
  Link as LinkIcon, 
  Calendar, 
  Search,
  Filter,
  ArrowUpDown,
  ExternalLink,
  ShieldAlert
} from 'lucide-react';
import { cn } from '../lib/utils';

interface Application {
  id: string;
  name: string;
  surname: string;
  email: string;
  phone: string;
  influencerName: string;
  platformLinks?: Record<string, string>;
  followerCount: string;
  platforms: string[];
  status: string;
  createdAt: any;
}

export default function Reports() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const checkAdmin = async () => {
      const user = auth.currentUser;
      if (!user) {
        setIsAdmin(false);
        navigate('/login');
        return;
      }

      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        const userData = userDoc.data();
        
        // Check if email matches the hardcoded admin or if role is admin in Firestore
        if (user.email === 'admin@gmail.com' || user.email === 'm.mucahitbayar@gmail.com' || userData?.role === 'admin') {
          setIsAdmin(true);
        } else {
          setIsAdmin(false);
        }
      } catch (err) {
        console.error('Admin check failed:', err);
        setIsAdmin(false);
      }
    };

    checkAdmin();
  }, [navigate]);

  useEffect(() => {
    if (isAdmin === false) {
      navigate('/');
      return;
    }

    if (isAdmin === true) {
      const q = query(collection(db, 'applications'), orderBy('createdAt', 'desc'));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const apps = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Application[];
        setApplications(apps);
        setIsLoading(false);
      }, (error) => {
        handleFirestoreError(error, OperationType.LIST, 'applications');
      });

      return () => unsubscribe();
    }
  }, [isAdmin, navigate]);

  const filteredApplications = applications.filter(app => 
    app.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    app.surname.toLowerCase().includes(searchTerm.toLowerCase()) ||
    app.influencerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    app.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleStatusUpdate = async (id: string, newStatus: string) => {
    try {
      await updateDoc(doc(db, 'applications', id), {
        status: newStatus
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `applications/${id}`);
    }
  };

  if (isAdmin === null || isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-black/10 border-t-black rounded-full animate-spin" />
      </div>
    );
  }

  if (isAdmin === false) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-6">
        <ShieldAlert size={64} className="text-red-500 mb-6" />
        <h1 className="text-3xl font-black uppercase tracking-tighter mb-4">Yetkisiz Erişim</h1>
        <p className="text-black/60 max-w-md">Bu sayfayı görüntülemek için yönetici yetkisine sahip olmanız gerekmektedir.</p>
        <button 
          onClick={() => navigate('/')}
          className="mt-8 bg-black text-white px-8 py-3 rounded-full font-bold uppercase tracking-widest"
        >
          Ana Sayfaya Dön
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
        <div>
          <h1 className="text-4xl font-black uppercase tracking-tighter flex items-center gap-3">
            <Users size={32} /> Başvuru Raporları
          </h1>
          <p className="text-black/60 mt-2">Toplam {applications.length} influencer başvurusu bulundu.</p>
        </div>

        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-black/40" size={18} />
          <input
            type="text"
            placeholder="İsim veya kullanıcı adı ara..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-12 pr-6 py-3 border-2 border-black rounded-full w-full md:w-80 outline-none focus:ring-2 ring-black/5 transition-all"
          />
        </div>
      </div>

      <div className="bg-white border border-black rounded-3xl overflow-hidden shadow-[10px_10px_0px_0px_rgba(0,0,0,1)]">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-black text-white uppercase text-xs font-bold tracking-widest">
                <th className="px-6 py-4">Tarih</th>
                <th className="px-6 py-4">Influencer</th>
                <th className="px-6 py-4">İletişim</th>
                <th className="px-6 py-4 text-right">Takipçi</th>
                <th className="px-6 py-4">Platformlar</th>
                <th className="px-6 py-4">Durum</th>
                <th className="px-6 py-4 text-center">İşlem</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5">
              {filteredApplications.length > 0 ? (
                filteredApplications.map((app) => (
                  <motion.tr 
                    layout
                    key={app.id} 
                    className="hover:bg-black/[0.02] transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-black/60">
                      <div className="flex items-center gap-2">
                        <Calendar size={14} />
                        {app.createdAt?.toDate().toLocaleDateString('tr-TR')}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-bold">{app.name} {app.surname}</div>
                      <div className="text-xs text-black/40 uppercase tracking-tighter font-medium">{app.influencerName}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-sm">
                        <Mail size={14} className="text-black/40" />
                        {app.email}
                      </div>
                      <div className="flex items-center gap-2 text-sm mt-1">
                        <Phone size={14} className="text-black/40" />
                        {app.phone}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right font-mono font-bold">
                      {app.followerCount}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-2">
                        {app.platforms.map(p => (
                          <div key={p} className="flex items-center gap-1">
                            <span className="px-2 py-1 bg-black text-white rounded text-[10px] font-bold uppercase tracking-tighter">
                              {p}
                            </span>
                            {app.platformLinks?.[p] && (
                              <a 
                                href={app.platformLinks[p]} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-black hover:opacity-50 transition-opacity"
                                title={`${p} profilini aç`}
                              >
                                <ExternalLink size={14} />
                              </a>
                            )}
                          </div>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className={cn(
                        "inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border",
                        app.status === 'validated' 
                          ? "bg-green-50 text-green-700 border-green-200" 
                          : "bg-yellow-50 text-yellow-700 border-yellow-200"
                      )}>
                        {app.status === 'validated' ? 'Onaylandı' : 'Beklemede'}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      {app.status === 'waiting' && (
                        <button
                          onClick={() => handleStatusUpdate(app.id, 'validated')}
                          className="bg-black text-white px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all"
                        >
                          Onayla
                        </button>
                      )}
                      {app.status === 'validated' && (
                        <button
                          onClick={() => handleStatusUpdate(app.id, 'waiting')}
                          className="text-black/40 hover:text-black transition-colors"
                          title="Bekleme durumuna geri al"
                        >
                          <ArrowUpDown size={14} />
                        </button>
                      )}
                    </td>
                  </motion.tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-20 text-center text-black/40 italic">
                    Başvuru bulunamadı.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
