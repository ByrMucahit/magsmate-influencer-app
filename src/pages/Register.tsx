import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { Mail, Lock, UserPlus, AlertCircle } from 'lucide-react';
import { cn } from '../lib/utils';

const registerSchema = z.object({
  email: z.string().email('Geçerli bir e-posta adresi giriniz'),
  password: z.string().min(6, 'Şifre en az 6 karakter olmalıdır'),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Şifreler eşleşmiyor",
  path: ["confirmPassword"],
});

type RegisterData = z.infer<typeof registerSchema>;

export default function Register() {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterData>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterData) => {
    setIsLoading(true);
    setError(null);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
      const user = userCredential.user;

      // Create user document in Firestore with 'user' role
      try {
        await setDoc(doc(db, 'users', user.uid), {
          email: data.email,
          role: 'user',
          createdAt: serverTimestamp(),
        });
        navigate('/');
      } catch (firestoreErr: any) {
        console.error('Firestore Error:', firestoreErr);
        setError(`Kullanıcı oluşturuldu ancak profil kaydedilemedi: ${firestoreErr.message}`);
      }
    } catch (err: any) {
      console.error('Auth Error:', err);
      if (err.code === 'auth/email-already-in-use') {
        setError('Bu e-posta adresi zaten kullanımda.');
      } else if (err.code === 'auth/operation-not-allowed') {
        setError('E-posta/Şifre girişi etkinleştirilmemiş. Lütfen Firebase konsolundan etkinleştirin.');
      } else {
        setError(`Kayıt sırasında bir hata oluştu: ${err.message}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-6">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white border border-black p-8 rounded-3xl shadow-[10px_10px_0px_0px_rgba(0,0,0,1)]"
      >
        <div className="text-center mb-8">
          <h1 className="text-3xl font-black uppercase tracking-tighter">Kayıt Ol</h1>
          <p className="text-black/60 text-sm mt-2">Magsmate influencer ağına katılın.</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
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
              <Lock size={14} /> Şifre
            </label>
            <input
              {...register('password')}
              type="password"
              className={cn(
                "w-full border-b-2 border-black/10 py-3 focus:border-black outline-none transition-colors bg-transparent text-lg",
                errors.password && "border-red-500"
              )}
              placeholder="••••••"
            />
            {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-widest flex items-center gap-2">
              <Lock size={14} /> Şifre Tekrar
            </label>
            <input
              {...register('confirmPassword')}
              type="password"
              className={cn(
                "w-full border-b-2 border-black/10 py-3 focus:border-black outline-none transition-colors bg-transparent text-lg",
                errors.confirmPassword && "border-red-500"
              )}
              placeholder="••••••"
            />
            {errors.confirmPassword && <p className="text-red-500 text-xs mt-1">{errors.confirmPassword.message}</p>}
          </div>

          {error && (
            <div className="p-4 bg-red-50 border border-red-200 text-red-600 rounded-xl flex items-center gap-3">
              <AlertCircle size={20} />
              <p className="text-sm font-medium">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-black text-white py-4 rounded-2xl text-lg font-black uppercase tracking-widest flex items-center justify-center gap-3 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                Kayıt Ol <UserPlus size={20} />
              </>
            )}
          </button>
        </form>

        <p className="text-center mt-6 text-sm text-black/60">
          Zaten hesabınız var mı? <Link to="/login" className="text-black font-bold hover:underline">Giriş Yap</Link>
        </p>
      </motion.div>
    </div>
  );
}
